export interface PosCapabilities {
  printing?: boolean | { available?: boolean | null; reason?: string | null } | null
  [key: string]: unknown
}

export interface PosPrinterDescriptor {
  name?: string
  displayName?: string
  isDefault?: boolean | null
  [key: string]: unknown
}

export interface PosPrinterSettings {
  selectedPrinterName?: string | null
  printerName?: string | null
  [key: string]: unknown
}

export interface PosBridge {
  getCapabilities?: () => PosCapabilities | Promise<PosCapabilities>
  listPrinters?: () => PosPrinterDescriptor[] | string[] | Promise<PosPrinterDescriptor[] | string[]>
  getPrinterSettings?: () => PosPrinterSettings | string | null | Promise<PosPrinterSettings | string | null>
  setSelectedPrinter?: (printerName: string) => unknown | Promise<unknown>
  testPrint?: (printerName?: string) => unknown | Promise<unknown>
}

declare global {
  interface Window {
    pos?: PosBridge
  }
}

export {}
