/* eslint-env node */
/// <reference types="node" />

import { spawn } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

interface IpcMainLike {
  handle: (channel: string, listener: (event: unknown, printerName?: string | null) => unknown) => void
}

interface TestPrintResult {
  ok: boolean
  printerName?: string | null
  method: 'powershell'
  exitCode: number
  stdout: string
  stderr: string
  error?: string
  details?: { printers: string[] }
}

interface PowerShellResult {
  exitCode: number
  stdout: string
  stderr: string
}

const POWERSHELL_EXECUTABLE = 'powershell.exe'

const runPowerShell = async (args: string[]): Promise<PowerShellResult> => {
  return new Promise((resolve, reject) => {
    const ps = spawn(POWERSHELL_EXECUTABLE, args)

    let stdout = ''
    let stderr = ''

    ps.stdout.on('data', (data: Buffer) => {
      stdout += data.toString()
    })

    ps.stderr.on('data', (data: Buffer) => {
      stderr += data.toString()
    })

    ps.on('error', reject)

    ps.on('close', (code: number | null) => {
      resolve({
        exitCode: code ?? -1,
        stdout,
        stderr,
      })
    })
  })
}

const parsePrinterList = (stdout: string): string[] => {
  return stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

const createTempTicketFile = async (printerName?: string | null): Promise<string> => {
  const dir = await mkdtemp(join(tmpdir(), 'printer-test-'))
  const filePath = join(dir, 'test-print.txt')

  const timestamp = new Date().toISOString()
  const lines = [
    '*** TEST PRINT ***',
    'Source: EduPilot POS',
    printerName ? `Printer: ${printerName}` : 'Printer: (default)',
    `Timestamp: ${timestamp}`,
    '',
    '',
  ]

  const content = `${lines.join('\r\n')}\r\n${'\r\n'.repeat(5)}`
  await writeFile(filePath, content, { encoding: 'ascii' })

  return filePath
}

const escapeForPowerShell = (value: string): string => value.replace(/'/g, "''")

export const handlePrintersTestPrint = async (printerName?: string | null): Promise<TestPrintResult> => {
  const listResult = await runPowerShell([
    '-NoProfile',
    '-Command',
    "Get-Printer | Select-Object -ExpandProperty Name",
  ])

  const printers = parsePrinterList(listResult.stdout)
  console.info(`PS printers list (count=${printers.length})`, printers)

  if (listResult.exitCode !== 0) {
    if (listResult.stderr.trim()) {
      console.error(listResult.stderr)
    }

    return {
      ok: false,
      printerName: printerName ?? null,
      method: 'powershell',
      exitCode: listResult.exitCode,
      stdout: listResult.stdout,
      stderr: listResult.stderr,
      error: 'Failed to list printers',
      details: { printers },
    }
  }

  if (printerName && !printers.includes(printerName)) {
    return {
      ok: false,
      printerName,
      method: 'powershell',
      exitCode: listResult.exitCode,
      stdout: listResult.stdout,
      stderr: listResult.stderr,
      error: 'Printer not found',
      details: { printers },
    }
  }

  let tempFilePath: string | null = null

  try {
    tempFilePath = await createTempTicketFile(printerName)
    const escapedPath = escapeForPowerShell(tempFilePath)
    const escapedPrinterName = printerName ? escapeForPowerShell(printerName) : ''
    const command = printerName
      ? `Get-Content -Raw '${escapedPath}' | Out-Printer -Name '${escapedPrinterName}'`
      : `Get-Content -Raw '${escapedPath}' | Out-Printer`

    const printResult = await runPowerShell([
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-Command',
      command,
    ])

    console.info(`PS print command exitCode=${printResult.exitCode}`)

    if (printResult.exitCode !== 0 && printResult.stderr.trim()) {
      console.error(printResult.stderr)
    }

    return {
      ok: printResult.exitCode === 0,
      printerName: printerName ?? null,
      method: 'powershell',
      exitCode: printResult.exitCode,
      stdout: printResult.stdout,
      stderr: printResult.stderr,
      error: printResult.exitCode === 0 ? undefined : 'Print command failed',
    }
  } finally {
    if (tempFilePath) {
      await rm(dirname(tempFilePath), { recursive: true, force: true })
    }
  }
}

export const registerPrintersIpc = (ipcMain: IpcMainLike): void => {
  ipcMain.handle('printers:testPrint', async (_event, targetPrinterName?: string | null) =>
    handlePrintersTestPrint(targetPrinterName),
  )
}
