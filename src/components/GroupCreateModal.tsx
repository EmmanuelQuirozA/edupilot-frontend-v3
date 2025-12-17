import { FormEvent, useEffect, useState } from 'react'
import ScholarLevelSelect from './catalog/ScholarLevelSelect'
import { API_BASE_URL } from '../config'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

declare const Swal: any

interface SchoolCatalogItem {
  school_id?: number | string
  commercial_name?: string
}

interface GroupCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated?: () => void
}

interface CreateGroupFormState {
  school_id: string
  scholar_level_id: number | ''
  name: string
  generation: string
  group: string
  grade: string
}

const defaultCreateGroupForm: CreateGroupFormState = {
  school_id: '',
  scholar_level_id: '',
  name: '',
  generation: '',
  group: '',
  grade: '',
}

export function GroupCreateModal({ isOpen, onClose, onCreated }: GroupCreateModalProps) {
  const { token } = useAuth()
  const { t, locale } = useLanguage()

  const [createGroupForm, setCreateGroupForm] = useState<CreateGroupFormState>({
    ...defaultCreateGroupForm,
  })
  const [isCreateGroupSubmitting, setIsCreateGroupSubmitting] = useState(false)
  const [createGroupError, setCreateGroupError] = useState<string | null>(null)
  const [schoolsCatalog, setSchoolsCatalog] = useState<SchoolCatalogItem[]>([])
  const [isCatalogLoading, setIsCatalogLoading] = useState(false)

  const handleCreateGroupChange = <K extends keyof CreateGroupFormState>(
    field: K,
    value: CreateGroupFormState[K],
  ) => {
    setCreateGroupForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const resetCreateGroupForm = () => {
    setCreateGroupForm({ ...defaultCreateGroupForm })
  }

  const handleClose = () => {
    resetCreateGroupForm()
    setCreateGroupError(null)
    onClose()
  }

  useEffect(() => {
    if (!token || !isOpen) return

    const controller = new AbortController()

    const fetchSchools = async () => {
      try {
        setIsCatalogLoading(true)
        const response = await fetch(`${API_BASE_URL}/schools/list?lang=${locale}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const schoolsData = (await response.json()) as SchoolCatalogItem[]
        setSchoolsCatalog(schoolsData ?? [])
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setCreateGroupError(t('defaultError'))
        }
      } finally {
        setIsCatalogLoading(false)
      }
    }

    fetchSchools()

    return () => controller.abort()
  }, [isOpen, locale, t, token])

  const handleCreateGroupSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!token || isCreateGroupSubmitting) return

    try {
      setCreateGroupError(null)
      setIsCreateGroupSubmitting(true)

      const payload = {
        ...createGroupForm,
        school_id: createGroupForm.school_id ? Number(createGroupForm.school_id) : null,
        scholar_level_id:
          createGroupForm.scholar_level_id === '' ? null : Number(createGroupForm.scholar_level_id),
      }

      const response = await fetch(`${API_BASE_URL}/groups/create`, {
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
        setCreateGroupError(t('defaultError'))
      }
    } finally {
      setIsCreateGroupSubmitting(false)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <>
      <div className="modal-backdrop fade show" />
      <div className="modal fade show d-block" tabIndex={-1} role="dialog">
        <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{t('createClass')}</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={handleClose} />
            </div>
            <form onSubmit={handleCreateGroupSubmit}>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Escuela</label>
                    <select
                      className="form-select"
                      value={createGroupForm.school_id}
                      onChange={(event) => handleCreateGroupChange('school_id', event.target.value)}
                      required
                    >
                      <option value="" disabled>
                        Selecciona una escuela
                      </option>
                      {schoolsCatalog.map((school) => (
                        <option key={school.school_id} value={school.school_id ?? ''}>
                          {school.commercial_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Nivel escolar</label>
                    <ScholarLevelSelect
                      value={createGroupForm.scholar_level_id}
                      onChange={(value) => handleCreateGroupChange('scholar_level_id', value)}
                      lang={locale}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Nombre del grupo</label>
                    <input
                      type="text"
                      className="form-control"
                      value={createGroupForm.name}
                      onChange={(event) => handleCreateGroupChange('name', event.target.value)}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Generación</label>
                    <input
                      type="text"
                      className="form-control"
                      value={createGroupForm.generation}
                      onChange={(event) => handleCreateGroupChange('generation', event.target.value)}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Grupo</label>
                    <input
                      type="text"
                      className="form-control"
                      value={createGroupForm.group}
                      onChange={(event) => handleCreateGroupChange('group', event.target.value)}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Grado</label>
                    <input
                      type="text"
                      className="form-control"
                      value={createGroupForm.grade}
                      onChange={(event) => handleCreateGroupChange('grade', event.target.value)}
                      required
                    />
                  </div>
                </div>

                {createGroupError ? (
                  <div className="alert alert-danger mt-3" role="alert">
                    {createGroupError}
                  </div>
                ) : null}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handleClose}
                  disabled={isCreateGroupSubmitting}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isCreateGroupSubmitting || isCatalogLoading}
                >
                  {isCreateGroupSubmitting ? t('saving') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

