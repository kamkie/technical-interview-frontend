const fencePattern = /^\s{0,3}(```+|~~~+)/
const listItemPattern = /^(\s*)(?:[-+*]|\d+[.)])\s+/
const tableSeparatorCellPattern = /^:?-{3,}:?$/

export function checkAlignedTables(lines) {
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
      failures.push({
        lineNumber: start + 1,
        detail: 'invalid Markdown table block.',
        context: block[0],
      })
      continue
    }

    if (!arraysEqual(block, formatted)) {
      failures.push({
        lineNumber: start + 1,
        detail: `table is not aligned. Expected:\n${formatted.join('\n')}`,
        context: block[0],
      })
    }
  }

  return failures
}

export function checkHardWraps(lines) {
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
      failures.push({
        lineNumber,
        detail:
          'list item uses an indented prose continuation; use one physical line or nested block syntax.',
        context: line,
      })
      previousOrdinaryLine = undefined
      continue
    }

    if (activeListIndent !== undefined && previousListItemLine !== undefined) {
      failures.push({
        lineNumber,
        detail: `list item prose continues from line ${previousListItemLine}; keep list item text on one physical line or use nested block syntax.`,
        context: line,
      })
      previousListItemLine = undefined
    }

    if (previousOrdinaryLine !== undefined) {
      failures.push({
        lineNumber,
        detail: `hard-wrapped prose follows line ${previousOrdinaryLine}; keep paragraph prose on one physical line.`,
        context: line,
      })
    }

    previousOrdinaryLine = lineNumber
  }

  return failures
}

export function formatMarkdownText(text) {
  const hadFinalNewline = text.endsWith('\n') || text.endsWith('\r')
  const normalized = text.replace(/\r\n?/g, '\n')
  const lines = normalized.split('\n')

  if (lines.at(-1) === '') {
    lines.pop()
  }

  const formattedLines = formatHardWraps(formatTables(lines))
  const output = formattedLines.join('\n')

  return output.length === 0 ? output : `${output}${hadFinalNewline ? '\n' : '\n'}`
}

function formatTables(lines) {
  const formattedLines = [...lines]
  const tableLineNumbers = collectTableLineNumbers(lines)
  let lineIndex = 0

  while (lineIndex < formattedLines.length) {
    if (!tableLineNumbers.has(lineIndex)) {
      lineIndex += 1
      continue
    }

    const start = lineIndex
    while (lineIndex < formattedLines.length && tableLineNumbers.has(lineIndex)) {
      lineIndex += 1
    }

    const formatted = formatTableBlock(formattedLines.slice(start, lineIndex))
    if (formatted) {
      formattedLines.splice(start, formatted.length, ...formatted)
    }
  }

  return formattedLines
}

function formatHardWraps(lines) {
  const tableLineNumbers = collectTableLineNumbers(lines)
  const output = []
  let inFence = false
  let fenceMarker = ''
  let activeListIndex
  let activeListIndent
  let paragraphIndex

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex]
    const fence = line.match(fencePattern)

    if (fence && (!inFence || fence[1].startsWith(fenceMarker[0]))) {
      inFence = !inFence
      fenceMarker = inFence ? fence[1] : ''
      activeListIndex = undefined
      paragraphIndex = undefined
      output.push(line)
      continue
    }

    if (inFence || tableLineNumbers.has(lineIndex)) {
      activeListIndex = undefined
      paragraphIndex = undefined
      output.push(line)
      continue
    }

    if (line.trim() === '') {
      activeListIndex = undefined
      activeListIndent = undefined
      paragraphIndex = undefined
      output.push(line)
      continue
    }

    const listItem = line.match(listItemPattern)
    if (listItem) {
      activeListIndex = output.length
      activeListIndent = listItem[1].length
      paragraphIndex = undefined
      output.push(line)
      continue
    }

    if (isAllowedBlockLine(line)) {
      activeListIndex = undefined
      paragraphIndex = undefined
      output.push(line)
      continue
    }

    const indentation = line.match(/^\s*/)[0].length
    if (activeListIndex !== undefined && indentation >= activeListIndent) {
      output[activeListIndex] = `${output[activeListIndex].trimEnd()} ${line.trim()}`
      continue
    }

    if (paragraphIndex !== undefined) {
      output[paragraphIndex] = `${output[paragraphIndex].trimEnd()} ${line.trim()}`
      continue
    }

    activeListIndex = undefined
    paragraphIndex = output.length
    output.push(line)
  }

  return output
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

    if (inFence || !line.includes('|')) {
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
