import type { PosCapabilities } from '../types/pos'

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

export function isDesktopPrintingAvailable(): boolean
export function isDesktopPrintingAvailable(capabilities?: PosCapabilities | null): boolean
export function isDesktopPrintingAvailable(capabilities?: PosCapabilities | null): boolean {
  if (typeof window === 'undefined') return false

  const bridge = window.pos
  if (!bridge) return false

  const capabilityAvailable = extractPrintingAvailability(capabilities)
  if (capabilityAvailable !== null) return capabilityAvailable

  return true
}
