import { FormEvent, useState } from 'react'

import { API_BASE_URL } from '../config'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

declare const Swal: any

interface RoleCreateFormState {
  name_en: string
  name_es: string
  description_en: string
  description_es: string
  enabled: boolean
}

const defaultRoleCreateForm: RoleCreateFormState = {
  name_en: '',
  name_es: '',
  description_en: '',
  description_es: '',
  enabled: true,
}

interface RoleCreateModalProps {
  isOpen: boolean
  schoolId: number | null
  onClose: () => void
  onCreated?: () => void
}

export function RoleCreateModal({ isOpen, schoolId, onClose, onCreated }: RoleCreateModalProps) {
  const { token } = useAuth()
  const { t, locale } = useLanguage()

  const [formState, setFormState] = useState<RoleCreateFormState>({ ...defaultRoleCreateForm })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createRoleError, setCreateRoleError] = useState<string | null>(null)

  const handleChange = <K extends keyof RoleCreateFormState>(field: K, value: RoleCreateFormState[K]) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const resetForm = () => {
    setFormState({ ...defaultRoleCreateForm })
  }

  const handleClose = () => {
    resetForm()
    setCreateRoleError(null)
    onClose()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!token || !schoolId || isSubmitting) return

    try {
      setIsSubmitting(true)
      setCreateRoleError(null)

      const payload = {
        name_en: formState.name_en.trim(),
        name_es: formState.name_es.trim(),
        description_en: formState.description_en.trim(),
        description_es: formState.description_es.trim(),
        school_id: schoolId,
        enabled: formState.enabled ? 1 : 0,
      }

      const params = new URLSearchParams({ lang: locale })
      const response = await fetch(`${API_BASE_URL}/roles/create?${params.toString()}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
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

      if (responseData) {
        await Swal.fire({
          icon: responseData.type === 'success' ? 'success' : 'info',
          title: responseData.title ?? t('success'),
          text: responseData.message ?? '',
        })
      } else {
        await Swal.fire({
          icon: 'success',
          title: t('success'),
        })
      }

      onCreated?.()
      handleClose()
    } catch (submitError) {
      if ((submitError as Error).name !== 'AbortError') {
        setCreateRoleError(t('defaultError'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <>
      <div className="modal-backdrop fade show" />
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        role="dialog"
        onClick={handleClose}
      >
        <div
          className="modal-dialog modal-lg modal-dialog-centered"
          role="document"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h5 className="modal-title">{t('createRole')}</h5>
                <p className="text-muted mb-0">{t('createRoleSubtitle')}</p>
              </div>
              <button type="button" className="btn-close" aria-label={t('close')} onClick={handleClose} />
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold" htmlFor="role_name_es">
                      {t('roleNameEsLabel')}
                    </label>
                    <input
                      id="role_name_es"
                      type="text"
                      className="form-control"
                      value={formState.name_es}
                      onChange={(event) => handleChange('name_es', event.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold" htmlFor="role_name_en">
                      {t('roleNameEnLabel')}
                    </label>
                    <input
                      id="role_name_en"
                      type="text"
                      className="form-control"
                      value={formState.name_en}
                      onChange={(event) => handleChange('name_en', event.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold" htmlFor="role_description_es">
                      {t('roleDescriptionEsLabel')}
                    </label>
                    <textarea
                      id="role_description_es"
                      className="form-control"
                      rows={3}
                      value={formState.description_es}
                      onChange={(event) => handleChange('description_es', event.target.value)}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold" htmlFor="role_description_en">
                      {t('roleDescriptionEnLabel')}
                    </label>
                    <textarea
                      id="role_description_en"
                      className="form-control"
                      rows={3}
                      value={formState.description_en}
                      onChange={(event) => handleChange('description_en', event.target.value)}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold" htmlFor="role_enabled">
                      {t('roleEnabledLabel')}
                    </label>
                    <div className="form-check form-switch">
                      <input
                        id="role_enabled"
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        checked={formState.enabled}
                        onChange={(event) => handleChange('enabled', event.target.checked)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>

                {createRoleError ? (
                  <div className="alert alert-danger mt-3" role="alert">
                    {createRoleError}
                  </div>
                ) : null}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting || !schoolId}>
                  {isSubmitting ? t('tableLoading') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
