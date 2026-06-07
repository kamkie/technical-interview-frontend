import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outputRoot = resolve(repoRoot, 'temp/hardening/rendered')
const renderTargets = [
  {
    file: 'kustomize-base.yaml',
    command: 'kubectl',
    args: ['kustomize', 'infra/k8s/base'],
  },
  {
    file: 'kustomize-local.yaml',
    command: 'kubectl',
    args: ['kustomize', 'infra/k8s/overlays/local'],
  },
  {
    file: 'helm-base.yaml',
    command: 'helm',
    args: [
      'template',
      'technical-interview-frontend',
      'infra/helm/technical-interview-frontend',
    ],
  },
  {
    file: 'helm-local.yaml',
    command: 'helm',
    args: [
      'template',
      'technical-interview-frontend',
      'infra/helm/technical-interview-frontend',
      '-f',
      'infra/helm/technical-interview-frontend/values-local.yaml',
    ],
  },
]

async function main() {
  await rm(outputRoot, { recursive: true, force: true })
  await mkdir(outputRoot, { recursive: true })

  for (const target of renderTargets) {
    const output = runRequiredCommand(target.command, target.args)
    const outputPath = resolve(outputRoot, target.file)
    await writeFile(outputPath, ensureTrailingNewline(output), 'utf8')
    console.log(`Rendered ${relative(repoRoot, outputPath)}.`)
  }

  const lintResult = spawnCommand('kube-linter', ['lint', outputRoot])

  writeCommandOutput(lintResult)

  if (lintResult.error?.code === 'ENOENT') {
    throw new Error('kube-linter is unavailable. Install it to run M20 manifest checks.')
  }

  if (lintResult.status === 0) {
    console.log('kube-linter rendered-manifest check passed.')
    return
  }

  if (lintResult.status === null) {
    throw new Error('kube-linter did not finish cleanly.')
  }

  console.warn(
    `kube-linter exited ${lintResult.status}; treating rendered-manifest findings as advisory for M20 first pass.`,
  )
}

function runRequiredCommand(command, args) {
  const result = spawnCommand(command, args)

  if (result.error?.code === 'ENOENT') {
    throw new Error(`${command} is unavailable. Install it to render M20 manifests.`)
  }

  if (result.status !== 0) {
    writeCommandOutput(result)
    throw new Error(`${command} ${args.join(' ')} failed while rendering manifests.`)
  }

  if (!result.stdout.trim()) {
    throw new Error(`${command} ${args.join(' ')} rendered empty manifest output.`)
  }

  if (result.stderr.trim()) {
    process.stderr.write(result.stderr)
  }

  return result.stdout
}

function spawnCommand(command, args) {
  return spawnSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function writeCommandOutput(result) {
  if (result.stdout) {
    process.stdout.write(result.stdout)
  }

  if (result.stderr) {
    process.stderr.write(result.stderr)
  }
}

function ensureTrailingNewline(value) {
  return value.endsWith('\n') ? value : `${value}\n`
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
