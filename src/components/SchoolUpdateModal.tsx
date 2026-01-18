import { FormEvent, useEffect, useMemo, useState } from 'react'
import { API_BASE_URL } from '../config'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

declare const Swal: any

interface SchoolUpdateModalProps {
  isOpen: boolean
  school: SchoolUpdateDetails | null
  onClose: () => void
  onUpdated?: () => void
}

interface SchoolUpdateDetails {
  school_id: number
  school_description: string
  commercial_name: string
  business_name: string
  tax_id: string
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

interface SchoolUpdateFormState {
  description_es: string
  description_en: string
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

const defaultFormState: SchoolUpdateFormState = {
  description_es: '',
  description_en: '',
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

export function SchoolUpdateModal({ isOpen, school, onClose, onUpdated }: SchoolUpdateModalProps) {
  const { token } = useAuth()
  const { t } = useLanguage()
  const [formState, setFormState] = useState<SchoolUpdateFormState>({ ...defaultFormState })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const schoolId = useMemo(() => school?.school_id ?? null, [school?.school_id])

  useEffect(() => {
    if (!isOpen || !school) return

    setFormState({
      description_es: school.school_description ?? '',
      description_en: school.school_description ?? '',
      commercial_name: school.commercial_name ?? '',
      business_name: school.business_name ?? '',
      tax_id: school.tax_id ?? '',
      street: school.street ?? '',
      ext_number: school.ext_number ?? '',
      int_number: school.int_number ?? '',
      suburb: school.suburb ?? '',
      locality: school.locality ?? '',
      municipality: school.municipality ?? '',
      state: school.state ?? '',
      phone_number: school.phone_number ?? '',
      email: school.email ?? '',
    })
    setImageFile(null)
    setErrorMessage(null)
  }, [isOpen, school])

  useEffect(() => {
    if (!isOpen || !schoolId || !token || imageFile) return

    const controller = new AbortController()
    const loadImage = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/school-logo/${schoolId}`, {
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

    loadImage()

    return () => controller.abort()
  }, [imageFile, isOpen, schoolId, token])

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

    const objectUrl = URL.createObjectURL(imageFile)
    setImagePreviewUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev)
      }
      return objectUrl
    })

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [imageFile])

  useEffect(() => {
    if (!isOpen) {
      setCurrentImageUrl((prev) => {
        if (prev) {
          URL.revokeObjectURL(prev)
        }
        return null
      })
      setImagePreviewUrl((prev) => {
        if (prev) {
          URL.revokeObjectURL(prev)
        }
        return null
      })
      setImageFile(null)
    }
  }, [isOpen])

  const handleChange = <Key extends keyof SchoolUpdateFormState>(key: Key, value: SchoolUpdateFormState[Key]) => {
    setFormState((prev) => ({ ...prev, [key]: value }))
  }

  const handleImageChange = (file: File | null) => {
    if (!file) {
      setImageFile(null)
      setErrorMessage(null)
      return
    }

    if (file.type !== 'image/png') {
      setErrorMessage(t('schoolImagePngOnly'))
      setImageFile(null)
      return
    }

    setErrorMessage(null)
    setImageFile(file)
  }

  const handleClose = () => {
    setFormState({ ...defaultFormState })
    setImageFile(null)
    setErrorMessage(null)
    onClose()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!token || !schoolId || isSubmitting) return

    try {
      setIsSubmitting(true)
      setErrorMessage(null)

      const payload = {
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
      }

      const formData = new FormData()
      formData.append('request', new Blob([JSON.stringify(payload)], { type: 'application/json' }), 'blob')
      if (imageFile) {
        formData.append('image', imageFile)
      }

      const response = await fetch(`${API_BASE_URL}/schools/update/${schoolId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const responseData = await response.json().catch(() => null)

      if (!response.ok) {
        Swal.fire({
          icon: 'error',
          title: responseData?.title ?? t('defaultError'),
          text: responseData?.message ?? t('defaultError'),
        })
        throw new Error('failed_request')
      }

      if (responseData?.success === false) {
        await Swal.fire({
          icon: responseData?.type ?? 'warning',
          title: responseData?.title ?? t('defaultError'),
          text: responseData?.message ?? t('defaultError'),
        })
        return
      }

      await Swal.fire({
        icon: responseData?.type === 'success' ? 'success' : 'info',
        title: responseData?.title ?? t('success'),
        text: responseData?.message ?? '',
      })

      onUpdated?.()
      handleClose()
    } catch (submitError) {
      if ((submitError as Error).name !== 'AbortError') {
        setErrorMessage(t('defaultError'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !school) {
    return null
  }

  const previewUrl = imagePreviewUrl ?? currentImageUrl

  return (
    <>
      <div className="modal-backdrop fade show" />
      <div className="modal fade show d-block" tabIndex={-1} role="dialog" onClick={handleClose}>
        <div
          className="modal-dialog modal-xl modal-dialog-centered"
          role="document"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h5 className="modal-title">{t('schoolEditModalTitle')}</h5>
                <p className="text-muted mb-0">{t('schoolEditModalDescription')}</p>
              </div>
              <button type="button" className="btn-close" aria-label={t('close')} onClick={handleClose} />
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
                    <label className="form-label fw-semibold">{t('schoolTaxIdLabel')}</label>
                    <input
                      type="text"
                      className="form-control"
                      maxLength={20}
                      value={formState.tax_id}
                      onChange={(event) => handleChange('tax_id', event.target.value)}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('schoolContactPhone')}</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={formState.phone_number}
                      onChange={(event) => handleChange('phone_number', event.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('schoolContactEmail')}</label>
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

                  <div className="col-md-8">
                    <label className="form-label fw-semibold">{t('schoolImageLabel')}</label>
                    {previewUrl ? (
                      <div className="mt-2">
                        <img
                          src={previewUrl}
                          alt={formState.commercial_name}
                          className="img-thumbnail"
                          style={{ maxHeight: '160px' }}
                        />
                      </div>
                    ) : null}
                    <input
                      type="file"
                      className="form-control mt-2"
                      accept="image/png"
                      onChange={(event) => handleImageChange(event.target.files?.[0] ?? null)}
                    />
                    <small className="text-muted">{t('schoolImageHint')}</small>
                  </div>
                </div>

                {errorMessage ? (
                  <div className="alert alert-danger mt-3" role="alert">
                    {errorMessage}
                  </div>
                ) : null}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={handleClose} disabled={isSubmitting}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
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
