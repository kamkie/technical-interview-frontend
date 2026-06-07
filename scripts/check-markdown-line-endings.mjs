import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const repoRoot = resolve(import.meta.dirname, '..')

async function main() {
  const failures = []

  for (const filePath of await trackedMarkdownFiles()) {
    const absolutePath = resolve(repoRoot, filePath)
    const bytes = await readFile(absolutePath)

    if (bytes.includes(0x0d)) {
      failures.push(`${relative(repoRoot, absolutePath)}: contains CR bytes; use LF line endings.`)
    }
  }

  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(failure)
    }

    process.exitCode = 1
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
