import { spawnSync } from 'node:child_process'

const image = process.env.FRONTEND_IMAGE ?? 'technical-interview-frontend'
const severity = process.env.TRIVY_SEVERITY ?? 'HIGH,CRITICAL'
const args = [
  'image',
  '--scanners',
  'vuln',
  '--exit-code',
  '0',
  '--severity',
  severity,
  image,
]

const result = spawnSync('trivy', args, {
  encoding: 'utf8',
  stdio: 'inherit',
})

if (result.error?.code === 'ENOENT') {
  console.error('trivy is unavailable. Install it to run M20 container image scans.')
  process.exitCode = 1
} else if (result.status !== 0) {
  console.error(`trivy ${args.join(' ')} failed with exit code ${result.status}.`)
  process.exitCode = result.status ?? 1
} else {
  console.log(
    `Trivy image scan completed for ${image}; vulnerability findings are advisory because --exit-code is 0.`,
  )
}
