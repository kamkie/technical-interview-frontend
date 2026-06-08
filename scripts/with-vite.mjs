#!/usr/bin/env node

import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createServer } from 'vite'

export const DEFAULT_VITE_HOST = '127.0.0.1'
export const DEFAULT_VITE_PORT = 5173

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const configFile = path.join(repoRoot, 'vite.config.ts')
const stateDir = path.join(repoRoot, 'temp', 'dev-servers')
const DEFAULT_PORT_CHECK_TIMEOUT_MS = 2500
const PORT_CHECK_INTERVAL_MS = 100

export async function withViteServer(options, callback) {
  const viteServer = await startViteServer(options)
  let callbackError
  let result

  try {
    result = await callback(viteServer)
  } catch (error) {
    callbackError = error
  }

  try {
    await closeViteServer(viteServer)
  } catch (error) {
    if (callbackError !== undefined) {
      console.error(
        `[with-vite] Vite cleanup failed after callback failure: ${formatError(error)}`,
      )
    } else {
      throw error
    }
  }

  if (callbackError !== undefined) {
    throw callbackError
  }

  return result
}

export async function startViteServer(options = {}) {
  const host = options.host ?? DEFAULT_VITE_HOST
  const requestedPort = parsePort(options.port, DEFAULT_VITE_PORT)
  const strictPort = options.strictPort === true
  const mode = options.mode ?? 'development'
  const viteServer = await createServer({
    configFile,
    logLevel: options.logLevel ?? 'error',
    mode,
    server: {
      host,
      port: requestedPort,
      strictPort,
    },
  })

  try {
    await viteServer.listen()
  } catch (error) {
    await viteServer.close()
    throw error
  }

  const address = viteServer.httpServer?.address()
  const port =
    typeof address === 'object' && address !== null ? address.port : requestedPort
  const origin = `http://${formatUrlHost(host)}:${port}`
  let statePath

  try {
    statePath = await writeStateFile({ host, mode, origin, port, strictPort })
  } catch (error) {
    await viteServer.close()
    throw error
  }

  return {
    close: () => closeViteServer({ host, port, statePath, viteServer }),
    host,
    mode,
    origin,
    port,
    statePath,
    strictPort,
    viteServer,
  }
}

export async function closeViteServer(serverInfo) {
  let closeError

  try {
    await serverInfo.viteServer.close()
    await waitForPortClosed(serverInfo.host, serverInfo.port)
  } catch (error) {
    closeError = error
  }

  if (serverInfo.statePath) {
    await fs.rm(serverInfo.statePath, { force: true })
  }

  if (closeError !== undefined) {
    throw closeError
  }
}

async function writeStateFile(info) {
  await fs.mkdir(stateDir, { recursive: true })

  const filePath = path.join(stateDir, `vite-${process.pid}-${info.port}.json`)
  const state = {
    command: process.argv,
    cwd: repoRoot,
    host: info.host,
    mode: info.mode,
    origin: info.origin,
    pid: process.pid,
    port: info.port,
    startedAt: new Date().toISOString(),
    strictPort: info.strictPort,
  }

  await fs.writeFile(`${filePath}.tmp`, `${JSON.stringify(state, null, 2)}\n`)
  await fs.rename(`${filePath}.tmp`, filePath)

  return filePath
}

export async function waitForPortClosed(
  host,
  port,
  timeoutMs = DEFAULT_PORT_CHECK_TIMEOUT_MS,
) {
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    if (!(await isPortOpen(host, port))) {
      return
    }

    await delay(PORT_CHECK_INTERVAL_MS)
  }

  throw new Error(
    `port ${port} on ${host} was still listening after ${timeoutMs}ms`,
  )
}

async function isPortOpen(host, port) {
  const connectHost = normalizeConnectHost(host)

  return await new Promise((resolve) => {
    const socket = net.connect({ host: connectHost, port })

    socket.setTimeout(PORT_CHECK_INTERVAL_MS)
    socket.once('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.once('error', () => {
      resolve(false)
    })
    socket.once('timeout', () => {
      socket.destroy()
      resolve(false)
    })
  })
}

function normalizeConnectHost(host) {
  if (host === '0.0.0.0' || host === '::') {
    return DEFAULT_VITE_HOST
  }

  return host
}

function formatUrlHost(host) {
  const normalizedHost = normalizeConnectHost(host)

  if (normalizedHost.includes(':') && !normalizedHost.startsWith('[')) {
    return `[${normalizedHost}]`
  }

  return normalizedHost
}

function parsePort(value, fallback) {
  const parsed = Number.parseInt(String(value ?? fallback), 10)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function formatError(error) {
  if (error instanceof Error) {
    return error.stack ?? error.message
  }

  return String(error)
}

async function main() {
  const config = parseCliArgs(process.argv.slice(2))

  if (config.help) {
    printUsage()
    return
  }

  if (config.command.length === 0) {
    printUsage()
    throw new Error('with-vite requires a command after --')
  }

  await withViteServer(config.server, async (serverInfo) => {
    console.log(
      `[with-vite] ${serverInfo.mode} server listening at ${serverInfo.origin}/`,
    )

    const exitCode = await runCommand(config.command, {
      FRONTEND_SMOKE_URL: `${serverInfo.origin}/`,
      FRONTEND_VITE_ORIGIN: serverInfo.origin,
    })

    if (exitCode !== 0) {
      process.exitCode = exitCode
    }
  })
}

function parseCliArgs(args) {
  const separatorIndex = args.indexOf('--')
  const optionArgs =
    separatorIndex === -1 ? args : args.slice(0, separatorIndex)
  const command = separatorIndex === -1 ? [] : args.slice(separatorIndex + 1)
  const server = {
    host: DEFAULT_VITE_HOST,
    port: DEFAULT_VITE_PORT,
  }

  for (let index = 0; index < optionArgs.length; index += 1) {
    const option = optionArgs[index]

    switch (option) {
      case '--help':
      case '-h':
        return { command, help: true, server }
      case '--host':
        server.host = readOptionValue(optionArgs, index, option)
        index += 1
        break
      case '--mode':
        server.mode = readOptionValue(optionArgs, index, option)
        index += 1
        break
      case '--port':
        server.port = parsePort(readOptionValue(optionArgs, index, option), DEFAULT_VITE_PORT)
        index += 1
        break
      case '--strictPort':
        server.strictPort = true
        break
      default:
        throw new Error(`Unknown with-vite option: ${option}`)
    }
  }

  return { command, help: false, server }
}

function readOptionValue(args, index, option) {
  const value = args[index + 1]

  if (value === undefined || value.startsWith('--')) {
    throw new Error(`${option} requires a value`)
  }

  return value
}

async function runCommand(command, extraEnv) {
  return await new Promise((resolve, reject) => {
    const commandSpec = resolveCommandSpec(command)
    const child = spawn(commandSpec.executable, commandSpec.args, {
      cwd: repoRoot,
      env: {
        ...process.env,
        ...extraEnv,
      },
      stdio: 'inherit',
    })

    child.once('error', reject)
    child.once('exit', (code, signal) => {
      if (signal) {
        console.error(`[with-vite] command exited from signal ${signal}`)
        resolve(1)
        return
      }

      resolve(code ?? 1)
    })
  })
}

function resolveCommandSpec(command) {
  const executable = command[0]
  const args = command.slice(1)

  if (process.platform !== 'win32' || !requiresCmdShim(executable)) {
    return { args, executable }
  }

  return {
    args: ['/d', '/s', '/c', [resolveCmdExecutable(executable), ...args].map(quoteCmdArg).join(' ')],
    executable: process.env.ComSpec ?? 'cmd.exe',
  }
}

function requiresCmdShim(executable) {
  const normalized = executable.toLowerCase()

  return (
    normalized === 'npm' ||
    normalized.endsWith('.cmd') ||
    normalized.endsWith('.bat')
  )
}

function resolveCmdExecutable(executable) {
  if (executable.toLowerCase() === 'npm') {
    return 'npm.cmd'
  }

  return executable
}

function quoteCmdArg(arg) {
  if (/^[A-Za-z0-9_./:=@-]+$/.test(arg)) {
    return arg
  }

  return `"${arg.replace(/(["^&|<>])/g, '^$1')}"`
}

function printUsage() {
  console.log(
    [
      'Usage: node scripts/with-vite.mjs [--mode mock] [--host 127.0.0.1] [--port 5173] [--strictPort] -- <command> [args...]',
      '',
      'Starts Vite with the Node API, exposes FRONTEND_SMOKE_URL and FRONTEND_VITE_ORIGIN to the command, then closes Vite in finally.',
    ].join('\n'),
  )
}

function isMain() {
  return (
    process.argv[1] !== undefined &&
    pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  )
}

if (isMain()) {
  try {
    await main()
  } catch (error) {
    console.error(formatError(error))
    process.exitCode = 1
  }
}
