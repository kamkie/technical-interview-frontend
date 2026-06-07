import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const repoRoot = resolve(import.meta.dirname, '..')
const fencePattern = /^\s{0,3}(```+|~~~+)/
const listItemPattern = /^(\s*)(?:[-+*]|\d+[.)])\s+/
const tableSeparatorCellPattern = /^:?-{3,}:?$/

async function main() {
  const markdownFiles = await trackedMarkdownFiles()
  const failures = []

  for (const filePath of markdownFiles) {
    failures.push(...(await checkMarkdownFile(filePath)))
  }

  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(failure)
    }

    process.exitCode = 1
    return
  }

  console.log(`Checked ${markdownFiles.length} tracked Markdown files.`)
}

async function trackedMarkdownFiles() {
  const { stdout } = await execFileAsync('git', ['ls-files', '--', '*.md'], {
    cwd: repoRoot,
    encoding: 'utf8',
    windowsHide: true,
  })

  return stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

async function checkMarkdownFile(filePath) {
  const absolutePath = resolve(repoRoot, filePath)
  const relativePath = relative(repoRoot, absolutePath)
  const bytes = await readFile(absolutePath)
  const failures = []

  if (bytes.includes(0x0d)) {
    failures.push(`${relativePath}: contains CR bytes; use LF line endings.`)
  }

  if (bytes.length > 0 && bytes.at(-1) !== 0x0a) {
    failures.push(`${relativePath}: missing final newline.`)
  }

  const lines = bytes.toString('utf8').split('\n')
  if (lines.at(-1) === '') {
    lines.pop()
  }

  failures.push(...checkTables(relativePath, lines))
  failures.push(...checkHardWraps(relativePath, lines))

  return failures
}

function checkTables(relativePath, lines) {
  const failures = []
  const tableLineNumbers = collectTableLineNumbers(lines)
  let lineIndex = 0

  while (lineIndex < lines.length) {
    if (!tableLineNumbers.has(lineIndex)) {
      lineIndex += 1
      continue
    }

    const start = lineIndex
    while (lineIndex < lines.length && tableLineNumbers.has(lineIndex)) {
      lineIndex += 1
    }

    const block = lines.slice(start, lineIndex)
    const formatted = formatTableBlock(block)

    if (!formatted) {
      failures.push(`${relativePath}:${start + 1}: invalid Markdown table block.`)
      continue
    }

    if (!arraysEqual(block, formatted)) {
      failures.push(
        [
          `${relativePath}:${start + 1}: table is not aligned. Expected:`,
          ...formatted.map((line) => `  ${line}`),
        ].join('\n'),
      )
    }
  }

  return failures
}

function collectTableLineNumbers(lines) {
  const tableLineNumbers = new Set()
  let inFence = false
  let fenceMarker = ''

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex]
    const fence = line.match(fencePattern)

    if (fence && (!inFence || fence[1].startsWith(fenceMarker[0]))) {
      inFence = !inFence
      fenceMarker = inFence ? fence[1] : ''
      continue
    }

    if (inFence) {
      continue
    }

    if (!line.includes('|')) {
      continue
    }

    if (isTableSeparatorLine(line)) {
      tableLineNumbers.add(lineIndex)

      if (lineIndex > 0 && lines[lineIndex - 1].includes('|')) {
        tableLineNumbers.add(lineIndex - 1)
      }

      let nextLineIndex = lineIndex + 1
      while (nextLineIndex < lines.length && lines[nextLineIndex].includes('|')) {
        tableLineNumbers.add(nextLineIndex)
        nextLineIndex += 1
      }
    }
  }

  return tableLineNumbers
}

function formatTableBlock(block) {
  if (block.length < 2 || !isTableSeparatorLine(block[1])) {
    return undefined
  }

  const parsedRows = block.map((line) => parseTableRow(line))
  if (parsedRows.some((row) => !row)) {
    return undefined
  }

  const separator = parseSeparatorRow(parsedRows[1])
  if (!separator) {
    return undefined
  }

  const columnCount = parsedRows[0].length
  if (
    parsedRows.some((row) => row.length !== columnCount) ||
    separator.length !== columnCount
  ) {
    return undefined
  }

  const widths = Array.from({ length: columnCount }, (_, columnIndex) => {
    const contentWidth = Math.max(
      ...parsedRows
        .filter((_, rowIndex) => rowIndex !== 1)
        .map((row) => row[columnIndex].length),
    )
    const alignmentWidth = separatorMinimumWidth(separator[columnIndex])

    return Math.max(contentWidth, alignmentWidth)
  })

  return parsedRows.map((row, rowIndex) => {
    if (rowIndex === 1) {
      return renderSeparatorRow(separator, widths)
    }

    return renderTableRow(row, widths, separator)
  })
}

function parseTableRow(line) {
  const trimmed = line.trim()

  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) {
    return undefined
  }

  return splitUnescapedPipes(trimmed.slice(1, -1)).map((cell) => cell.trim())
}

function parseSeparatorRow(row) {
  if (!row.every((cell) => tableSeparatorCellPattern.test(cell))) {
    return undefined
  }

  return row.map((cell) => {
    const left = cell.startsWith(':')
    const right = cell.endsWith(':')

    if (left && right) {
      return 'center'
    }

    if (right) {
      return 'right'
    }

    if (left) {
      return 'left'
    }

    return 'none'
  })
}

function renderTableRow(row, widths, separator) {
  return `| ${row
    .map((cell, index) => alignCell(cell, widths[index], separator[index]))
    .join(' | ')} |`
}

function renderSeparatorRow(separator, widths) {
  return renderTableRow(
    separator.map((alignment, index) => {
      const width = widths[index]

      if (alignment === 'center') {
        return `:${'-'.repeat(width - 2)}:`
      }

      if (alignment === 'right') {
        return `${'-'.repeat(width - 1)}:`
      }

      if (alignment === 'left') {
        return `:${'-'.repeat(width - 1)}`
      }

      return '-'.repeat(width)
    }),
    widths,
    separator.map(() => 'none'),
  )
}

function separatorMinimumWidth(alignment) {
  if (alignment === 'center') {
    return 5
  }

  if (alignment === 'left' || alignment === 'right') {
    return 4
  }

  return 3
}

function alignCell(cell, width, alignment) {
  if (alignment === 'right') {
    return cell.padStart(width)
  }

  if (alignment === 'center') {
    const totalPadding = width - cell.length
    const leftPadding = Math.floor(totalPadding / 2)
    const rightPadding = totalPadding - leftPadding

    return `${' '.repeat(leftPadding)}${cell}${' '.repeat(rightPadding)}`
  }

  return cell.padEnd(width)
}

function splitUnescapedPipes(value) {
  const cells = []
  let cell = ''
  let escaped = false

  for (const character of value) {
    if (escaped) {
      cell += character
      escaped = false
      continue
    }

    if (character === '\\') {
      cell += character
      escaped = true
      continue
    }

    if (character === '|') {
      cells.push(cell)
      cell = ''
      continue
    }

    cell += character
  }

  cells.push(cell)
  return cells
}

function isTableSeparatorLine(line) {
  const row = parseTableRow(line)
  return Boolean(row && parseSeparatorRow(row))
}

function checkHardWraps(relativePath, lines) {
  const failures = []
  const tableLineNumbers = collectTableLineNumbers(lines)
  let inFence = false
  let fenceMarker = ''
  let previousOrdinaryLine
  let activeListIndent
  let previousListItemLine

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex]
    const lineNumber = lineIndex + 1
    const fence = line.match(fencePattern)

    if (fence && (!inFence || fence[1].startsWith(fenceMarker[0]))) {
      inFence = !inFence
      fenceMarker = inFence ? fence[1] : ''
      previousOrdinaryLine = undefined
      previousListItemLine = undefined
      continue
    }

    if (inFence || tableLineNumbers.has(lineIndex)) {
      previousOrdinaryLine = undefined
      previousListItemLine = undefined
      continue
    }

    if (line.trim() === '') {
      previousOrdinaryLine = undefined
      activeListIndent = undefined
      previousListItemLine = undefined
      continue
    }

    const listItem = line.match(listItemPattern)
    if (listItem) {
      activeListIndent = listItem[1].length
      previousListItemLine = lineNumber
      previousOrdinaryLine = undefined
      continue
    }

    if (isAllowedBlockLine(line)) {
      previousOrdinaryLine = undefined
      previousListItemLine = undefined
      continue
    }

    const indentation = line.match(/^\s*/)[0].length
    if (activeListIndent !== undefined && indentation > activeListIndent) {
      failures.push(
        `${relativePath}:${lineNumber}: list item uses an indented prose continuation; use one physical line or nested block syntax.`,
      )
      previousOrdinaryLine = undefined
      continue
    }

    if (activeListIndent !== undefined && previousListItemLine !== undefined) {
      failures.push(
        `${relativePath}:${lineNumber}: list item prose continues from line ${previousListItemLine}; keep list item text on one physical line or use nested block syntax.`,
      )
      previousListItemLine = undefined
    }

    if (previousOrdinaryLine !== undefined) {
      failures.push(
        `${relativePath}:${lineNumber}: hard-wrapped prose follows line ${previousOrdinaryLine}; keep paragraph prose on one physical line.`,
      )
    }

    previousOrdinaryLine = lineNumber
  }

  return failures
}

function isAllowedBlockLine(line) {
  const trimmed = line.trim()

  return (
    /^(#{1,6})\s+/.test(trimmed) ||
    /^>/.test(trimmed) ||
    /^-{3,}$/.test(trimmed) ||
    /^\*{3,}$/.test(trimmed) ||
    /^_{3,}$/.test(trimmed) ||
    /^\[[^\]]+\]:\s+/.test(trimmed) ||
    /^<!--/.test(trimmed) ||
    /^<\/?[A-Za-z][^>]*>$/.test(trimmed) ||
    /^\|/.test(trimmed) ||
    /^\s{4,}\S/.test(line)
  )
}

function arraysEqual(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
