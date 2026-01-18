import { FormEvent, useEffect, useMemo, useState } from 'react'
import { API_BASE_URL } from '../config'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

declare const Swal: {
  fire: (options: {
    icon?: 'success' | 'error' | 'warning' | 'info' | 'question'
    title?: string
    text?: string
    [key: string]: unknown
  }) => Promise<unknown>
}

interface SchoolUpdateModalProps {
  isOpen: boolean
  schoolId: number | null
  initialData?: Partial<SchoolFormState> & { image?: string | null }
  onClose: () => void
  onUpdated?: (payload: SchoolUpdatePayload) => void
}

interface SchoolFormState {
  description_en: string
  description_es: string
  commercial_name: string
  business_name: string
  tax_id: string
  street: string
  ext_number: string
  int_number: string
  suburb: string
  locality: string
  municipality: string
  state: string
  phone_number: string
  email: string
}

interface SchoolUpdatePayload {
  description_en: string
  description_es: string
  commercial_name: string
  business_name: string
  tax_id: string | null
  street: string | null
  ext_number: string | null
  int_number: string | null
  suburb: string | null
  locality: string | null
  municipality: string | null
  state: string | null
  phone_number: string | null
  email: string | null
}

const defaultFormState: SchoolFormState = {
  description_en: '',
  description_es: '',
  commercial_name: '',
  business_name: '',
  tax_id: '',
  street: '',
  ext_number: '',
  int_number: '',
  suburb: '',
  locality: '',
  municipality: '',
  state: '',
  phone_number: '',
  email: '',
}

const normalizeText = (value: unknown) => {
  if (typeof value === 'string') return value
  if (value === null || value === undefined) return ''
  return String(value)
}

export function SchoolUpdateModal({
  isOpen,
  schoolId,
  initialData,
  onClose,
  onUpdated,
}: SchoolUpdateModalProps) {
  const { token } = useAuth()
  const { locale, t } = useLanguage()
  const [formState, setFormState] = useState<SchoolFormState>({ ...defaultFormState })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const schoolLogoUrl = useMemo(() => {
    if (!schoolId) return null
    return `${API_BASE_URL}/school-logo/${schoolId}`
  }, [schoolId])

  useEffect(() => {
    if (!isOpen) return

    setFormState({
      ...defaultFormState,
      description_en: normalizeText(initialData?.description_en),
      description_es: normalizeText(initialData?.description_es),
      commercial_name: normalizeText(initialData?.commercial_name),
      business_name: normalizeText(initialData?.business_name),
      tax_id: normalizeText(initialData?.tax_id),
      street: normalizeText(initialData?.street),
      ext_number: normalizeText(initialData?.ext_number),
      int_number: normalizeText(initialData?.int_number),
      suburb: normalizeText(initialData?.suburb),
      locality: normalizeText(initialData?.locality),
      municipality: normalizeText(initialData?.municipality),
      state: normalizeText(initialData?.state),
      phone_number: normalizeText(initialData?.phone_number),
      email: normalizeText(initialData?.email),
    })
    setCurrentImageUrl(null)
    setImageFile(null)
    setErrorMessage(null)
  }, [initialData, isOpen])

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl((prev) => {
        if (prev) {
          URL.revokeObjectURL(prev)
        }
        return null
      })
      return
    }

    const previewUrl = URL.createObjectURL(imageFile)
    setImagePreviewUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev)
      }
      return previewUrl
    })

    return () => {
      URL.revokeObjectURL(previewUrl)
    }
  }, [imageFile])

  useEffect(() => {
    if (!isOpen || !schoolLogoUrl || !token) {
      setCurrentImageUrl((prev) => {
        if (prev) {
          URL.revokeObjectURL(prev)
        }
        return null
      })
      return
    }

    const controller = new AbortController()
    const loadLogo = async () => {
      try {
        const response = await fetch(schoolLogoUrl, {
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
        setCurrentImageUrl((prev) => {
          if (prev) {
            URL.revokeObjectURL(prev)
          }
          return objectUrl
        })
      } catch (imageError) {
        if ((imageError as DOMException).name === 'AbortError') return
      }
    }

    loadLogo()
    return () => controller.abort()
  }, [isOpen, schoolLogoUrl, token])

  useEffect(() => {
    if (!isOpen || !schoolId || !token) return

    const controller = new AbortController()

    const fetchDetails = async () => {
      setIsLoading(true)
      setErrorMessage(null)
      try {
        const params = new URLSearchParams({ school_id: String(schoolId), lang: locale })
        const response = await fetch(`${API_BASE_URL}/schools/details?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const data = (await response.json()) as { school_details?: Record<string, unknown> }
        const details = (data?.school_details ?? data ?? {}) as Record<string, unknown>
        const descriptionFallback =
          normalizeText(details.description_es) ||
          normalizeText(details.description_en) ||
          normalizeText(details.school_description)

        setFormState((prev) => ({
          ...prev,
          description_es: normalizeText(details.description_es) || descriptionFallback,
          description_en: normalizeText(details.description_en) || descriptionFallback,
          commercial_name: normalizeText(details.commercial_name) || prev.commercial_name,
          business_name: normalizeText(details.business_name) || prev.business_name,
          tax_id: normalizeText(details.tax_id) || prev.tax_id,
          street: normalizeText(details.street) || prev.street,
          ext_number: normalizeText(details.ext_number) || prev.ext_number,
          int_number: normalizeText(details.int_number) || prev.int_number,
          suburb: normalizeText(details.suburb) || prev.suburb,
          locality: normalizeText(details.locality) || prev.locality,
          municipality: normalizeText(details.municipality) || prev.municipality,
          state: normalizeText(details.state) || prev.state,
          phone_number: normalizeText(details.phone_number) || prev.phone_number,
          email: normalizeText(details.email) || prev.email,
        }))
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          setErrorMessage(t('defaultError'))
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchDetails()

    return () => controller.abort()
  }, [isOpen, locale, schoolId, t, token])

  const handleChange = <Key extends keyof SchoolFormState>(key: Key, value: SchoolFormState[Key]) => {
    setFormState((prev) => ({ ...prev, [key]: value }))
  }

  const buildPayload = (): SchoolUpdatePayload => ({
    description_en: formState.description_en.trim(),
    description_es: formState.description_es.trim(),
    commercial_name: formState.commercial_name.trim(),
    business_name: formState.business_name.trim(),
    tax_id: formState.tax_id.trim() || null,
    street: formState.street.trim() || null,
    ext_number: formState.ext_number.trim() || null,
    int_number: formState.int_number.trim() || null,
    suburb: formState.suburb.trim() || null,
    locality: formState.locality.trim() || null,
    municipality: formState.municipality.trim() || null,
    state: formState.state.trim() || null,
    phone_number: formState.phone_number.trim() || null,
    email: formState.email.trim() || null,
  })

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!token || !schoolId || isSubmitting) return

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const payload = buildPayload()
      const formData = new FormData()
      formData.append('request', new Blob([JSON.stringify(payload)], { type: 'application/json' }), 'blob')
      if (imageFile) {
        formData.append('image', imageFile)
      }

      const response = await fetch(`${API_BASE_URL}/schools/update/${schoolId}?lang=${locale}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const responseData = await response.json().catch(() => null)

      if (!response.ok || responseData?.success === false) {
        await Swal.fire({
          icon: responseData?.type ?? 'warning',
          title: responseData?.title ?? t('defaultError'),
          text: responseData?.message ?? t('defaultError'),
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        return
      }

      await Swal.fire({
        icon: responseData?.type ?? 'success',
        title: responseData?.title ?? t('success'),
        text: responseData?.message ?? '',
      })

      onUpdated?.(payload)
      onClose()
    } catch (submitError) {
      if ((submitError as Error).name !== 'AbortError') {
        setErrorMessage(t('defaultError'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !schoolId) {
    return null
  }

  return (
    <>
      <div className="modal-backdrop fade show" />
      <div className="modal fade show d-block" tabIndex={-1} role="dialog" onClick={onClose}>
        <div
          className="modal-dialog modal-xl modal-dialog-centered"
          role="document"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h5 className="modal-title">{t('school')} · {t('edit')}</h5>
                <p className="text-muted mb-0">{t('schoolDescriptionLabel')}</p>
              </div>
              <button type="button" className="btn-close" aria-label={t('close')} onClick={onClose} />
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">{t('schoolDescriptionLabel')} (ES)</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={formState.description_es}
                      onChange={(event) => handleChange('description_es', event.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">{t('schoolDescriptionLabel')} (EN)</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={formState.description_en}
                      onChange={(event) => handleChange('description_en', event.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">{t('schoolCommercialNameLabel')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formState.commercial_name}
                      onChange={(event) => handleChange('commercial_name', event.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">{t('schoolBusinessNameLabel')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formState.business_name}
                      onChange={(event) => handleChange('business_name', event.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('taxId')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formState.tax_id}
                      maxLength={20}
                      onChange={(event) => handleChange('tax_id', event.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('phoneNumber')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formState.phone_number}
                      onChange={(event) => handleChange('phone_number', event.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('email')}</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formState.email}
                      onChange={(event) => handleChange('email', event.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('street')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formState.street}
                      onChange={(event) => handleChange('street', event.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('extNumber')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formState.ext_number}
                      onChange={(event) => handleChange('ext_number', event.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('intNumber')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formState.int_number}
                      onChange={(event) => handleChange('int_number', event.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('suburb')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formState.suburb}
                      onChange={(event) => handleChange('suburb', event.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('locality')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formState.locality}
                      onChange={(event) => handleChange('locality', event.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('municipality')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formState.municipality}
                      onChange={(event) => handleChange('municipality', event.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('state')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formState.state}
                      onChange={(event) => handleChange('state', event.target.value)}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">{t('posImageOptionalLabel')}</label>
                    {imagePreviewUrl ? (
                      <div>
                        <div className="mt-3 position-relative d-inline-block">
                          <img
                            src={imagePreviewUrl}
                            alt={formState.commercial_name || formState.business_name}
                            className="img-thumbnail"
                            style={{ maxHeight: '160px' }}
                          />
                        </div>
                      </div>
                    ) : currentImageUrl ? (
                      <div>
                        <div className="mt-3 position-relative d-inline-block">
                          <img
                            src={currentImageUrl}
                            alt={formState.commercial_name || formState.business_name}
                            className="img-thumbnail"
                            style={{ maxHeight: '160px' }}
                          />
                        </div>
                        <div className="mt-3">
                          <input
                            type="file"
                            className="form-control"
                            accept="image/png"
                            onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                          />
                        </div>
                      </div>
                    ) : (
                      <input
                        type="file"
                        className="form-control"
                        accept="image/png"
                        onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                      />
                    )}
                  </div>
                </div>
                {errorMessage ? <div className="alert alert-danger mt-3 mb-0">{errorMessage}</div> : null}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting || isLoading}>
                  {isSubmitting ? t('saving') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
