import { useCallback, useEffect, useState } from 'react'
import type {
  PosBridge,
  PosCapabilities,
  PosPrinterDescriptor,
  PosPrinterSettings,
  PosTestPrintResult,
} from '../types/pos'
import {
  DEFAULT_CUT_PADDING_MM,
  DEFAULT_NORMALIZE_ACCENTS,
  DEFAULT_PAPER_WIDTH_MM,
  extractNormalizeAccentsFromSettings,
  extractCutPaddingFromSettings,
  extractPaperWidthFromSettings,
  getPrintingAvailability,
  persistNormalizeAccentsToBridge,
  persistCutPaddingToBridge,
  persistPaperWidthToBridge,
} from '../utils/pos'

export interface PrinterOption {
  name: string
  label: string
  isDefault?: boolean
}

export interface UsePrinterSettingsResult {
  available: boolean
  availabilityReason: string | null
  printers: PrinterOption[]
  selected: string | null
  setSelected: (name: string | null) => void
  loading: boolean
  saving: boolean
  testing: boolean
  error: string | null
  success: string | null
  refresh: () => void
  save: () => Promise<void>
  testPrint: () => Promise<void>
  paperWidthMm: number
  updatePaperWidthMm: (paperWidthMm: number) => Promise<void>
  paperWidthUpdating: boolean
  cutPaddingMm: number
  updateCutPaddingMm: (cutPaddingMm: number) => Promise<void>
  cutPaddingUpdating: boolean
  normalizeAccents: boolean
  updateNormalizeAccents: (normalizeAccents: boolean) => Promise<void>
  normalizeAccentsUpdating: boolean
}

const getBridge = (): PosBridge | undefined => (typeof window === 'undefined' ? undefined : window.pos)

const parsePrinterSettings = (settings: PosPrinterSettings | string | null | undefined): string | null => {
  if (!settings) return null
  if (typeof settings === 'string') return settings
  return settings.selectedPrinterName ?? settings.printerName ?? null
}

const normalizePrinters = (printers: PosPrinterDescriptor[] | string[]): PrinterOption[] => {
  return printers
    .map((printer) => {
      if (typeof printer === 'string') {
        const name = printer.trim()
        if (!name) return null
        return { name, label: name }
      }

      if (typeof printer === 'object' && printer) {
        const name = typeof printer.name === 'string' ? printer.name.trim() : ''
        if (!name) return null
        const label =
          typeof printer.displayName === 'string' && printer.displayName.trim().length
            ? printer.displayName
            : name
        const isDefault = Boolean(
          (printer as { isDefault?: boolean; default?: boolean; is_default?: boolean }).isDefault ??
            (printer as { default?: boolean; is_default?: boolean }).default ??
            (printer as { is_default?: boolean }).is_default,
        )

        return { name, label, isDefault }
      }

      return null
    })
    .filter((printer): printer is PrinterOption => Boolean(printer))
}

const findPrinterSelection = (printerList: PrinterOption[], savedPrinterName: string | null): string | null => {
  if (savedPrinterName) {
    const matched = printerList.find((printer) => printer.name === savedPrinterName)
    if (matched) return matched.name
  }

  const defaultPrinter = printerList.find((printer) => printer.isDefault)
  if (defaultPrinter) return defaultPrinter.name

  return null
}

const extractPrintingCapabilityReason = (capabilities?: PosCapabilities | null): string | null => {
  if (!capabilities || capabilities.printing == null) return null

  if (capabilities.printing === false) return 'capability-disabled'
  if (typeof capabilities.printing === 'object') {
    const printing = capabilities.printing as { available?: boolean | null; reason?: string | null }
    if (printing.available === false) {
      if (printing.reason === 'permission' || printing.reason === 'denied') {
        return 'no-permission'
      }
      return 'capability-disabled'
    }
  }

  return null
}

export const usePrinterSettings = (): UsePrinterSettingsResult => {
  const [available, setAvailable] = useState(false)
  const [availabilityReason, setAvailabilityReason] = useState<string | null>(null)
  const [printers, setPrinters] = useState<PrinterOption[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const [paperWidthMm, setPaperWidthMm] = useState<number>(DEFAULT_PAPER_WIDTH_MM)
  const [paperWidthUpdating, setPaperWidthUpdating] = useState(false)
  const [cutPaddingMm, setCutPaddingMm] = useState<number>(DEFAULT_CUT_PADDING_MM)
  const [cutPaddingUpdating, setCutPaddingUpdating] = useState(false)
  const [normalizeAccents, setNormalizeAccents] = useState<boolean>(DEFAULT_NORMALIZE_ACCENTS)
  const [normalizeAccentsUpdating, setNormalizeAccentsUpdating] = useState(false)

  const resetStatus = useCallback(() => {
    setError(null)
    setSuccess(null)
  }, [])

  const refresh = useCallback(() => {
    setReloadToken((value) => value + 1)
  }, [])

  const handleSelect = useCallback((value: string | null) => {
    setSelected(value)
  }, [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      resetStatus()

      const availability = await getPrintingAvailability()
      const bridge = getBridge()
      if (!availability.available || !bridge) {
        setAvailable(false)
        setAvailabilityReason(availability.reason ?? 'browser')
        setPrinters([])
        setSelected(null)
        setPaperWidthMm(DEFAULT_PAPER_WIDTH_MM)
        setCutPaddingMm(DEFAULT_CUT_PADDING_MM)
        setNormalizeAccents(DEFAULT_NORMALIZE_ACCENTS)
        setLoading(false)
        return
      }

      let capabilities: PosCapabilities | null | undefined

      if (typeof bridge.getCapabilities === 'function') {
        try {
          capabilities = await bridge.getCapabilities()
        } catch (capabilityError) {
          capabilities = null
          console.error('Failed to read POS capabilities', capabilityError)
        }
      }

      const capabilityReason = extractPrintingCapabilityReason(capabilities ?? null)
      const printingAvailable = availability.available

      setAvailable(printingAvailable)
      setAvailabilityReason(capabilityReason ?? availability.reason ?? null)

      if (!printingAvailable) {
        setPrinters([])
        setSelected(null)
        setPaperWidthMm(DEFAULT_PAPER_WIDTH_MM)
        setCutPaddingMm(DEFAULT_CUT_PADDING_MM)
        setNormalizeAccents(DEFAULT_NORMALIZE_ACCENTS)
        setLoading(false)
        return
      }

      if (typeof bridge.listPrinters !== 'function' || typeof bridge.getPrinterSettings !== 'function') {
        setAvailable(false)
        setAvailabilityReason('missing-methods')
        setPrinters([])
        setSelected(null)
        setLoading(false)
        return
      }

      try {
        const [printerListRaw, printerSettingsRaw] = await Promise.all([
          bridge.listPrinters(),
          bridge.getPrinterSettings(),
        ])

        const normalizedPrinters = normalizePrinters(Array.isArray(printerListRaw) ? printerListRaw : [])
        const savedPrinterName = parsePrinterSettings(printerSettingsRaw)?.trim() || null
        const savedPaperWidth = extractPaperWidthFromSettings(printerSettingsRaw)
        const savedCutPadding = extractCutPaddingFromSettings(printerSettingsRaw)
        const savedNormalizeAccents = extractNormalizeAccentsFromSettings(printerSettingsRaw)

        setPrinters(normalizedPrinters)
        setPaperWidthMm(savedPaperWidth ?? DEFAULT_PAPER_WIDTH_MM)
        setCutPaddingMm(savedCutPadding ?? DEFAULT_CUT_PADDING_MM)
        setNormalizeAccents(savedNormalizeAccents ?? DEFAULT_NORMALIZE_ACCENTS)

        const initialSelection = findPrinterSelection(normalizedPrinters, savedPrinterName)
        setSelected(initialSelection)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unknown error')
        setPrinters([])
        setSelected(null)
        setPaperWidthMm(DEFAULT_PAPER_WIDTH_MM)
        setCutPaddingMm(DEFAULT_CUT_PADDING_MM)
        setNormalizeAccents(DEFAULT_NORMALIZE_ACCENTS)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [reloadToken, resetStatus])

  const save = useCallback(async () => {
    resetStatus()
    const bridge = getBridge()

    if (!bridge || !available) {
      setError('Printing is not available in this environment.')
      return
    }

    if (!selected) {
      setError('Please select a printer before saving.')
      return
    }

    if (typeof bridge.setSelectedPrinter !== 'function') {
      setError('Selecting a printer is not supported in this app.')
      return
    }

    setSaving(true)

    try {
      await bridge.setSelectedPrinter(selected)
      setSuccess('Printer selection saved.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save printer selection.')
    } finally {
      setSaving(false)
    }
  }, [available, resetStatus, selected])

  const testPrint = useCallback(async () => {
    resetStatus()
    const bridge = getBridge()

    if (!bridge || !available) {
      setError('Printing is not available in this environment.')
      return
    }

    if (!selected) {
      setError('Please select a printer before sending a test print.')
      return
    }

    if (typeof bridge.testPrint !== 'function') {
      setError('Test print is not supported in this app.')
      return
    }

    setTesting(true)

    try {
      const result = await bridge.testPrint(selected)

      const isValidResult = (value: unknown): value is PosTestPrintResult =>
        Boolean(value && typeof value === 'object' && 'ok' in value)

      if (!isValidResult(result)) {
        setError('Test print failed: Unknown error')
        return
      }

      if (result.ok === true) {
        const printerName = result.printerName ?? selected ?? 'the default printer'
        setSuccess(`Test ticket sent to ${printerName}.`)
        return
      }

      const errorMessage =
        typeof result.error === 'string' && result.error.trim().length ? result.error : 'Unknown error'
      const methodDetails =
        typeof result.method === 'string' && result.method.trim().length ? ` (method: ${result.method})` : ''
      setError(`Test print failed: ${errorMessage}${methodDetails}`)
    } catch (printError) {
      const message = printError instanceof Error ? printError.message : 'Failed to send test print.'
      setError(`Test print failed: ${message}`)
    } finally {
      setTesting(false)
    }
  }, [available, resetStatus, selected])

  const updatePaperWidthMm = useCallback(
    async (nextWidth: number) => {
      resetStatus()
      setPaperWidthMm(nextWidth)
      const bridge = getBridge()

      if (!bridge || !available) {
        setError('Printing is not available in this environment.')
        return
      }

      if (typeof bridge.setPaperWidthMm !== 'function') {
        setError('Updating paper width is not supported in this app.')
        return
      }

      setPaperWidthUpdating(true)

      try {
        await persistPaperWidthToBridge(nextWidth)
        setSuccess('Paper width saved.')
      } catch (persistError) {
        setError(persistError instanceof Error ? persistError.message : 'Failed to save paper width.')
      } finally {
        setPaperWidthUpdating(false)
      }
    },
    [available, resetStatus],
  )

  const updateCutPaddingMm = useCallback(
    async (nextPadding: number) => {
      resetStatus()
      setCutPaddingMm(nextPadding)
      const bridge = getBridge()

      if (!bridge || !available) {
        setError('Printing is not available in this environment.')
        return
      }

      if (typeof bridge.setCutPaddingMm !== 'function') {
        setError('Updating cut padding is not supported in this app.')
        return
      }

      setCutPaddingUpdating(true)

      try {
        await persistCutPaddingToBridge(nextPadding)
        setSuccess('Cut padding saved.')
      } catch (persistError) {
        setError(persistError instanceof Error ? persistError.message : 'Failed to save cut padding.')
      } finally {
        setCutPaddingUpdating(false)
      }
    },
    [available, resetStatus],
  )

  const updateNormalizeAccents = useCallback(
    async (nextValue: boolean) => {
      resetStatus()
      setNormalizeAccents(nextValue)
      const bridge = getBridge()

      if (!bridge || !available) {
        setError('Printing is not available in this environment.')
        return
      }

      if (typeof bridge.setNormalizeAccents !== 'function') {
        setError('Updating normalize accents is not supported in this app.')
        return
      }

      setNormalizeAccentsUpdating(true)

      try {
        await persistNormalizeAccentsToBridge(nextValue)
        setSuccess('Normalize accents saved.')
      } catch (persistError) {
        setError(persistError instanceof Error ? persistError.message : 'Failed to save normalize accents.')
      } finally {
        setNormalizeAccentsUpdating(false)
      }
    },
    [available, resetStatus],
  )

  return {
    available,
    availabilityReason,
    printers,
    selected,
    setSelected: handleSelect,
    loading,
    saving,
    testing,
    error,
    success,
    refresh,
    save,
    testPrint,
    paperWidthMm,
    updatePaperWidthMm,
    paperWidthUpdating,
    cutPaddingMm,
    updateCutPaddingMm,
    cutPaddingUpdating,
    normalizeAccents,
    updateNormalizeAccents,
    normalizeAccentsUpdating,
  }
}

export default usePrinterSettings
