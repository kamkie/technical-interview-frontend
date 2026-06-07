import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { promisify } from 'node:util'

import mermaid from 'mermaid'

const execFileAsync = promisify(execFile)
const repoRoot = resolve(import.meta.dirname, '..')

mermaid.initialize({
  startOnLoad: false,
})

async function main() {
  const failures = []
  let diagramCount = 0
  const filesWithDiagrams = new Set()

  for (const filePath of await trackedMarkdownFiles()) {
    const absolutePath = resolve(repoRoot, filePath)
    const markdown = await readFile(absolutePath, 'utf8')
    const diagrams = extractMermaidBlocks(markdown)

    for (const diagram of diagrams) {
      diagramCount += 1
      filesWithDiagrams.add(filePath)

      try {
        await mermaid.parse(diagram.source)
      } catch (error) {
        failures.push(
          `${filePath}:${diagram.line}: Mermaid parse failed: ${formatError(error)}`,
        )
      }
    }
  }

  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(failure)
    }

    process.exitCode = 1
    return
  }

  console.log(
    `Checked ${diagramCount} Mermaid diagram(s) in ${filesWithDiagrams.size} Markdown file(s).`,
  )
}

function extractMermaidBlocks(markdown) {
  const diagrams = []
  const lines = markdown.split(/\r?\n/)
  let activeFence

  for (const [index, line] of lines.entries()) {
    if (activeFence) {
      if (isClosingFence(line, activeFence.marker, activeFence.length)) {
        if (activeFence.isMermaid) {
          diagrams.push({
            line: activeFence.line,
            source: activeFence.content.join('\n').trim(),
          })
        }

        activeFence = undefined
        continue
      }

      if (activeFence.isMermaid) {
        activeFence.content.push(line)
      }

      continue
    }

    const openingFence = parseOpeningFence(line)

    if (!openingFence) {
      continue
    }

    activeFence = {
      ...openingFence,
      content: [],
      isMermaid: isMermaidInfo(openingFence.info),
      line: index + 1,
    }
  }

  if (activeFence?.isMermaid) {
    diagrams.push({
      line: activeFence.line,
      source: activeFence.content.join('\n').trim(),
    })
  }

  return diagrams
}

function parseOpeningFence(line) {
  const match = /^( {0,3})(`{3,}|~{3,})(.*)$/.exec(line)

  if (!match) {
    return undefined
  }

  const fence = match[2]

  return {
    info: match[3].trim(),
    length: fence.length,
    marker: fence[0],
  }
}

function isClosingFence(line, marker, length) {
  const match = /^( {0,3})(`{3,}|~{3,})\s*$/.exec(line)

  return match !== null && match[2][0] === marker && match[2].length >= length
}

function isMermaidInfo(info) {
  return info.split(/\s+/)[0]?.toLowerCase() === 'mermaid'
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

function formatError(error) {
  if (error instanceof Error && error.message) {
    return error.message.replace(/\s+/g, ' ').trim()
  }

  return String(error).replace(/\s+/g, ' ').trim()
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
