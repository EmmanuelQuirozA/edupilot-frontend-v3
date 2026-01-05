import { useMemo } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { usePrinterSettings } from '../hooks/usePrinterSettings'
import { DEFAULT_PAPER_WIDTH_MM, PAPER_WIDTH_OPTIONS_MM } from '../utils/pos'

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
    selected,
    setSelected,
    loading,
    saving,
    testing,
    error,
    success,
    save,
    testPrint,
    paperWidthMm,
    updatePaperWidthMm,
    paperWidthUpdating,
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

  const disabled = loading || !available || saving || testing || paperWidthUpdating || printers.length === 0

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
                  value={selected ?? ''}
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
                value={paperWidthMm}
                onChange={(event) => {
                  const parsed = Number.parseInt(event.target.value, 10)
                  void updatePaperWidthMm(Number.isNaN(parsed) ? DEFAULT_PAPER_WIDTH_MM : parsed)
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

            {error ? <div className="alert alert-danger mb-0">{error}</div> : null}
            {success ? <div className="alert alert-success mb-0">{success}</div> : null}

            <div className="d-flex flex-wrap gap-2">
              <button type="button" className="btn btn-primary" onClick={save} disabled={disabled || !selected || saving}>
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
