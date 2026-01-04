import type { PosCapabilities } from '../types/pos'

const POS_DEBUG_LOGGING_ENABLED = true // Toggle to disable POS bridge debug logging when no longer needed.

const debugPosLog = (...args: unknown[]) => {
  if (!POS_DEBUG_LOGGING_ENABLED) return
  console.debug('[POS]', ...args)
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
