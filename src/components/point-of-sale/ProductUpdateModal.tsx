import { useEffect, useMemo, useState } from 'react'
import { API_BASE_URL } from '../../config'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import type { MenuItem } from './types'

interface ProductUpdateModalProps {
  isOpen: boolean
  item: MenuItem | null
  onClose: () => void
  onUpdated?: () => void
}

interface ProductFormState {
  code: string
  nameEs: string
  nameEn: string
  descriptionEs: string
  descriptionEn: string
  price: string
  enabled: boolean
}

export function ProductUpdateModal({ isOpen, item, onClose, onUpdated }: ProductUpdateModalProps) {
  const { token, user } = useAuth()
  const { locale, t } = useLanguage()
  const [formState, setFormState] = useState<ProductFormState>({
    code: '',
    nameEs: '',
    nameEn: '',
    descriptionEs: '',
    descriptionEn: '',
    price: '',
    enabled: true,
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const schoolId = useMemo(() => user?.school_id ?? 1, [user?.school_id])

  useEffect(() => {
    if (!isOpen || !item) return

    setFormState({
      code: item.code ?? '',
      nameEs: item.name ?? '',
      nameEn: item.name ?? '',
      descriptionEs: item.description ?? '',
      descriptionEn: item.description ?? '',
      price: String(item.price ?? ''),
      enabled: item.enabled ?? true,
    })
    setImageFile(null)
    setErrorMessage(null)
  }, [isOpen, item])

  const handleChange = <Key extends keyof ProductFormState>(key: Key, value: ProductFormState[Key]) => {
    setFormState((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!token || !schoolId || !item) return

    try {
      setIsSubmitting(true)
      setErrorMessage(null)

      const payload = {
        schoolId,
        code: formState.code.trim(),
        nameEs: formState.nameEs.trim(),
        nameEn: formState.nameEn.trim(),
        descriptionEs: formState.descriptionEs.trim(),
        descriptionEn: formState.descriptionEn.trim(),
        price: Number.parseFloat(formState.price) || 0,
        enabled: formState.enabled,
      }

      const formData = new FormData()
      formData.append('request', new Blob([JSON.stringify(payload)], { type: 'application/json' }), 'blob')
      if (imageFile) {
        formData.append('image', imageFile)
      }

      const response = await fetch(`${API_BASE_URL}/coffee/update?lang=${locale}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      let responseBody: { message?: string; success?: boolean } | null = null
      try {
        responseBody = (await response.json()) as { message?: string; success?: boolean }
      } catch (parseError) {
        responseBody = null
      }

      if (!response.ok || responseBody?.success === false) {
        throw new Error(responseBody?.message || t('defaultError'))
      }

      onUpdated?.()
      onClose()
    } catch (submitError) {
      setErrorMessage(submitError instanceof Error ? submitError.message : t('defaultError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !item) {
    return null
  }

  return (
    <>
      <div className="modal-backdrop fade show" />
      <div className="modal fade show d-block" tabIndex={-1} role="dialog" onClick={onClose}>
        <div
          className="modal-dialog modal-lg modal-dialog-centered"
          role="document"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h5 className="modal-title">{t('posUpdateProductTitle')}</h5>
                <p className="text-muted mb-0">{t('posUpdateProductDescription')}</p>
              </div>
              <button type="button" className="btn-close" aria-label={t('close')} onClick={onClose} />
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">{t('posCodeLabel')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formState.code}
                      onChange={(event) => handleChange('code', event.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">{t('posPriceLabel')}</label>
                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      step="0.01"
                      value={formState.price}
                      onChange={(event) => handleChange('price', event.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">{t('posNameEsLabel')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formState.nameEs}
                      onChange={(event) => handleChange('nameEs', event.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">{t('posNameEnLabel')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formState.nameEn}
                      onChange={(event) => handleChange('nameEn', event.target.value)}
                      required
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">{t('posDescriptionEsLabel')}</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={formState.descriptionEs}
                      onChange={(event) => handleChange('descriptionEs', event.target.value)}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">{t('posDescriptionEnLabel')}</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={formState.descriptionEn}
                      onChange={(event) => handleChange('descriptionEn', event.target.value)}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">{t('posImageOptionalLabel')}</label>
                    <input
                      type="file"
                      className="form-control"
                      accept="image/*"
                      onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                    />
                  </div>
                  <div className="col-12">
                    <div className="form-check">
                      <input
                        id="product-update-enabled"
                        className="form-check-input"
                        type="checkbox"
                        checked={formState.enabled}
                        onChange={(event) => handleChange('enabled', event.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="product-update-enabled">
                        {t('posEnabledLabel')}
                      </label>
                    </div>
                  </div>
                </div>
                {errorMessage ? <div className="alert alert-danger mt-3 mb-0">{errorMessage}</div> : null}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? t('posSaving') : t('posSaveChanges')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
