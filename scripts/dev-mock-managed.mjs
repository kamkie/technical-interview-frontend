#!/usr/bin/env node

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  DEFAULT_VITE_HOST,
  DEFAULT_VITE_PORT,
  startViteServer,
} from './with-vite.mjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

let resolveShutdown
let serverInfo
let shuttingDown = false

async function main() {
  const config = parseArgs(process.argv.slice(2))

  if (config.help) {
    printUsage()
    return
  }

  serverInfo = await startViteServer({
    host: config.host,
    logLevel: 'info',
    mode: 'mock',
    port: config.port,
    strictPort: config.strictPort,
  })

  console.log('Managed Vite mock server')
  console.log(`URL: ${serverInfo.origin}/`)
  console.log(`PID: ${process.pid}`)
  console.log(`Command: ${process.argv.map(quoteArg).join(' ')}`)
  console.log(`State: ${path.relative(repoRoot, serverInfo.statePath)}`)
  console.log('Press Ctrl+C to stop.')

  await new Promise((resolve) => {
    resolveShutdown = resolve
  })
}

async function shutdown(reason, exitCode = 0) {
  if (shuttingDown) {
    return
  }

  shuttingDown = true
  console.log(`Stopping managed Vite mock server (${reason})...`)

  try {
    if (serverInfo) {
      await serverInfo.close()
    }
    console.log(`Post-stop port check passed for ${serverInfo?.origin ?? 'Vite'}.`)
  } catch (error) {
    console.error(`Managed Vite mock cleanup failed: ${formatError(error)}`)
    process.exitCode = 1
  }

  if (exitCode !== 0) {
    process.exitCode = exitCode
  }

  resolveShutdown?.()
}

function parseArgs(args) {
  const config = {
    help: false,
    host: DEFAULT_VITE_HOST,
    port: DEFAULT_VITE_PORT,
    strictPort: false,
  }

  for (let index = 0; index < args.length; index += 1) {
    const option = args[index]

    switch (option) {
      case '--help':
      case '-h':
        config.help = true
        break
      case '--host':
        config.host = readOptionValue(args, index, option)
        index += 1
        break
      case '--port':
        config.port = parsePort(readOptionValue(args, index, option), DEFAULT_VITE_PORT)
        index += 1
        break
      case '--strictPort':
        config.strictPort = true
        break
      default:
        throw new Error(`Unknown dev:mock:managed option: ${option}`)
    }
  }

  return config
}

function readOptionValue(args, index, option) {
  const value = args[index + 1]

  if (value === undefined || value.startsWith('--')) {
    throw new Error(`${option} requires a value`)
  }

  return value
}

function parsePort(value, fallback) {
  const parsed = Number.parseInt(String(value ?? fallback), 10)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function quoteArg(arg) {
  if (/^[A-Za-z0-9_./:=@-]+$/.test(arg)) {
    return arg
  }

  return JSON.stringify(arg)
}

function formatError(error) {
  if (error instanceof Error) {
    return error.stack ?? error.message
  }

  return String(error)
}

function printUsage() {
  console.log(
    [
      'Usage: npm run dev:mock:managed -- [--host 127.0.0.1] [--port 5173] [--strictPort]',
      '',
      'Starts Vite mock mode through the Vite Node API, records PID and port under temp/dev-servers, and closes the server on exit.',
    ].join('\n'),
  )
}

process.once('SIGINT', () => {
  void shutdown('SIGINT')
})
process.once('SIGTERM', () => {
  void shutdown('SIGTERM')
})
process.once('SIGHUP', () => {
  void shutdown('SIGHUP')
})
process.once('uncaughtException', (error) => {
  console.error(formatError(error))
  void shutdown('uncaught exception', 1)
})
process.once('unhandledRejection', (error) => {
  console.error(formatError(error))
  void shutdown('unhandled rejection', 1)
})

try {
  await main()
} catch (error) {
  console.error(formatError(error))
  process.exitCode = 1
}
