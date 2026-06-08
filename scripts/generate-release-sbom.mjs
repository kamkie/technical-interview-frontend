import { spawnSync } from 'node:child_process'
import { appendFile, mkdir, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outputRoot = resolve(
  repoRoot,
  process.env.FRONTEND_RELEASE_EVIDENCE_DIR ?? 'temp/hardening/release',
)
const sbomPath = resolve(outputRoot, 'technical-interview-frontend.sbom.spdx.json')
const licensePath = resolve(outputRoot, 'technical-interview-frontend.licenses.json')

async function main() {
  await mkdir(outputRoot, { recursive: true })

  const sbom = generateSpdxSbom()
  await writeFile(sbomPath, `${JSON.stringify(sbom, null, 2)}\n`, 'utf8')

  const licenseInventory = buildLicenseInventory(sbom)
  await writeFile(
    licensePath,
    `${JSON.stringify(licenseInventory, null, 2)}\n`,
    'utf8',
  )

  await writeGithubOutputs({
    sbom_path: relative(repoRoot, sbomPath).replaceAll('\\', '/'),
    license_path: relative(repoRoot, licensePath).replaceAll('\\', '/'),
  })

  console.log(`SPDX SBOM written to ${relative(repoRoot, sbomPath)}.`)
  console.log(`Report-only license inventory written to ${relative(repoRoot, licensePath)}.`)
}

function generateSpdxSbom() {
  const npmExecPath = process.env.npm_execpath
  const command = npmExecPath ? process.execPath : process.platform === 'win32' ? 'npm.cmd' : 'npm'
  const args = [
    ...(npmExecPath ? [npmExecPath] : []),
    'sbom',
    '--package-lock-only',
    '--sbom-format',
    'spdx',
  ]
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    throw new Error(
      `npm sbom failed with exit code ${result.status}.\n${result.stderr.trim()}`,
    )
  }

  return JSON.parse(result.stdout)
}

function buildLicenseInventory(sbom) {
  const packages = (sbom.packages ?? []).map((entry) => ({
    name: entry.name,
    version: entry.versionInfo ?? null,
    licenseDeclared: entry.licenseDeclared ?? 'NOASSERTION',
    licenseConcluded: entry.licenseConcluded ?? null,
    supplier: entry.supplier ?? null,
    downloadLocation: entry.downloadLocation ?? null,
  }))
  const licenseCounts = new Map()

  for (const entry of packages) {
    const license = entry.licenseDeclared
    licenseCounts.set(license, (licenseCounts.get(license) ?? 0) + 1)
  }

  return {
    generatedAt: new Date().toISOString(),
    source: 'npm sbom --package-lock-only --sbom-format spdx',
    policy: {
      mode: 'report-only',
      enforcement: 'none',
    },
    packageCount: packages.length,
    licenseCounts: Object.fromEntries(
      [...licenseCounts.entries()].sort(([left], [right]) =>
        left.localeCompare(right),
      ),
    ),
    packages,
  }
}

async function writeGithubOutputs(outputs) {
  if (!process.env.GITHUB_OUTPUT) {
    return
  }

  await appendFile(
    process.env.GITHUB_OUTPUT,
    Object.entries(outputs)
      .map(([name, value]) => `${name}=${value}`)
      .join('\n') + '\n',
    'utf8',
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
