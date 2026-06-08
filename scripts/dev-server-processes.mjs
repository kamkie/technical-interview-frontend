#!/usr/bin/env node

import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const normalizedRepoRoot = normalizeCommandText(repoRoot)
const stateDir = path.join(repoRoot, 'temp', 'dev-servers')
const isWindows = process.platform === 'win32'
const commandTimeoutMs = 10000

const repoDevServerMarkers = [
  /node_modules\/\.bin\/vite(?:\.cmd|\.ps1)?(?:\s|$|")/i,
  /node_modules\/\.bin\/+\.\.\/vite\/bin\/vite\.js/i,
  /node_modules\/vite\/bin\/vite\.js/i,
  /scripts\/dev-mock-managed\.mjs/i,
  /scripts\/with-vite\.mjs/i,
  /npm-cli\.js.*\srun\s+(?:dev|dev:mock|dev:mock:managed)(?:\s|$)/i,
  /\bnpm(?:\.cmd)?\s+run\s+(?:dev|dev:mock|dev:mock:managed)(?:\s|$)/i,
]
const stateBackedServerMarkers = [
  /scripts\/dev-mock-managed\.mjs/i,
  /scripts\/smoke-authenticated-mock\.mjs/i,
  /scripts\/with-vite\.mjs/i,
]

async function main() {
  const command = process.argv[2] ?? 'list'

  switch (command) {
    case 'list':
      await listDevServers()
      break
    case 'cleanup':
      await cleanupDevServers()
      break
    case '--help':
    case '-h':
      printUsage()
      break
    default:
      printUsage()
      throw new Error(`Unknown dev server process command: ${command}`)
  }
}

async function listDevServers() {
  const snapshot = await getSnapshot()
  const servers = findRepoDevServers(snapshot.processes, snapshot.statesByPid)

  printServerList(servers, snapshot.portsByPid)
}

async function cleanupDevServers() {
  const before = await getSnapshot()
  const servers = findRepoDevServers(before.processes, before.statesByPid)

  if (servers.length === 0) {
    printServerList(servers, before.portsByPid)
    return
  }

  const portsBeforeCleanup = collectPorts(servers, before.portsByPid)
  const roots = findRootProcesses(servers, before.processes)

  console.log(`Stopping ${roots.length} repo-local Vite/npm process chain(s).`)
  printServerList(servers, before.portsByPid)

  for (const processInfo of roots) {
    await stopProcessTree(processInfo.pid)
  }

  await delay(1000)

  const after = await getSnapshot()
  const remaining = findRepoDevServers(after.processes, after.statesByPid)
  const stillListening = findStillListeningPorts(
    portsBeforeCleanup,
    after.portsByPid,
  )

  if (remaining.length > 0) {
    console.error('Cleanup incomplete; repo-local Vite/npm servers remain.')
    printServerList(remaining, after.portsByPid)
    process.exitCode = 1
    return
  }

  await removeStateFiles(servers)

  console.log('Post-cleanup process check: no repo-local Vite/npm dev servers remain.')

  if (portsBeforeCleanup.length > 0) {
    if (stillListening.length > 0) {
      console.error(
        `Post-cleanup port check: still listening on ${stillListening.join(', ')}.`,
      )
      process.exitCode = 1
      return
    }

    console.log(
      `Post-cleanup port check: ${portsBeforeCleanup.join(', ')} no longer listening.`,
    )
  }
}

async function getSnapshot() {
  const [processes, portsByPid, statesByPid] = await Promise.all([
    getProcesses(),
    getListeningPortsByPid(),
    getStateFilesByPid(),
  ])
  const liveStatesByPid = await pruneStaleStateFiles(statesByPid, processes)

  addStatePorts(portsByPid, liveStatesByPid)

  return { portsByPid, processes, statesByPid: liveStatesByPid }
}

async function getProcesses() {
  if (isWindows) {
    return await getWindowsProcesses()
  }

  return await getUnixProcesses()
}

async function getWindowsProcesses() {
  const command = [
    "$ErrorActionPreference = 'Stop';",
    'Get-CimInstance Win32_Process |',
    'Select-Object ProcessId,ParentProcessId,Name,CommandLine,ExecutablePath |',
    'ConvertTo-Json -Compress',
  ].join(' ')
  const { stdout } = await execFileAsync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-Command', command],
    {
      maxBuffer: 10 * 1024 * 1024,
      timeout: commandTimeoutMs,
      windowsHide: true,
    },
  )
  const raw = parseJson(stdout)

  return asArray(raw)
    .map((item) => ({
      commandLine: item.CommandLine ?? '',
      executablePath: item.ExecutablePath ?? '',
      name: item.Name ?? '',
      pid: Number(item.ProcessId),
      ppid: Number(item.ParentProcessId),
    }))
    .filter((item) => Number.isFinite(item.pid))
}

async function getUnixProcesses() {
  const { stdout } = await execFileAsync(
    'ps',
    ['-eo', 'pid=,ppid=,comm=,args='],
    {
      maxBuffer: 10 * 1024 * 1024,
      timeout: commandTimeoutMs,
    },
  )

  return stdout
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*(\d+)\s+(\d+)\s+(\S+)\s+(.*)$/))
    .filter((match) => match !== null)
    .map((match) => ({
      commandLine: match[4],
      executablePath: '',
      name: match[3],
      pid: Number(match[1]),
      ppid: Number(match[2]),
    }))
}

async function getListeningPortsByPid() {
  if (!isWindows) {
    return new Map()
  }

  try {
    const command = [
      "Get-NetTCPConnection -State Listen -ErrorAction Stop |",
      'Select-Object LocalAddress,LocalPort,OwningProcess |',
      'ConvertTo-Json -Compress',
    ].join(' ')
    const { stdout } = await execFileAsync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', command],
      {
        maxBuffer: 10 * 1024 * 1024,
        timeout: commandTimeoutMs,
        windowsHide: true,
      },
    )
    const portsByPid = new Map()

    for (const item of asArray(parseJson(stdout))) {
      const pid = Number(item.OwningProcess)
      const port = Number(item.LocalPort)

      if (!Number.isFinite(pid) || !Number.isFinite(port)) {
        continue
      }

      const ports = portsByPid.get(pid) ?? []
      ports.push(`${item.LocalAddress}:${port}`)
      portsByPid.set(pid, ports)
    }

    return portsByPid
  } catch {
    return new Map()
  }
}

async function getStateFilesByPid() {
  try {
    const entries = await fs.readdir(stateDir, { withFileTypes: true })
    const states = await Promise.all(
      entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
        .map((entry) => readStateFile(path.join(stateDir, entry.name))),
    )

    return new Map(
      states
        .filter((state) => state !== undefined && Number.isFinite(state.pid))
        .map((state) => [state.pid, state]),
    )
  } catch (error) {
    if (error.code === 'ENOENT') {
      return new Map()
    }

    throw error
  }
}

async function readStateFile(filePath) {
  try {
    const state = JSON.parse(await fs.readFile(filePath, 'utf8'))
    const pid = Number(state.pid)
    const port = Number(state.port)

    return {
      command: Array.isArray(state.command) ? state.command : [],
      cwd: state.cwd ?? '',
      filePath,
      host: state.host ?? '127.0.0.1',
      mode: state.mode ?? '',
      origin: state.origin ?? '',
      pid,
      port,
    }
  } catch {
    return undefined
  }
}

function addStatePorts(portsByPid, statesByPid) {
  for (const state of statesByPid.values()) {
    if (!Number.isFinite(state.port)) {
      continue
    }

    const ports = portsByPid.get(state.pid) ?? []
    const statePort = `${state.host}:${state.port}`

    if (!ports.includes(statePort)) {
      ports.push(statePort)
    }

    portsByPid.set(state.pid, ports)
  }
}

async function pruneStaleStateFiles(statesByPid, processes) {
  const processByPid = new Map(
    processes.map((processInfo) => [processInfo.pid, processInfo]),
  )
  const staleStates = Array.from(statesByPid.values()).filter(
    (state) => !isLiveStateBackedProcess(state, processByPid.get(state.pid)),
  )

  await removeStateFilePaths(staleStates.map((state) => state.filePath))

  return new Map(
    Array.from(statesByPid.entries()).filter(([pid, state]) =>
      isLiveStateBackedProcess(state, processByPid.get(pid)),
    ),
  )
}

async function removeStateFiles(servers) {
  await removeStateFilePaths(
    servers.map((processInfo) => processInfo.devServerState?.filePath),
  )
}

async function removeStateFilePaths(filePaths) {
  const stateFiles = filePaths.filter((filePath) => filePath !== undefined)

  await Promise.all(stateFiles.map((filePath) => fs.rm(filePath, { force: true })))
}

function findRepoDevServers(processes, statesByPid) {
  return processes
    .filter((processInfo) =>
      isRepoDevServer(processInfo, statesByPid.get(processInfo.pid)),
    )
    .map((processInfo) => ({
      ...processInfo,
      devServerState: statesByPid.get(processInfo.pid),
    }))
    .sort((left, right) => left.pid - right.pid)
}

function isRepoDevServer(processInfo, state) {
  const commandLine = normalizeCommandText(
    `${processInfo.commandLine} ${processInfo.executablePath}`,
  )

  if (
    commandLine.includes(normalizedRepoRoot) &&
    repoDevServerMarkers.some((marker) => marker.test(commandLine))
  ) {
    return true
  }

  return isStateBackedRepoDevServer(commandLine, state)
}

function isStateBackedRepoDevServer(commandLine, state) {
  if (state === undefined || normalizeCommandText(state.cwd) !== normalizedRepoRoot) {
    return false
  }

  const recordedCommand = normalizeCommandText(state.command.join(' '))
  const recordedScript = normalizeCommandText(state.command[1] ?? '')
  const recordedScriptName = recordedScript.split('/').at(-1) ?? ''

  if (
    stateBackedServerMarkers.some(
      (marker) => marker.test(commandLine) || marker.test(recordedCommand),
    )
  ) {
    return true
  }

  return (
    recordedScript !== '' &&
    (commandLine.includes(recordedScript) ||
      commandLine.includes(recordedScriptName))
  )
}

function isLiveStateBackedProcess(state, processInfo) {
  if (processInfo === undefined) {
    return false
  }

  const commandLine = normalizeCommandText(
    `${processInfo.commandLine} ${processInfo.executablePath}`,
  )

  return isStateBackedRepoDevServer(commandLine, state)
}

function findRootProcesses(servers, processes) {
  const selectedPids = new Set(servers.map((processInfo) => processInfo.pid))
  const processByPid = new Map(
    processes.map((processInfo) => [processInfo.pid, processInfo]),
  )

  return servers.filter(
    (processInfo) => !hasSelectedAncestor(processInfo, selectedPids, processByPid),
  )
}

function hasSelectedAncestor(processInfo, selectedPids, processByPid) {
  let parentPid = processInfo.ppid

  while (Number.isFinite(parentPid) && processByPid.has(parentPid)) {
    if (selectedPids.has(parentPid)) {
      return true
    }

    parentPid = processByPid.get(parentPid)?.ppid
  }

  return false
}

async function stopProcessTree(pid) {
  if (isWindows) {
    await execFileAsync('taskkill.exe', ['/PID', String(pid), '/T', '/F'], {
      timeout: commandTimeoutMs,
      windowsHide: true,
    })
    return
  }

  try {
    process.kill(pid, 'SIGTERM')
  } catch (error) {
    if (error.code !== 'ESRCH') {
      throw error
    }
  }
}

function collectPorts(servers, portsByPid) {
  return Array.from(
    new Set(servers.flatMap((processInfo) => portsByPid.get(processInfo.pid) ?? [])),
  ).sort()
}

function findStillListeningPorts(expectedPorts, portsByPid) {
  const listeningPorts = new Set(
    Array.from(portsByPid.values())
      .flat()
      .map((port) => getPortNumber(port)),
  )

  return expectedPorts.filter((port) => {
    const portNumber = getPortNumber(port)

    return listeningPorts.has(portNumber)
  })
}

function printServerList(servers, portsByPid) {
  if (servers.length === 0) {
    console.log(`No repo-local Vite/npm dev servers found for ${repoRoot}.`)
    return
  }

  console.log(`Repo-local Vite/npm dev servers for ${repoRoot}:`)
  console.log('PID\tPPID\tPORTS\tNAME\tCOMMAND')

  for (const processInfo of servers) {
    const ports = portsByPid.get(processInfo.pid)?.join(',') ?? '-'
    console.log(
      [
        processInfo.pid,
        processInfo.ppid,
        ports,
        processInfo.name || '-',
        truncateCommand(getDisplayCommand(processInfo)),
      ].join('\t'),
    )
  }
}

function getDisplayCommand(processInfo) {
  const commandLine = processInfo.commandLine || processInfo.executablePath

  if (commandLine) {
    return commandLine
  }

  return processInfo.devServerState?.command?.join(' ') ?? ''
}

function getPortNumber(port) {
  return String(port).split(':').at(-1)
}

function normalizeCommandText(value) {
  return String(value).replaceAll('\\', '/').toLowerCase()
}

function truncateCommand(value) {
  const collapsed = String(value).replace(/\s+/g, ' ').trim()

  if (collapsed.length <= 240) {
    return collapsed
  }

  return `${collapsed.slice(0, 237)}...`
}

function parseJson(stdout) {
  const trimmed = stdout.trim()

  if (!trimmed) {
    return []
  }

  return JSON.parse(trimmed)
}

function asArray(value) {
  if (Array.isArray(value)) {
    return value
  }

  return value === undefined || value === null ? [] : [value]
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function printUsage() {
  console.log(
    [
      'Usage: node scripts/dev-server-processes.mjs <list|cleanup>',
      '',
      'Lists or stops only repo-local Vite/npm dev server processes matched by command line or managed state.',
    ].join(os.EOL),
  )
}

try {
  await main()
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
