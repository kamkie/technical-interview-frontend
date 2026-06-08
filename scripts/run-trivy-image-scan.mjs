import { spawnSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const image = process.env.FRONTEND_IMAGE ?? 'technical-interview-frontend'
const reportPath = process.env.FRONTEND_TRIVY_REPORT
  ? resolve(repoRoot, process.env.FRONTEND_TRIVY_REPORT)
  : undefined
const severity = 'HIGH,CRITICAL'
const args = [
  'image',
  '--scanners',
  'vuln',
  '--exit-code',
  '1',
  '--severity',
  severity,
]

if (reportPath) {
  mkdirSync(dirname(reportPath), { recursive: true })
  args.push('--format', 'json', '--output', reportPath)
}

args.push(image)

const result = spawnSync('trivy', args, {
  encoding: 'utf8',
  stdio: 'inherit',
})

if (result.error?.code === 'ENOENT') {
  console.error('trivy is unavailable. Install it to run M20 container image scans.')
  process.exitCode = 1
} else if (result.status !== 0) {
  console.error(
    `trivy ${args.join(' ')} failed with exit code ${result.status}; high or critical findings block this check when present.`,
  )
  if (reportPath) {
    console.error(`Trivy report path: ${relative(repoRoot, reportPath)}`)
  }
  process.exitCode = result.status ?? 1
} else {
  console.log(
    `Trivy image scan passed for ${image}; no high or critical vulnerability findings were reported.`,
  )
  if (reportPath) {
    console.log(`Trivy report written to ${relative(repoRoot, reportPath)}.`)
  }
}
