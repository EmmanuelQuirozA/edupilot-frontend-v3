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
  paperWidthMm?: number | string | null
  cutPaddingMm?: number | string | null
  normalizeAccents?: boolean | string | null
  [key: string]: unknown
}

export interface PosTestPrintResult {
  ok: boolean
  printerName?: string | null
  error?: string | null
  method?: string | null
  details?: unknown
}

export interface PosTicketPayload {
  title: string
  lines: string[]
  footer?: string
  paperWidthMm?: number
}

export interface PosBridge {
  getCapabilities?: () => PosCapabilities | Promise<PosCapabilities>
  listPrinters?: () => PosPrinterDescriptor[] | string[] | Promise<PosPrinterDescriptor[] | string[]>
  getPrinterSettings?: () => PosPrinterSettings | string | null | Promise<PosPrinterSettings | string | null>
  setSelectedPrinter?: (printerName: string) => unknown | Promise<unknown>
  getPaperWidthMm?: () => number | Promise<number>
  setPaperWidthMm?: (paperWidthMm: number) => unknown | Promise<unknown>
  setCutPaddingMm?: (cutPaddingMm: number) => unknown | Promise<unknown>
  setNormalizeAccents?: (normalizeAccents: boolean) => unknown | Promise<unknown>
  testPrint?: (printerName?: string) => PosTestPrintResult | Promise<PosTestPrintResult>
  printTicket?: (payload: PosTicketPayload) =>
    | { success?: boolean; ok?: boolean; error?: string | null; message?: string | null }
    | boolean
    | Promise<{ success?: boolean; ok?: boolean; error?: string | null; message?: string | null } | boolean>
}

declare global {
  interface Window {
    pos?: PosBridge
  }
}

export {}
