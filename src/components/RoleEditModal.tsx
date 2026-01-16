import { FormEvent, useEffect, useState } from 'react'

import { API_BASE_URL } from '../config'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

declare const Swal: any

export interface RoleEditValues {
  role_id: number
  role_name: string
  name_en?: string | null
  name_es?: string | null
  description_en?: string | null
  description_es?: string | null
  enabled?: boolean
}

interface RoleEditFormState {
  role_name: string
  name_en: string
  name_es: string
  description_en: string
  description_es: string
  enabled: boolean
}

const defaultRoleEditForm: RoleEditFormState = {
  role_name: '',
  name_en: '',
  name_es: '',
  description_en: '',
  description_es: '',
  enabled: true,
}

interface RoleEditModalProps {
  isOpen: boolean
  role: RoleEditValues | null
  onClose: () => void
  onUpdated?: () => void
}

export function RoleEditModal({ isOpen, role, onClose, onUpdated }: RoleEditModalProps) {
  const { token } = useAuth()
  const { t, locale } = useLanguage()

  const [formState, setFormState] = useState<RoleEditFormState>({ ...defaultRoleEditForm })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editRoleError, setEditRoleError] = useState<string | null>(null)

  useEffect(() => {
    if (!role || !isOpen) return
    setFormState({
      role_name: role.role_name ?? '',
      name_en: role.name_en ?? '',
      name_es: role.name_es ?? '',
      description_en: role.description_en ?? '',
      description_es: role.description_es ?? '',
      enabled: role.enabled ?? true,
    })
  }, [isOpen, role])

  const handleChange = <K extends keyof RoleEditFormState>(field: K, value: RoleEditFormState[K]) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const resetForm = () => {
    setFormState({ ...defaultRoleEditForm })
  }

  const handleClose = () => {
    resetForm()
    setEditRoleError(null)
    onClose()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!token || !role || isSubmitting) return

    try {
      setIsSubmitting(true)
      setEditRoleError(null)

      const payload = {
        role_name: formState.role_name.trim(),
        name_en: formState.name_en.trim(),
        name_es: formState.name_es.trim(),
        description_en: formState.description_en.trim(),
        description_es: formState.description_es.trim(),
        enabled: formState.enabled ? 1 : 0,
      }

      const params = new URLSearchParams({ lang: locale })
      const response = await fetch(`${API_BASE_URL}/roles/update?role_id=${role.role_id}&${params.toString()}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      )

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

      onUpdated?.()
      handleClose()
    } catch (submitError) {
      if ((submitError as Error).name !== 'AbortError') {
        setEditRoleError(t('defaultError'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !role) {
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
                <h5 className="modal-title">{t('editRole')}</h5>
                <p className="text-muted mb-0">{t('editRoleSubtitle')}</p>
              </div>
              <button type="button" className="btn-close" aria-label={t('close')} onClick={handleClose} />
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold" htmlFor="edit_role_name">
                      {t('roleNameLabel')}
                    </label>
                    <input
                      id="edit_role_name"
                      type="text"
                      className="form-control"
                      value={formState.role_name}
                      onChange={(event) => handleChange('role_name', event.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold" htmlFor="edit_role_enabled">
                      {t('roleEnabledLabel')}
                    </label>
                    <div className="form-check form-switch">
                      <input
                        id="edit_role_enabled"
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        checked={formState.enabled}
                        onChange={(event) => handleChange('enabled', event.target.checked)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold" htmlFor="edit_role_name_es">
                      {t('roleNameEsLabel')}
                    </label>
                    <input
                      id="edit_role_name_es"
                      type="text"
                      className="form-control"
                      value={formState.name_es}
                      onChange={(event) => handleChange('name_es', event.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold" htmlFor="edit_role_name_en">
                      {t('roleNameEnLabel')}
                    </label>
                    <input
                      id="edit_role_name_en"
                      type="text"
                      className="form-control"
                      value={formState.name_en}
                      onChange={(event) => handleChange('name_en', event.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold" htmlFor="edit_role_description_es">
                      {t('roleDescriptionEsLabel')}
                    </label>
                    <textarea
                      id="edit_role_description_es"
                      className="form-control"
                      rows={3}
                      value={formState.description_es}
                      onChange={(event) => handleChange('description_es', event.target.value)}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold" htmlFor="edit_role_description_en">
                      {t('roleDescriptionEnLabel')}
                    </label>
                    <textarea
                      id="edit_role_description_en"
                      className="form-control"
                      rows={3}
                      value={formState.description_en}
                      onChange={(event) => handleChange('description_en', event.target.value)}
                    />
                  </div>
                </div>

                {editRoleError ? (
                  <div className="alert alert-danger mt-3" role="alert">
                    {editRoleError}
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
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
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
