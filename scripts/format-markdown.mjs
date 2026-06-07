import { execFile } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { promisify } from 'node:util'

import { formatMarkdownText } from './markdownlint-rules/markdown-format-utils.mjs'

const execFileAsync = promisify(execFile)
const repoRoot = resolve(import.meta.dirname, '..')

async function main() {
  const changedFiles = []

  for (const filePath of await trackedMarkdownFiles()) {
    const absolutePath = resolve(repoRoot, filePath)
    const original = await readFile(absolutePath, 'utf8')
    const formatted = formatMarkdownText(original)

    if (formatted !== original) {
      await writeFile(absolutePath, formatted, 'utf8')
      changedFiles.push(relative(repoRoot, absolutePath))
    }
  }

  if (changedFiles.length === 0) {
    console.log('Markdown files already formatted.')
    return
  }

  console.log(`Formatted ${changedFiles.length} Markdown file(s):`)
  for (const filePath of changedFiles) {
    console.log(`- ${filePath}`)
  }
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

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
