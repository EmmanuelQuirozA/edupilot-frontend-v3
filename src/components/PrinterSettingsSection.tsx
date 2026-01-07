import { useMemo } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { usePrinterSettings } from '../hooks/usePrinterSettings'
import { DEFAULT_CUT_PADDING_MM, DEFAULT_PAPER_WIDTH_MM, PAPER_WIDTH_OPTIONS_MM } from '../utils/pos'

const AvailabilityMessage: Record<string, (fallback: string) => string> = {
  browser: (fallback) => fallback,
  'capability-disabled': (fallback) => fallback,
  'no-permission': (fallback) => fallback,
  'missing-methods': (fallback) => fallback,
}

export function PrinterSettingsSection() {
  const { t } = useLanguage()
  const {
    available,
    availabilityReason,
    printers,
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
    save,
    testPrint,
  } = usePrinterSettings()

  const availabilityText = useMemo(() => {
    if (!availabilityReason) return ''

    const fallback = t('printerNotAvailableDesktop')
    const resolver = AvailabilityMessage[availabilityReason]

    if (availabilityReason === 'browser') return t('printerNotAvailableBrowser')
    if (availabilityReason === 'no-permission') return t('printerPermissionRequired')
    if (availabilityReason === 'missing-methods') return t('printerBridgeMissingFeatures')

    return resolver ? resolver(fallback) : availabilityReason || fallback
  }, [availabilityReason, t])

  const disabled =
    loading ||
    !available ||
    saving ||
    testing ||
    printers.length === 0

  const paperWidthOptions = PAPER_WIDTH_OPTIONS_MM.map((value) => {
    const labelMap: Record<number, string> = {
      58: t('paperWidthOption58'),
      80: t('paperWidthOption80'),
      57: t('paperWidthOption57'),
      76: t('paperWidthOption76'),
      112: t('paperWidthOption112'),
    }
    return { value, label: labelMap[value] ?? `${value} mm` }
  })

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-white border-bottom-0">
        <h3 className="h6 mb-0">{t('printerSettingsTitle')}</h3>
        <small className="text-muted">{t('printerSettingsDescription')}</small>
      </div>
      <div className="card-body">
        {loading ? (
          <div className="d-flex align-items-center gap-2">
            <div className="spinner-border text-primary spinner-border-sm" role="status" aria-label={t('printerLoading')} />
            <span className="text-muted">{t('printerLoading')}</span>
          </div>
        ) : null}

        {!loading && !available ? (
          <div className="alert alert-secondary mb-0">{availabilityText || t('printerNotAvailableDesktop')}</div>
        ) : null}

        {!loading && available ? (
          <div className="d-flex flex-column gap-3">
            {printers.length === 0 ? (
              <div className="alert alert-warning mb-0">{t('printerEmptyList')}</div>
            ) : (
              <div>
                <label className="form-label fw-semibold" htmlFor="printerSelect">
                  {t('printerDropdownLabel')}
                </label>
                <select
                  id="printerSelect"
                  className="form-select"
                  value={draftSettings.selectedPrinterName ?? ''}
                  onChange={(event) => setSelected(event.target.value || null)}
                  disabled={disabled}
                >
                  <option value="">{t('selectPlaceholder')}</option>
                  {printers.map((printer) => (
                    <option key={printer.name} value={printer.name}>
                      {printer.label}
                      {printer.isDefault ? ` (${t('printerDefaultSuffix')})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="form-label fw-semibold" htmlFor="paperWidthSelect">
                {t('paperWidthLabel')}
              </label>
              <select
                id="paperWidthSelect"
                className="form-select"
                value={draftSettings.paperWidthMm}
                onChange={(event) => {
                  const parsed = Number.parseInt(event.target.value, 10)
                  setPaperWidthMm(Number.isNaN(parsed) ? DEFAULT_PAPER_WIDTH_MM : parsed)
                }}
                disabled={disabled}
              >
                {paperWidthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="form-text">{t('paperWidthHelper')}</div>
            </div>

            <div>
              <label className="form-label fw-semibold" htmlFor="cutPaddingInput">
                {t('cutPaddingLabel')}
              </label>
              <input
                id="cutPaddingInput"
                type="number"
                min={0}
                max={20}
                step={1}
                className={`form-control${cutPaddingError ? ' is-invalid' : ''}`}
                value={draftSettings.cutPaddingMm}
                onChange={(event) => {
                  setCutPaddingInput(event.target.value)
                }}
                onBlur={finalizeCutPaddingInput}
                disabled={disabled}
              />
              {cutPaddingError ? <div className="invalid-feedback">{t(cutPaddingError)}</div> : null}
              <div className="form-text">{t('cutPaddingHelper')}</div>
            </div>

            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="normalizeAccentsToggle"
                checked={draftSettings.normalizeAccents}
                onChange={(event) => {
                  const nextValue = event.target.checked
                  setNormalizeAccents(nextValue)
                }}
                disabled={disabled}
              />
              <label className="form-check-label fw-semibold" htmlFor="normalizeAccentsToggle">
                {t('normalizeAccentsLabel')}
              </label>
              <div className="form-text">{t('normalizeAccentsHelper')}</div>
            </div>

            {hasPendingChanges ? (
              <div className="alert alert-warning mb-0">{t('printerUnsavedChanges')}</div>
            ) : null}
            {error ? <div className="alert alert-danger mb-0">{error}</div> : null}
            {success ? <div className="alert alert-success mb-0">{success}</div> : null}

            <div className="d-flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-primary"
                onClick={save}
                disabled={disabled || !draftSettings.selectedPrinterName || saving || !hasPendingChanges}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden />
                    {t('saving')}
                  </>
                ) : (
                  t('printerSaveButton')
                )}
              </button>
              <button type="button" className="btn btn-outline-primary" onClick={testPrint} disabled={disabled || testing}>
                {testing ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden />
                    {t('printerTesting')}
                  </>
                ) : (
                  t('printerTestButton')
                )}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default PrinterSettingsSection
