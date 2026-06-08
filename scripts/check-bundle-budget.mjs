import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, extname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const configPath = resolve(repoRoot, 'bundle-budget.config.json')
const distRoot = resolve(repoRoot, 'dist')
const reportPath = resolve(
  repoRoot,
  process.env.FRONTEND_BUNDLE_BUDGET_REPORT ??
    'temp/hardening/bundle-budget-report.json',
)

async function main() {
  const config = JSON.parse(await readFile(configPath, 'utf8'))
  const files = await listFiles(distRoot)
  const actual = summarizeFiles(files)
  const warningMultiplier = 1 + config.warningThresholdPercent / 100
  const budgets = buildBudgets(config.baseline, warningMultiplier)
  const warnings = findWarnings(actual, budgets, config.baseline)
  const report = {
    generatedAt: new Date().toISOString(),
    mode: 'advisory',
    warningThresholdPercent: config.warningThresholdPercent,
    baseline: config.baseline,
    budgets,
    actual,
    warnings,
  }

  await mkdir(dirname(reportPath), { recursive: true })
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')

  if (warnings.length > 0) {
    console.warn('Bundle budget advisory warnings:')
    for (const warning of warnings) {
      console.warn(
        `- ${warning.name}: ${formatBytes(warning.actualBytes)} exceeds ${formatBytes(
          warning.budgetBytes,
        )} (${formatBytes(warning.baselineBytes)} baseline + ${
          config.warningThresholdPercent
        }%)`,
      )
    }
  } else {
    console.log('Bundle budget advisory check passed without warnings.')
  }

  console.log(`Bundle budget report written to ${relative(repoRoot, reportPath)}.`)
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const entryPath = resolve(directory, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await listFiles(entryPath)))
      continue
    }

    if (entry.isFile()) {
      const entryStat = await stat(entryPath)
      files.push({
        path: entryPath,
        relativePath: relative(distRoot, entryPath).replaceAll('\\', '/'),
        bytes: entryStat.size,
        category: categorize(entryPath),
      })
    }
  }

  return files
}

function summarizeFiles(files) {
  const summary = {
    totalBytes: 0,
    javascriptBytes: 0,
    cssBytes: 0,
    htmlBytes: 0,
    assetBytes: 0,
    sourceMapBytes: 0,
    files,
  }

  for (const file of files) {
    if (file.category === 'sourceMap') {
      summary.sourceMapBytes += file.bytes
      continue
    }

    summary.totalBytes += file.bytes

    if (file.category === 'javascript') {
      summary.javascriptBytes += file.bytes
    } else if (file.category === 'css') {
      summary.cssBytes += file.bytes
    } else if (file.category === 'html') {
      summary.htmlBytes += file.bytes
    } else {
      summary.assetBytes += file.bytes
    }
  }

  return summary
}

function buildBudgets(baseline, warningMultiplier) {
  return Object.fromEntries(
    Object.entries(baseline).map(([name, baselineBytes]) => [
      name,
      Math.ceil(baselineBytes * warningMultiplier),
    ]),
  )
}

function findWarnings(actual, budgets, baseline) {
  return Object.entries(budgets)
    .filter(([name, budgetBytes]) => actual[name] > budgetBytes)
    .map(([name, budgetBytes]) => ({
      name,
      baselineBytes: baseline[name],
      budgetBytes,
      actualBytes: actual[name],
    }))
}

function categorize(filePath) {
  const extension = extname(filePath).toLowerCase()

  if (extension === '.js') {
    return 'javascript'
  }

  if (extension === '.css') {
    return 'css'
  }

  if (extension === '.html') {
    return 'html'
  }

  if (extension === '.map') {
    return 'sourceMap'
  }

  return 'asset'
}

function formatBytes(bytes) {
  return `${bytes.toLocaleString('en-US')} bytes`
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
