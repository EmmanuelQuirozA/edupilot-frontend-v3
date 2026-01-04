import type { PosBridge } from '../types/pos'

const requiredBridgeMethods: Array<keyof PosBridge> = ['getCapabilities', 'listPrinters', 'testPrint']

export function isDesktopEnvironment(): boolean {
  if (typeof window === 'undefined') return false

  const bridge = window.pos

  console.debug('[env] typeof window.pos', typeof bridge)
  console.debug('[env] window.pos keys', Object.keys(bridge ?? {}))

  if (!bridge) return false

  const missingMethods = requiredBridgeMethods.filter((method) => typeof bridge[method] !== 'function')

  return missingMethods.length === 0
}
