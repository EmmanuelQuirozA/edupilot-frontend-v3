import { useCallback, useEffect, useState } from 'react'
import type { PosBridge, PosCapabilities, PosPrinterDescriptor, PosPrinterSettings } from '../types/pos'
import { isDesktopPrintingAvailable } from '../utils/pos'

type AvailabilityReason = 'browser' | 'capability-disabled' | 'no-permission' | 'missing-methods'

export interface PrinterOption {
  name: string
  label: string
  isDefault?: boolean
}

export interface UsePrinterSettingsResult {
  available: boolean
  availabilityReason: AvailabilityReason | null
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
}

const getBridge = (): PosBridge | undefined => (typeof window === 'undefined' ? undefined : window.pos)

const parsePrinterSettings = (settings: PosPrinterSettings | string | null | undefined): string | null => {
  if (!settings) return null
  if (typeof settings === 'string') return settings
  return settings.selectedPrinterName ?? settings.printerName ?? null
}

const normalizePrinters = (printers: PosPrinterDescriptor[] | string[]): PrinterOption[] => {
  return printers
    .map((printer, index) => {
      if (typeof printer === 'string') {
        return { name: printer, label: printer }
      }

      if (typeof printer === 'object' && printer) {
        const fallbackName = `Printer ${index + 1}`
        const name = typeof printer.name === 'string' && printer.name.trim().length ? printer.name : fallbackName
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

const extractPrintingCapabilityReason = (capabilities?: PosCapabilities | null): AvailabilityReason | null => {
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
  const [availabilityReason, setAvailabilityReason] = useState<AvailabilityReason | null>(null)
  const [printers, setPrinters] = useState<PrinterOption[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

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

      const bridge = getBridge()
      if (!bridge) {
        setAvailable(false)
        setAvailabilityReason('browser')
        setPrinters([])
        setSelected(null)
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
      const printingAvailable = isDesktopPrintingAvailable(capabilities ?? null)

      setAvailable(printingAvailable)
      setAvailabilityReason(capabilityReason)

      if (!printingAvailable) {
        setPrinters([])
        setSelected(null)
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
        const savedPrinterName = parsePrinterSettings(printerSettingsRaw)

        setPrinters(normalizedPrinters)

        const fallbackPrinter =
          savedPrinterName ??
          normalizedPrinters.find((printer) => printer.isDefault)?.name ??
          null
        setSelected(fallbackPrinter)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unknown error')
        setPrinters([])
        setSelected(null)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [reloadToken, resetStatus])

  const save = useCallback(async () => {
    resetStatus()
    const bridge = getBridge()

    if (!bridge || !isDesktopPrintingAvailable()) {
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
  }, [resetStatus, selected])

  const testPrint = useCallback(async () => {
    resetStatus()
    const bridge = getBridge()

    if (!bridge || !isDesktopPrintingAvailable()) {
      setError('Printing is not available in this environment.')
      return
    }

    if (typeof bridge.testPrint !== 'function') {
      setError('Test print is not supported in this app.')
      return
    }

    setTesting(true)

    try {
      await bridge.testPrint(selected ?? undefined)
      setSuccess(
        selected ? `Test ticket sent to ${selected}.` : 'Test ticket sent using the default printer.',
      )
    } catch (printError) {
      setError(printError instanceof Error ? printError.message : 'Failed to send test print.')
    } finally {
      setTesting(false)
    }
  }, [resetStatus, selected])

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
  }
}

export default usePrinterSettings
