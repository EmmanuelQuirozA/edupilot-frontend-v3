import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { API_BASE_URL } from '../config'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

declare const Swal: any

interface SchoolCatalogItem {
  school_id?: number | string
  commercial_name?: string
}

interface CreateTeacherFormState {
  first_name: string
  last_name_father: string
  last_name_mother: string
  birth_date: string
  phone_number: string
  tax_id: string
  curp: string
  street: string
  ext_number: string
  int_number: string
  suburb: string
  locality: string
  municipality: string
  state: string
  personal_email: string
  email: string
  username: string
  password: string
  school_id: string
}

const defaultCreateTeacherForm: CreateTeacherFormState = {
  first_name: '',
  last_name_father: '',
  last_name_mother: '',
  birth_date: '',
  phone_number: '',
  tax_id: '',
  curp: '',
  street: '',
  ext_number: '',
  int_number: '',
  suburb: '',
  locality: '',
  municipality: '',
  state: '',
  personal_email: '',
  email: '',
  username: '',
  password: '',
  school_id: '',
}

interface TeacherCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated?: () => void
}

export function TeacherCreateModal({ isOpen, onClose, onCreated }: TeacherCreateModalProps) {
  const { token } = useAuth()
  const { t, locale } = useLanguage()

  const [createTeacherForm, setCreateTeacherForm] = useState<CreateTeacherFormState>({
    ...defaultCreateTeacherForm,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createTeacherError, setCreateTeacherError] = useState<string | null>(null)
  const [schoolsCatalog, setSchoolsCatalog] = useState<SchoolCatalogItem[]>([])
  const [isCatalogsLoading, setIsCatalogsLoading] = useState(false)

  const handleCreateTeacherChange = <K extends keyof CreateTeacherFormState>(
    field: K,
    value: CreateTeacherFormState[K],
  ) => {
    setCreateTeacherForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const resetCreateTeacherForm = () => {
    setCreateTeacherForm({ ...defaultCreateTeacherForm })
  }

  const handleClose = () => {
    resetCreateTeacherForm()
    setCreateTeacherError(null)
    onClose()
  }

  useEffect(() => {
    if (!token || !isOpen) return

    const controller = new AbortController()

    const fetchSchoolsCatalog = async () => {
      try {
        setIsCatalogsLoading(true)
        const response = await fetch(`${API_BASE_URL}/schools/list?lang=${locale}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const schoolsData = (await response.json()) as SchoolCatalogItem[]
        setSchoolsCatalog(schoolsData ?? [])
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          setCreateTeacherError(t('defaultError'))
        }
      } finally {
        setIsCatalogsLoading(false)
      }
    }

    fetchSchoolsCatalog()

    return () => controller.abort()
  }, [isOpen, locale, t, token])

  const handleCreateTeacherSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!token || isSubmitting) return

    try {
      setCreateTeacherError(null)
      setIsSubmitting(true)

      const payload = {
        ...createTeacherForm,
        image: null,
        school_id: createTeacherForm.school_id ? Number(createTeacherForm.school_id) : null,
        birth_date: createTeacherForm.birth_date || null,
        phone_number: createTeacherForm.phone_number || null,
        tax_id: createTeacherForm.tax_id || null,
        curp: createTeacherForm.curp || null,
        street: createTeacherForm.street || null,
        ext_number: createTeacherForm.ext_number || null,
        int_number: createTeacherForm.int_number || null,
        suburb: createTeacherForm.suburb || null,
        locality: createTeacherForm.locality || null,
        municipality: createTeacherForm.municipality || null,
        state: createTeacherForm.state || null,
        personal_email: createTeacherForm.personal_email || null,
      }

      const response = await fetch(`${API_BASE_URL}/teachers/create?lang=${locale}`, {
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
        setCreateTeacherError(t('defaultError'))
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
          className="modal-dialog modal-xl modal-dialog-centered"
          role="document"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h5 className="modal-title">{t('createTeacher')}</h5>
                <p id="teacher-modal-description" className="text-muted mb-0">
                  {t('teacherModalDescription')}
                </p>
              </div>
              <button type="button" className="btn-close" aria-label={t('close')} onClick={handleClose} />
            </div>
            <form onSubmit={handleCreateTeacherSubmit}>
              <div className="modal-body">
                <div className="row g-3">
                  <h4 className="h6 text-primary fw-semibold mb-0 mt-4">{t('personalData')}</h4>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('firstName')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={createTeacherForm.first_name}
                      onChange={(event) => handleCreateTeacherChange('first_name', event.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('lastNameFather')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={createTeacherForm.last_name_father}
                      onChange={(event) => handleCreateTeacherChange('last_name_father', event.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('lastNameMother')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={createTeacherForm.last_name_mother}
                      onChange={(event) => handleCreateTeacherChange('last_name_mother', event.target.value)}
                      required
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('birthDate')}</label>
                    <input
                      type="date"
                      className="form-control"
                      value={createTeacherForm.birth_date}
                      onChange={(event) => handleCreateTeacherChange('birth_date', event.target.value)}
                    />
                  </div>

                  <h4 className="h6 text-primary fw-semibold mb-0 mt-4">{t('accessCredentials')}</h4>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('institutionalEmail')}</label>
                    <input
                      type="email"
                      className="form-control"
                      value={createTeacherForm.email}
                      onChange={(event) => handleCreateTeacherChange('email', event.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('username')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={createTeacherForm.username}
                      onChange={(event) => handleCreateTeacherChange('username', event.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('password')}</label>
                    <input
                      type="password"
                      className="form-control"
                      value={createTeacherForm.password}
                      onChange={(event) => handleCreateTeacherChange('password', event.target.value)}
                      required
                    />
                  </div>

                  <h4 className="h6 text-primary fw-semibold mb-0 mt-4">{t('schoolInformation')}</h4>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">{t('school')}</label>
                    <select
                      className="form-select"
                      value={createTeacherForm.school_id}
                      onChange={(event) => handleCreateTeacherChange('school_id', event.target.value)}
                      required
                    >
                      <option value="" disabled>
                        {t('selectSchoolOption')}
                      </option>
                      {schoolsCatalog.map((school) => (
                        <option key={school.school_id} value={school.school_id ?? ''}>
                          {school.commercial_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <h4 className="h6 text-primary fw-semibold mb-0 mt-4">{t('contactInformation')}</h4>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('phoneNumber')}</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={createTeacherForm.phone_number}
                      onChange={(event) => handleCreateTeacherChange('phone_number', event.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('taxId')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={createTeacherForm.tax_id}
                      onChange={(event) => handleCreateTeacherChange('tax_id', event.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('curp')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={createTeacherForm.curp}
                      onChange={(event) => handleCreateTeacherChange('curp', event.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('personalEmail')}</label>
                    <input
                      type="email"
                      className="form-control"
                      value={createTeacherForm.personal_email}
                      onChange={(event) => handleCreateTeacherChange('personal_email', event.target.value)}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('street')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={createTeacherForm.street}
                      onChange={(event) => handleCreateTeacherChange('street', event.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('extNumber')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={createTeacherForm.ext_number}
                      onChange={(event) => handleCreateTeacherChange('ext_number', event.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('intNumber')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={createTeacherForm.int_number}
                      onChange={(event) => handleCreateTeacherChange('int_number', event.target.value)}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('suburb')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={createTeacherForm.suburb}
                      onChange={(event) => handleCreateTeacherChange('suburb', event.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('locality')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={createTeacherForm.locality}
                      onChange={(event) => handleCreateTeacherChange('locality', event.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('municipality')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={createTeacherForm.municipality}
                      onChange={(event) => handleCreateTeacherChange('municipality', event.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('state')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={createTeacherForm.state}
                      onChange={(event) => handleCreateTeacherChange('state', event.target.value)}
                    />
                  </div>
                </div>

                {createTeacherError ? (
                  <div className="alert alert-danger mt-3" role="alert">
                    {createTeacherError}
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
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting || isCatalogsLoading}
                >
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
