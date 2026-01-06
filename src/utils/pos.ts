import type { PosCapabilities } from '../types/pos'

const POS_DEBUG_LOGGING_ENABLED = true // Toggle to disable POS bridge debug logging when no longer needed.
export const PAPER_WIDTH_OPTIONS_MM = [58, 80, 57, 76, 112] as const
export const DEFAULT_PAPER_WIDTH_MM = 58
export const DEFAULT_CUT_PADDING_MM = 8

const debugPosLog = (...args: unknown[]) => {
  if (!POS_DEBUG_LOGGING_ENABLED) return
  console.debug('[POS]', ...args)
}

export const parsePaperWidthMm = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

export const parseCutPaddingMm = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

export const extractPaperWidthFromSettings = (settings: unknown): number | null => {
  if (!settings) return null
  if (typeof settings === 'string') return parsePaperWidthMm(settings)

  if (typeof settings === 'object') {
    const widthFromSettings = parsePaperWidthMm((settings as { paperWidthMm?: unknown }).paperWidthMm)
    if (widthFromSettings !== null) return widthFromSettings

    const widthFromAlias = parsePaperWidthMm((settings as { paperWidth?: unknown }).paperWidth)
    if (widthFromAlias !== null) return widthFromAlias
  }

  return null
}

export const extractCutPaddingFromSettings = (settings: unknown): number | null => {
  if (!settings) return null
  if (typeof settings === 'string') return parseCutPaddingMm(settings)

  if (typeof settings === 'object') {
    const paddingFromSettings = parseCutPaddingMm((settings as { cutPaddingMm?: unknown }).cutPaddingMm)
    if (paddingFromSettings !== null) return paddingFromSettings

    const paddingFromAlias = parseCutPaddingMm((settings as { cutPadding?: unknown }).cutPadding)
    if (paddingFromAlias !== null) return paddingFromAlias
  }

  return null
}

export async function readPaperWidthFromBridge(
  defaultWidth: number = DEFAULT_PAPER_WIDTH_MM,
): Promise<number> {
  if (typeof window === 'undefined' || !window.pos) return defaultWidth

  const bridge = window.pos

  if (typeof bridge.getPaperWidthMm === 'function') {
    try {
      const width = await bridge.getPaperWidthMm()
      const parsed = parsePaperWidthMm(width)
      if (parsed !== null) return parsed
    } catch (error) {
      debugPosLog('Failed to read paper width via getPaperWidthMm', error)
    }
  }

  if (typeof bridge.getPrinterSettings === 'function') {
    try {
      const settings = await bridge.getPrinterSettings()
      const parsed = extractPaperWidthFromSettings(settings)
      if (parsed !== null) return parsed
    } catch (error) {
      debugPosLog('Failed to read paper width via getPrinterSettings', error)
    }
  }

  return defaultWidth
}

export async function persistPaperWidthToBridge(paperWidthMm: number): Promise<void> {
  if (typeof window === 'undefined' || !window.pos) throw new Error('POS bridge is not available on window.')

  const bridge = window.pos
  if (typeof bridge.setPaperWidthMm !== 'function')
    throw new Error('Updating paper width is not supported in this environment.')

  await bridge.setPaperWidthMm(paperWidthMm)
}

export async function persistCutPaddingToBridge(cutPaddingMm: number): Promise<void> {
  if (typeof window === 'undefined' || !window.pos) throw new Error('POS bridge is not available on window.')

  const bridge = window.pos

  if (typeof bridge.setCutPaddingMm !== 'function')
    throw new Error('Updating cut padding is not supported in this environment.')

  await bridge.setCutPaddingMm(cutPaddingMm)
}

const extractPrintingAvailability = (capabilities?: PosCapabilities | null): boolean | null => {
  if (!capabilities) return null

  const { printing } = capabilities
  if (printing === undefined || printing === null) return null
  if (typeof printing === 'boolean') return printing

  if (typeof printing === 'object' && 'available' in printing) {
    const { available } = printing as { available?: boolean | null }
    if (available === undefined) return null
    return available ?? null
  }

  return null
}

const extractPrintingAvailabilityReason = (capabilities?: PosCapabilities | null): string | null => {
  if (!capabilities) return null

  const { printing } = capabilities
  if (printing === undefined || printing === null) return null

  if (printing === false) return 'Printing capability is disabled.'
  if (typeof printing === 'object') {
    const { available, reason } = printing as { available?: boolean | null; reason?: string | null }
    if (available === false) return reason ?? 'Printing capability is disabled.'
  }

  return null
}

export async function getPrintingAvailability(): Promise<{ available: boolean; reason?: string }> {
  try {
    if (typeof window === 'undefined') {
      debugPosLog('window unavailable; printing not available')
      return { available: false, reason: 'Window is not available.' }
    }

    const bridge = window.pos
    debugPosLog('typeof window.pos', typeof bridge)

    if (!bridge) {
      debugPosLog('POS bridge missing; printing unavailable')
      return { available: false, reason: 'POS bridge is not available on window.' }
    }

    let capabilityAvailability: boolean | null = null
    let capabilityReason: string | null = null

    if (typeof bridge.getCapabilities === 'function') {
      try {
        const capabilities = await bridge.getCapabilities()
        capabilityAvailability = extractPrintingAvailability(capabilities)
        capabilityReason = extractPrintingAvailabilityReason(capabilities)
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'Unknown capability error.'
        debugPosLog('Error reading POS capabilities', reason)
        capabilityReason = `Failed to read POS capabilities: ${reason}`
      }
    }

    if (capabilityAvailability === true) {
      debugPosLog('Printing available via capabilities check')
      return { available: true }
    }

    if (capabilityAvailability === false) {
      debugPosLog('Printing disabled via capabilities', capabilityReason)
      return { available: false, reason: capabilityReason ?? 'Printing is disabled by POS capabilities.' }
    }

    const hasListPrinters = typeof bridge.listPrinters === 'function'
    const hasTestPrint = typeof bridge.testPrint === 'function'

    if (hasListPrinters && hasTestPrint) {
      debugPosLog('Printing available via fallback method presence')
      return { available: true }
    }

    const missingMethods = [
      hasListPrinters ? null : 'listPrinters',
      hasTestPrint ? null : 'testPrint',
    ].filter(Boolean)

    const reason =
      missingMethods.length > 0
        ? `POS bridge is missing required printing methods: ${missingMethods.join(', ')}.`
        : capabilityReason ?? 'Printing is not available.'

    debugPosLog('Printing unavailable via fallback', reason)
    return { available: false, reason }
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : 'Unknown error while checking printing availability.'
    debugPosLog('Unexpected printing availability error', reason)
    return { available: false, reason }
  }
}
