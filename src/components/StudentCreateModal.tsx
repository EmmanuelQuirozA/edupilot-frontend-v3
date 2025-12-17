import { FormEvent, useEffect, useMemo, useState } from 'react'
import { API_BASE_URL } from '../config'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

declare const Swal: any

interface SchoolCatalogItem {
  school_id?: number | string
  commercial_name?: string
}

interface GroupCatalogItem {
  group_id?: number | string
  generation?: string
  scholar_level_name?: string
  grade_group?: string
}

interface CreateStudentFormState {
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
  group_id: string
  register_id: string
  payment_reference: string
}

const defaultCreateStudentForm: CreateStudentFormState = {
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
  group_id: '',
  register_id: '',
  payment_reference: '',
}

interface StudentCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated?: () => void
}

export function StudentCreateModal({ isOpen, onClose, onCreated }: StudentCreateModalProps) {
  const { token } = useAuth()
  const { t, locale } = useLanguage()

  const [createStudentForm, setCreateStudentForm] = useState<CreateStudentFormState>({
    ...defaultCreateStudentForm,
  })
  const [isCreateStudentSubmitting, setIsCreateStudentSubmitting] = useState(false)
  const [createStudentError, setCreateStudentError] = useState<string | null>(null)
  const [schoolsCatalog, setSchoolsCatalog] = useState<SchoolCatalogItem[]>([])
  const [groupsCatalog, setGroupsCatalog] = useState<GroupCatalogItem[]>([])
  const [isCatalogsLoading, setIsCatalogsLoading] = useState(false)

  const handleCreateStudentChange = <K extends keyof CreateStudentFormState>(
    field: K,
    value: CreateStudentFormState[K],
  ) => {
    setCreateStudentForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const resetCreateStudentForm = () => {
    setCreateStudentForm({ ...defaultCreateStudentForm })
  }

  const handleClose = () => {
    resetCreateStudentForm()
    setCreateStudentError(null)
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
          setCreateStudentError(t('defaultError'))
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
    const schoolId = createStudentForm.school_id

    if (!schoolId) {
      setGroupsCatalog([])
      setIsCatalogsLoading(false)
      return () => controller.abort()
    }

    const fetchGroupsCatalog = async () => {
      try {
        setIsCatalogsLoading(true)
        const response = await fetch(
          `${API_BASE_URL}/groups/catalog?lang=${locale}&school_id=${schoolId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          },
        )

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const groupsData = (await response.json()) as GroupCatalogItem[]
        setGroupsCatalog(groupsData ?? [])
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          setCreateStudentError(t('defaultError'))
        }
      } finally {
        setIsCatalogsLoading(false)
      }
    }

    fetchGroupsCatalog()

    return () => controller.abort()
  }, [createStudentForm.school_id, isOpen, locale, t, token])

  const selectedGroup = useMemo(
    () =>
      groupsCatalog.find(
        (group) => String(group.group_id ?? '') === (createStudentForm.group_id ?? ''),
      ),
    [createStudentForm.group_id, groupsCatalog],
  )

  const selectedGroupSummary = useMemo(() => {
    if (!selectedGroup) return null

    const generation = selectedGroup.generation ?? ''
    const gradeGroup = selectedGroup.grade_group ?? ''
    const scholarLevel = selectedGroup.scholar_level_name ?? ''

    return `Generación: ${generation} · Grupo: ${gradeGroup} · Nivel: ${scholarLevel}`
  }, [selectedGroup])

  const handleCreateStudentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!token || isCreateStudentSubmitting) return

    try {
      setCreateStudentError(null)
      setIsCreateStudentSubmitting(true)

      const payload = {
        ...createStudentForm,
        image: null,
        school_id: createStudentForm.school_id ? Number(createStudentForm.school_id) : null,
        group_id: createStudentForm.group_id ? Number(createStudentForm.group_id) : null,
        int_number: createStudentForm.int_number || null,
        payment_reference: createStudentForm.payment_reference || null,
      }

      const response = await fetch(`${API_BASE_URL}/students/create?lang=es`, {
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
        setCreateStudentError(t('defaultError'))
      }
    } finally {
      setIsCreateStudentSubmitting(false)
    }
  }

  if (!isOpen) {
    return null
  }

  const handleSchoolChange = (value: string) => {
    setCreateStudentForm((prev) => ({
      ...prev,
      school_id: value,
      group_id: '',
    }))
    setGroupsCatalog([])
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
                <h5 className="modal-title">{t('createStudent')}</h5>
                <p id="student-modal-description" className="text-muted mb-0">Ingresa la información de un nuevo alumno.</p>
              </div>
              <button type="button" className="btn-close" aria-label="Close" onClick={handleClose} />
            </div>
            <form onSubmit={handleCreateStudentSubmit}>
              <div className="modal-body">
              <div className="row g-3">
                
                <h4 className="h6 text-primary fw-semibold mb-0 mt-4">Datos personales</h4>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Nombre(s)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={createStudentForm.first_name}
                    onChange={(event) => handleCreateStudentChange('first_name', event.target.value)}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Apellido paterno</label>
                  <input
                    type="text"
                    className="form-control"
                    value={createStudentForm.last_name_father}
                    onChange={(event) => handleCreateStudentChange('last_name_father', event.target.value)}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Apellido materno</label>
                  <input
                    type="text"
                    className="form-control"
                    value={createStudentForm.last_name_mother}
                    onChange={(event) => handleCreateStudentChange('last_name_mother', event.target.value)}
                    required
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-semibold">Fecha de nacimiento</label>
                  <input
                    type="date"
                    className="form-control"
                    value={createStudentForm.birth_date}
                    onChange={(event) => handleCreateStudentChange('birth_date', event.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Matrícula</label>
                  <input
                    type="text"
                    className="form-control"
                    value={createStudentForm.register_id}
                    onChange={(event) => handleCreateStudentChange('register_id', event.target.value)}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Referencia de pago</label>
                  <input
                    type="text"
                    className="form-control"
                    value={createStudentForm.payment_reference}
                    onChange={(event) => handleCreateStudentChange('payment_reference', event.target.value)}
                  />
                </div>

                <h4 className="h6 text-primary fw-semibold mb-0 mt-4">Credenciales de acceso</h4>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Correo institucional</label>
                  <input
                    type="email"
                    className="form-control"
                    value={createStudentForm.email}
                    onChange={(event) => handleCreateStudentChange('email', event.target.value)}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Usuario</label>
                  <input
                    type="text"
                    className="form-control"
                    value={createStudentForm.username}
                    onChange={(event) => handleCreateStudentChange('username', event.target.value)}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Contraseña</label>
                  <input
                    type="password"
                    className="form-control"
                    value={createStudentForm.password}
                    onChange={(event) => handleCreateStudentChange('password', event.target.value)}
                    required
                  />
                </div>

                <h4 className="h6 text-primary fw-semibold mb-0 mt-4">Información escolar</h4>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Escuela</label>
                  <select
                    className="form-select"
                    value={createStudentForm.school_id}
                    onChange={(event) => handleSchoolChange(event.target.value)}
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
                  <label className="form-label fw-semibold">Grupo</label>
                  <select
                    className="form-select"
                    value={createStudentForm.group_id}
                    onChange={(event) => handleCreateStudentChange('group_id', event.target.value)}
                    required
                  >
                    <option value="" disabled>
                      Selecciona un grupo
                    </option>
                    {groupsCatalog.map((group) => (
                      <option key={group.group_id} value={group.group_id ?? ''}>
                        {group.grade_group}
                      </option>
                    ))}
                  </select>
                  {selectedGroupSummary ? (
                    <div className="mt-1 text-muted small">{selectedGroupSummary}</div>
                  ) : null}
                </div>

                <h4 className="h6 text-primary fw-semibold mb-0 mt-4">Información escolar</h4>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Teléfono</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={createStudentForm.phone_number}
                    onChange={(event) => handleCreateStudentChange('phone_number', event.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">RFC</label>
                  <input
                    type="text"
                    className="form-control"
                    value={createStudentForm.tax_id}
                    onChange={(event) => handleCreateStudentChange('tax_id', event.target.value)}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-semibold">CURP</label>
                  <input
                    type="text"
                    className="form-control"
                    value={createStudentForm.curp}
                    onChange={(event) => handleCreateStudentChange('curp', event.target.value)}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-semibold">Correo personal</label>
                  <input
                    type="email"
                    className="form-control"
                    value={createStudentForm.personal_email}
                    onChange={(event) => handleCreateStudentChange('personal_email', event.target.value)}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-semibold">Calle</label>
                  <input
                    type="text"
                    className="form-control"
                    value={createStudentForm.street}
                    onChange={(event) => handleCreateStudentChange('street', event.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Número ext.</label>
                  <input
                    type="text"
                    className="form-control"
                    value={createStudentForm.ext_number}
                    onChange={(event) => handleCreateStudentChange('ext_number', event.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Número int.</label>
                  <input
                    type="text"
                    className="form-control"
                    value={createStudentForm.int_number}
                    onChange={(event) => handleCreateStudentChange('int_number', event.target.value)}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-semibold">Colonia</label>
                  <input
                    type="text"
                    className="form-control"
                    value={createStudentForm.suburb}
                    onChange={(event) => handleCreateStudentChange('suburb', event.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Localidad</label>
                  <input
                    type="text"
                    className="form-control"
                    value={createStudentForm.locality}
                    onChange={(event) => handleCreateStudentChange('locality', event.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Municipio</label>
                  <input
                    type="text"
                    className="form-control"
                    value={createStudentForm.municipality}
                    onChange={(event) => handleCreateStudentChange('municipality', event.target.value)}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-semibold">Estado</label>
                  <input
                    type="text"
                    className="form-control"
                    value={createStudentForm.state}
                    onChange={(event) => handleCreateStudentChange('state', event.target.value)}
                  />
                </div>
              </div>

              {createStudentError ? (
                <div className="alert alert-danger mt-3" role="alert">
                  {createStudentError}
                </div>
              ) : null}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleClose}
                disabled={isCreateStudentSubmitting}
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isCreateStudentSubmitting || isCatalogsLoading}
              >
                {isCreateStudentSubmitting ? t('saving') : t('save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </>
  )
}
