import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  persistCutPaddingToBridge,
  persistNormalizeAccentsToBridge,
  persistPaperWidthToBridge,
} from '../utils/pos'

export interface PrinterOption {
  name: string
  label: string
  isDefault?: boolean
}

interface PrinterSettingsState {
  selectedPrinterName: string | null
  paperWidthMm: number
  cutPaddingMm: number
  normalizeAccents: boolean
}

interface DraftPrinterSettingsState {
  selectedPrinterName: string | null
  paperWidthMm: number
  cutPaddingMm: string
  normalizeAccents: boolean
}

export interface UsePrinterSettingsResult {
  available: boolean
  availabilityReason: string | null
  printers: PrinterOption[]
  savedSettings: PrinterSettingsState
  draftSettings: DraftPrinterSettingsState
  setSelected: (name: string | null) => void
  setPaperWidthMm: (paperWidthMm: number) => void
  setCutPaddingInput: (cutPaddingInput: string) => void
  finalizeCutPaddingInput: () => void
  setNormalizeAccents: (normalizeAccents: boolean) => void
  loading: boolean
  saving: boolean
  testing: boolean
  error: string | null
  success: string | null
  cutPaddingError: CutPaddingErrorKey | null
  hasPendingChanges: boolean
  refresh: () => void
  save: () => Promise<void>
  testPrint: () => Promise<void>
}

const getBridge = (): PosBridge | undefined => (typeof window === 'undefined' ? undefined : window.pos)

const DEFAULT_SETTINGS: PrinterSettingsState = {
  selectedPrinterName: null,
  paperWidthMm: DEFAULT_PAPER_WIDTH_MM,
  cutPaddingMm: DEFAULT_CUT_PADDING_MM,
  normalizeAccents: DEFAULT_NORMALIZE_ACCENTS,
}

const createDraftSettings = (savedSettings: PrinterSettingsState): DraftPrinterSettingsState => ({
  ...savedSettings,
  cutPaddingMm: Number.isFinite(savedSettings.cutPaddingMm) ? String(savedSettings.cutPaddingMm) : '',
})

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

type CutPaddingErrorKey = 'cutPaddingInvalid' | 'cutPaddingRange'

const normalizeCutPaddingInput = (
  value: string,
): { value: number | null; error: CutPaddingErrorKey | null } => {
  if (value.trim() === '') {
    return { value: null, error: null }
  }

  const parsed = Number.parseFloat(value)
  if (!Number.isFinite(parsed)) {
    return { value: null, error: 'cutPaddingInvalid' }
  }

  if (parsed < 0 || parsed > 20) {
    return { value: null, error: 'cutPaddingRange' }
  }

  return { value: parsed, error: null }
}

const areSettingsEqual = (saved: PrinterSettingsState, draft: DraftPrinterSettingsState): boolean => {
  const parsed = normalizeCutPaddingInput(draft.cutPaddingMm).value
  const cutPaddingValue = parsed ?? saved.cutPaddingMm

  return (
    saved.selectedPrinterName === draft.selectedPrinterName &&
    saved.paperWidthMm === draft.paperWidthMm &&
    saved.cutPaddingMm === cutPaddingValue &&
    saved.normalizeAccents === draft.normalizeAccents
  )
}

export const usePrinterSettings = (): UsePrinterSettingsResult => {
  const [available, setAvailable] = useState(false)
  const [availabilityReason, setAvailabilityReason] = useState<string | null>(null)
  const [printers, setPrinters] = useState<PrinterOption[]>([])
  const [savedSettings, setSavedSettings] = useState<PrinterSettingsState>(DEFAULT_SETTINGS)
  const [draftSettings, setDraftSettings] = useState<DraftPrinterSettingsState>(
    createDraftSettings(DEFAULT_SETTINGS),
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [cutPaddingError, setCutPaddingError] = useState<CutPaddingErrorKey | null>(null)

  const hasLoadedRef = useRef(false)
  const actionTargetRef = useRef<EventTarget | null>(null)
  const latestStateRef = useRef({
    available,
    printers,
    savedSettings,
    draftSettings,
  })

  const resetStatus = useCallback(() => {
    setError(null)
    setSuccess(null)
  }, [])

  const refresh = useCallback(() => {
    actionTargetRef.current?.dispatchEvent(
      new CustomEvent('printer-action', { detail: { type: 'refresh' } }),
    )
  }, [])

  const setSelected = useCallback((value: string | null) => {
    setDraftSettings((current) => ({
      ...current,
      selectedPrinterName: value,
    }))
  }, [])

  const setPaperWidthMm = useCallback((paperWidthMm: number) => {
    setDraftSettings((current) => ({
      ...current,
      paperWidthMm,
    }))
  }, [])

  const setCutPaddingInput = useCallback((cutPaddingInput: string) => {
    setCutPaddingError(null)
    setDraftSettings((current) => ({
      ...current,
      cutPaddingMm: cutPaddingInput,
    }))
  }, [])

  const finalizeCutPaddingInput = useCallback(() => {
    const { value, error: validationError } = normalizeCutPaddingInput(draftSettings.cutPaddingMm)

    if (validationError) {
      setCutPaddingError(validationError)
      setDraftSettings((current) => ({
        ...current,
        cutPaddingMm: String(savedSettings.cutPaddingMm),
      }))
      return
    }

    if (value === null) {
      setDraftSettings((current) => ({
        ...current,
        cutPaddingMm: String(savedSettings.cutPaddingMm),
      }))
      return
    }

    setCutPaddingError(null)
    setDraftSettings((current) => ({
      ...current,
      cutPaddingMm: String(value),
    }))
  }, [draftSettings.cutPaddingMm, savedSettings.cutPaddingMm])

  const setNormalizeAccents = useCallback((normalizeAccents: boolean) => {
    setDraftSettings((current) => ({
      ...current,
      normalizeAccents,
    }))
  }, [])

  const buildSettingsFromBridge = useCallback(
    (printerList: PrinterOption[], settingsRaw: PosPrinterSettings | string | null | undefined): PrinterSettingsState => {
      const savedPrinterName = parsePrinterSettings(settingsRaw)?.trim() || null
      const savedPaperWidth = extractPaperWidthFromSettings(settingsRaw)
      const savedCutPadding = extractCutPaddingFromSettings(settingsRaw)
      const savedNormalizeAccents = extractNormalizeAccentsFromSettings(settingsRaw)

      return {
        selectedPrinterName: findPrinterSelection(printerList, savedPrinterName),
        paperWidthMm: savedPaperWidth ?? DEFAULT_PAPER_WIDTH_MM,
        cutPaddingMm: savedCutPadding ?? DEFAULT_CUT_PADDING_MM,
        normalizeAccents: savedNormalizeAccents ?? DEFAULT_NORMALIZE_ACCENTS,
      }
    },
    [],
  )

  const loadSettings = async () => {
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true

    setLoading(true)
    resetStatus()

    const availability = await getPrintingAvailability()
    const bridge = getBridge()
    if (!availability.available || !bridge) {
      setAvailable(false)
      setAvailabilityReason(availability.reason ?? 'browser')
      setPrinters([])
      setSavedSettings(DEFAULT_SETTINGS)
      setDraftSettings(createDraftSettings(DEFAULT_SETTINGS))
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
      setSavedSettings(DEFAULT_SETTINGS)
      setDraftSettings(createDraftSettings(DEFAULT_SETTINGS))
      setLoading(false)
      return
    }

    if (typeof bridge.listPrinters !== 'function' || typeof bridge.getPrinterSettings !== 'function') {
      setAvailable(false)
      setAvailabilityReason('missing-methods')
      setPrinters([])
      setSavedSettings(DEFAULT_SETTINGS)
      setDraftSettings(createDraftSettings(DEFAULT_SETTINGS))
      setLoading(false)
      return
    }

    try {
      const [printerListRaw, printerSettingsRaw] = await Promise.all([
        bridge.listPrinters(),
        bridge.getPrinterSettings(),
      ])

      const normalizedPrinters = normalizePrinters(Array.isArray(printerListRaw) ? printerListRaw : [])
      const nextSavedSettings = buildSettingsFromBridge(normalizedPrinters, printerSettingsRaw)

      setPrinters(normalizedPrinters)
      setSavedSettings(nextSavedSettings)
      setDraftSettings(createDraftSettings(nextSavedSettings))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unknown error')
      setPrinters([])
      setSavedSettings(DEFAULT_SETTINGS)
      setDraftSettings(createDraftSettings(DEFAULT_SETTINGS))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    latestStateRef.current = {
      available,
      printers,
      savedSettings,
      draftSettings,
    }
  }, [available, draftSettings, printers, savedSettings])

  useEffect(() => {
    loadSettings()
  }, [])

  useEffect(() => {
    const target = new EventTarget()
    actionTargetRef.current = target

    const handleAction = async (event: Event) => {
      const detail = (event as CustomEvent<{ type: 'save' | 'test' | 'refresh' }>)?.detail
      if (!detail) return

      if (detail.type === 'refresh') {
        hasLoadedRef.current = false
        await loadSettings()
        return
      }

      const bridge = getBridge()
      const { available: latestAvailable, draftSettings, savedSettings, printers } = latestStateRef.current

      if (!bridge || !latestAvailable) {
        setError('Printing is not available in this environment.')
        return
      }

      if (detail.type === 'save') {
        resetStatus()

        if (!draftSettings.selectedPrinterName) {
          setError('Please select a printer before saving.')
          return
        }

        const { value: parsedPadding, error: validationError } = normalizeCutPaddingInput(draftSettings.cutPaddingMm)
        if (validationError) {
          setCutPaddingError(validationError)
          return
        }

        setCutPaddingError(null)
        const cutPaddingValue = parsedPadding ?? savedSettings.cutPaddingMm

        setSaving(true)

        try {
          if (typeof bridge.setSelectedPrinter !== 'function') {
            throw new Error('Selecting a printer is not supported in this app.')
          }

          await bridge.setSelectedPrinter(draftSettings.selectedPrinterName)

          if (typeof bridge.setPaperWidthMm === 'function') {
            await persistPaperWidthToBridge(draftSettings.paperWidthMm)
          }

          if (typeof bridge.setCutPaddingMm === 'function') {
            await persistCutPaddingToBridge(cutPaddingValue)
          }

          if (typeof bridge.setNormalizeAccents === 'function') {
            await persistNormalizeAccentsToBridge(draftSettings.normalizeAccents)
          }

          if (typeof bridge.getPrinterSettings !== 'function') {
            throw new Error('Fetching printer settings is not supported in this app.')
          }

          const updatedSettings = await bridge.getPrinterSettings()
          const nextSavedSettings = buildSettingsFromBridge(printers, updatedSettings)

          setSavedSettings(nextSavedSettings)
          setDraftSettings(createDraftSettings(nextSavedSettings))
          setSuccess('Printer settings saved.')
          setCutPaddingError(null)
        } catch (saveError) {
          setError(saveError instanceof Error ? saveError.message : 'Failed to save printer settings.')
        } finally {
          setSaving(false)
        }
        return
      }

      if (detail.type === 'test') {
        resetStatus()

        if (!draftSettings.selectedPrinterName) {
          setError('Please select a printer before sending a test print.')
          return
        }

        if (typeof bridge.testPrint !== 'function') {
          setError('Test print is not supported in this app.')
          return
        }

        const { value: parsedPadding, error: validationError } = normalizeCutPaddingInput(draftSettings.cutPaddingMm)
        if (validationError) {
          setCutPaddingError(validationError)
          return
        }

        const cutPaddingValue = parsedPadding ?? savedSettings.cutPaddingMm

        setTesting(true)

        try {
          const result = await bridge.testPrint({
            printerName: draftSettings.selectedPrinterName,
            paperWidthMm: draftSettings.paperWidthMm,
            cutPaddingMm: cutPaddingValue,
            normalizeAccents: draftSettings.normalizeAccents,
          })

          const isValidResult = (value: unknown): value is PosTestPrintResult =>
            Boolean(value && typeof value === 'object' && 'ok' in value)

          if (!isValidResult(result)) {
            setError('Test print failed: Unknown error')
            return
          }

          if (result.ok === true) {
            const printerName = result.printerName ?? draftSettings.selectedPrinterName ?? 'the default printer'
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
      }
    }

    target.addEventListener('printer-action', handleAction as EventListener)
    return () => {
      target.removeEventListener('printer-action', handleAction as EventListener)
      actionTargetRef.current = null
    }
  }, [])

  const save = useCallback(async () => {
    actionTargetRef.current?.dispatchEvent(
      new CustomEvent('printer-action', { detail: { type: 'save' } }),
    )
  }, [])

  const testPrint = useCallback(async () => {
    actionTargetRef.current?.dispatchEvent(
      new CustomEvent('printer-action', { detail: { type: 'test' } }),
    )
  }, [])

  const hasPendingChanges = useMemo(
    () => !areSettingsEqual(savedSettings, draftSettings),
    [draftSettings, savedSettings],
  )

  return {
    available,
    availabilityReason,
    printers,
    savedSettings,
    draftSettings,
    setSelected,
    setPaperWidthMm,
    setCutPaddingInput,
    finalizeCutPaddingInput,
    setNormalizeAccents,
    loading,
    saving,
    testing,
    error,
    success,
    cutPaddingError,
    hasPendingChanges,
    refresh,
    save,
    testPrint,
  }
}

export default usePrinterSettings
