import { FormEvent, useEffect, useState } from 'react'
import { API_BASE_URL } from '../config'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

declare const Swal: any

interface SchoolCatalogItem {
  school_id?: number | string
  commercial_name?: string
}

interface RoleCatalogItem {
  role_id?: number | string
  role_name?: string
}

interface CreateUserFormState {
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
  role_id: string
}

const defaultCreateUserForm: CreateUserFormState = {
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
  role_id: '',
}

interface UserCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated?: () => void
}

export function UserCreateModal({ isOpen, onClose, onCreated }: UserCreateModalProps) {
  const { token } = useAuth()
  const { t, locale } = useLanguage()

  const [createUserForm, setCreateUserForm] = useState<CreateUserFormState>({
    ...defaultCreateUserForm,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createUserError, setCreateUserError] = useState<string | null>(null)
  const [schoolsCatalog, setSchoolsCatalog] = useState<SchoolCatalogItem[]>([])
  const [rolesCatalog, setRolesCatalog] = useState<RoleCatalogItem[]>([])
  const [isCatalogsLoading, setIsCatalogsLoading] = useState(false)

  const handleCreateUserChange = <K extends keyof CreateUserFormState>(
    field: K,
    value: CreateUserFormState[K],
  ) => {
    setCreateUserForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const resetCreateUserForm = () => {
    setCreateUserForm({ ...defaultCreateUserForm })
  }

  const handleClose = () => {
    resetCreateUserForm()
    setCreateUserError(null)
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
          setCreateUserError(t('defaultError'))
        }
      } finally {
        setIsCatalogsLoading(false)
      }
    }

    fetchSchoolsCatalog()

    return () => controller.abort()
  }, [isOpen, locale, t, token])

  useEffect(() => {
    if (!token || !isOpen) return

    const controller = new AbortController()
    const schoolId = createUserForm.school_id

    if (!schoolId) {
      setRolesCatalog([])
      setIsCatalogsLoading(false)
      return () => controller.abort()
    }

    const fetchRolesCatalog = async () => {
      try {
        setIsCatalogsLoading(true)
        const response = await fetch(
          `${API_BASE_URL}/roles?lang=${locale}&school_id=${schoolId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          },
        )

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const rolesData = (await response.json()) as RoleCatalogItem[]
        setRolesCatalog(rolesData ?? [])
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          setCreateUserError(t('defaultError'))
        }
      } finally {
        setIsCatalogsLoading(false)
      }
    }

    fetchRolesCatalog()

    return () => controller.abort()
  }, [createUserForm.school_id, isOpen, locale, t, token])

  const handleCreateUserSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!token || isSubmitting) return

    try {
      setCreateUserError(null)
      setIsSubmitting(true)

      const payload = {
        ...createUserForm,
        image: null,
        school_id: createUserForm.school_id ? Number(createUserForm.school_id) : null,
        role_id: createUserForm.role_id ? Number(createUserForm.role_id) : null,
        birth_date: createUserForm.birth_date || null,
        phone_number: createUserForm.phone_number || null,
        tax_id: createUserForm.tax_id || null,
        curp: createUserForm.curp || null,
        street: createUserForm.street || null,
        ext_number: createUserForm.ext_number || null,
        int_number: createUserForm.int_number || null,
        suburb: createUserForm.suburb || null,
        locality: createUserForm.locality || null,
        municipality: createUserForm.municipality || null,
        state: createUserForm.state || null,
        personal_email: createUserForm.personal_email || null,
      }

      const response = await fetch(`${API_BASE_URL}/users/create?lang=${locale}`, {
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
        setCreateUserError(t('defaultError'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    return null
  }

  const handleSchoolChange = (value: string) => {
    setCreateUserForm((prev) => ({
      ...prev,
      school_id: value,
      role_id: '',
    }))
    setRolesCatalog([])
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
                <h5 className="modal-title">{t('createUser')}</h5>
                <p id="user-modal-description" className="text-muted mb-0">
                  {t('userModalDescription')}
                </p>
              </div>
              <button type="button" className="btn-close" aria-label={t('close')} onClick={handleClose} />
            </div>
            <form onSubmit={handleCreateUserSubmit}>
              <div className="modal-body">
                <div className="row g-3">
                  <h4 className="h6 text-primary fw-semibold mb-0 mt-4">{t('personalData')}</h4>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('firstName')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={createUserForm.first_name}
                      onChange={(event) => handleCreateUserChange('first_name', event.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('lastNameFather')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={createUserForm.last_name_father}
                      onChange={(event) => handleCreateUserChange('last_name_father', event.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('lastNameMother')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={createUserForm.last_name_mother}
                      onChange={(event) => handleCreateUserChange('last_name_mother', event.target.value)}
                      required
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('birthDate')}</label>
                    <input
                      type="date"
                      className="form-control"
                      value={createUserForm.birth_date}
                      onChange={(event) => handleCreateUserChange('birth_date', event.target.value)}
                    />
                  </div>

                  <h4 className="h6 text-primary fw-semibold mb-0 mt-4">{t('accessCredentials')}</h4>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('institutionalEmail')}</label>
                    <input
                      type="email"
                      className="form-control"
                      value={createUserForm.email}
                      onChange={(event) => handleCreateUserChange('email', event.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('username')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={createUserForm.username}
                      onChange={(event) => handleCreateUserChange('username', event.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('password')}</label>
                    <input
                      type="password"
                      className="form-control"
                      value={createUserForm.password}
                      onChange={(event) => handleCreateUserChange('password', event.target.value)}
                      required
                    />
                  </div>

                  <h4 className="h6 text-primary fw-semibold mb-0 mt-4">{t('schoolInformation')}</h4>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">{t('school')}</label>
                    <select
                      className="form-select"
                      value={createUserForm.school_id}
                      onChange={(event) => handleSchoolChange(event.target.value)}
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
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">{t('role')}</label>
                    <select
                      className="form-select"
                      value={createUserForm.role_id}
                      onChange={(event) => handleCreateUserChange('role_id', event.target.value)}
                      required
                      disabled={!createUserForm.school_id || isCatalogsLoading}
                    >
                      <option value="" disabled>
                        {createUserForm.school_id ? t('selectRoleLabel') : t('selectSchoolOption')}
                      </option>
                      {rolesCatalog.map((role) => (
                        <option key={role.role_id} value={role.role_id ?? ''}>
                          {role.role_name}
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
                      value={createUserForm.phone_number}
                      onChange={(event) => handleCreateUserChange('phone_number', event.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('taxId')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={createUserForm.tax_id}
                      onChange={(event) => handleCreateUserChange('tax_id', event.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('curp')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={createUserForm.curp}
                      onChange={(event) => handleCreateUserChange('curp', event.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('personalEmail')}</label>
                    <input
                      type="email"
                      className="form-control"
                      value={createUserForm.personal_email}
                      onChange={(event) => handleCreateUserChange('personal_email', event.target.value)}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('street')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={createUserForm.street}
                      onChange={(event) => handleCreateUserChange('street', event.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('extNumber')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={createUserForm.ext_number}
                      onChange={(event) => handleCreateUserChange('ext_number', event.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('intNumber')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={createUserForm.int_number}
                      onChange={(event) => handleCreateUserChange('int_number', event.target.value)}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('suburb')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={createUserForm.suburb}
                      onChange={(event) => handleCreateUserChange('suburb', event.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('locality')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={createUserForm.locality}
                      onChange={(event) => handleCreateUserChange('locality', event.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('municipality')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={createUserForm.municipality}
                      onChange={(event) => handleCreateUserChange('municipality', event.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">{t('state')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={createUserForm.state}
                      onChange={(event) => handleCreateUserChange('state', event.target.value)}
                    />
                  </div>
                </div>

                {createUserError ? (
                  <div className="alert alert-danger mt-3" role="alert">
                    {createUserError}
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
