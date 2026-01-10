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
  const [currentImage, setCurrentImage] = useState<string | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRemovingImage, setIsRemovingImage] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
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
    setCurrentImage(item.image ?? null)
    setErrorMessage(null)
  }, [isOpen, item])

  useEffect(() => {
    if (!isOpen || !currentImage || !token) {
      setImagePreviewUrl((prev) => {
        if (prev) {
          URL.revokeObjectURL(prev)
        }
        return null
      })
      return
    }

    const controller = new AbortController()
    const loadImage = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/coffee-menu-image/${encodeURIComponent(currentImage)}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!response.ok) return
        const blob = await response.blob()
        const objectUrl = URL.createObjectURL(blob)
        if (controller.signal.aborted) {
          URL.revokeObjectURL(objectUrl)
          return
        }
        setImagePreviewUrl((prev) => {
          if (prev) {
            URL.revokeObjectURL(prev)
          }
          return objectUrl
        })
      } catch (imageError) {
        if ((imageError as DOMException).name === 'AbortError') return
      }
    }

    loadImage()
    return () => controller.abort()
  }, [currentImage, isOpen, token])

  const handleChange = <Key extends keyof ProductFormState>(key: Key, value: ProductFormState[Key]) => {
    setFormState((prev) => ({ ...prev, [key]: value }))
  }

  const handleRemoveImage = async () => {
    if (!token || !item) return

    try {
      setIsRemovingImage(true)
      setErrorMessage(null)

      const response = await fetch(`${API_BASE_URL}/coffee/update/${item.menu_id}?lang=${locale}&removeImage=true`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

      setCurrentImage(null)
      setImageFile(null)
      onUpdated?.()
    } catch (removeError) {
      setErrorMessage(removeError instanceof Error ? removeError.message : t('defaultError'))
    } finally {
      setIsRemovingImage(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!token || !item) return

    const nextEnabled = !formState.enabled

    try {
      setIsUpdatingStatus(true)
      setErrorMessage(null)

      const response = await fetch(`${API_BASE_URL}/coffee/update/${item.menu_id}/status`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: nextEnabled }),
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

      setFormState((prev) => ({ ...prev, enabled: nextEnabled }))
      onUpdated?.()
    } catch (statusError) {
      setErrorMessage(statusError instanceof Error ? statusError.message : t('defaultError'))
    } finally {
      setIsUpdatingStatus(false)
    }
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
                    {imagePreviewUrl ? (
                      <div className="mt-3 position-relative d-inline-block">
                        <img
                          src={imagePreviewUrl}
                          alt={formState.nameEs || formState.nameEn || item.name}
                          className="img-thumbnail"
                          style={{ maxHeight: '160px' }}
                        />
                        <button
                          type="button"
                          className="btn btn-danger btn-sm position-absolute top-0 end-0 translate-middle"
                          onClick={handleRemoveImage}
                          disabled={isRemovingImage}
                          aria-label={t('remove')}
                        >
                          x
                        </button>
                      </div>
                    ) : null}
                  </div>
                  <div className="col-12">
                    <div className="d-flex flex-wrap align-items-center gap-3">
                      <div className="form-check">
                        <input
                          id="product-update-enabled"
                          className="form-check-input"
                          type="checkbox"
                          checked={formState.enabled}
                          readOnly
                        />
                        <label className="form-check-label" htmlFor="product-update-enabled">
                          {t('posEnabledLabel')}
                        </label>
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={handleStatusUpdate}
                        disabled={isUpdatingStatus}
                      >
                        {formState.enabled ? t('posDeactivateProduct') : t('posActivateProduct')}
                      </button>
                    </div>
                  </div>
                </div>
                {errorMessage ? <div className="alert alert-danger mt-3 mb-0">{errorMessage}</div> : null}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting || isUpdatingStatus}>
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
