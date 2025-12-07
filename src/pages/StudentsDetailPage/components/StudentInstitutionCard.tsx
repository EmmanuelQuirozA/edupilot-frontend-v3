import type { ChangeEvent } from 'react'
import { InfoCard } from './InfoCard'
import type { FormState } from '../types/FormState'
import type { Student, StudentCatalogs } from '../types/Student'

interface StudentInstitutionCardProps {
  student: Student
  formValues: FormState
  formErrors: Partial<Record<keyof FormState, string>>
  isEditing: boolean
  catalogs: StudentCatalogs
  onChange: (field: keyof FormState, value: string | number | undefined) => void
}

export function StudentInstitutionCard({
  student,
  formValues,
  formErrors,
  isEditing,
  catalogs,
  onChange,
}: StudentInstitutionCardProps) {
  const emptyValue = '—'

  const handleSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = event.target
    onChange(name as keyof FormState, value || undefined)
  }

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    onChange(name as keyof FormState, value)
  }

  const selectedSchoolId = formValues.school_id ?? student.school_id
  const selectedGroupId = formValues.group_id ?? student.group_id

  return (
    <InfoCard title="Institución" subtitle="Datos académicos">
      {isEditing ? (
        <div className="row gy-3">
          <div className="col-md-6">
            <label className="form-label small text-muted" htmlFor="school_id">
              Escuela
            </label>
            <select
              id="school_id"
              name="school_id"
              className="form-select"
              value={selectedSchoolId ?? ''}
              onChange={handleSelectChange}
            >
              <option value="">Selecciona una escuela</option>
              {catalogs.schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.label}
                </option>
              ))}
            </select>
            {formErrors.school_id ? <small className="text-danger">{formErrors.school_id}</small> : null}
          </div>
          <div className="col-md-6">
            <label className="form-label small text-muted" htmlFor="group_id">
              Grupo
            </label>
            <select
              id="group_id"
              name="group_id"
              className="form-select"
              value={selectedGroupId ?? ''}
              onChange={handleSelectChange}
            >
              <option value="">Selecciona un grupo</option>
              {catalogs.groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.label}
                </option>
              ))}
            </select>
            {formErrors.group_id ? <small className="text-danger">{formErrors.group_id}</small> : null}
          </div>
          <div className="col-md-6">
            <label className="form-label small text-muted" htmlFor="register_id">
              Matrícula
            </label>
            <input
              id="register_id"
              name="register_id"
              className="form-control"
              value={formValues.register_id ?? student.register_id ?? ''}
              onChange={handleInputChange}
            />
            {formErrors.register_id ? <small className="text-danger">{formErrors.register_id}</small> : null}
          </div>
          <div className="col-md-6">
            <label className="form-label small text-muted" htmlFor="payment_reference">
              Referencia de pago
            </label>
            <input
              id="payment_reference"
              name="payment_reference"
              className="form-control"
              value={formValues.payment_reference ?? student.payment_reference ?? ''}
              onChange={handleInputChange}
            />
            {formErrors.payment_reference ? <small className="text-danger">{formErrors.payment_reference}</small> : null}
          </div>
          <div className="col-md-6">
            <label className="form-label small text-muted" htmlFor="curp">
              CURP
            </label>
            <input
              id="curp"
              name="curp"
              className="form-control"
              value={formValues.curp ?? ''}
              onChange={handleInputChange}
              placeholder="CURP"
            />
          </div>
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          <div className="d-flex align-items-center justify-content-between">
            <span className="text-muted">Escuela</span>
            <span className="fw-semibold text-black">{student.institutionName || student.business_name || emptyValue}</span>
          </div>
          <div className="d-flex align-items-center justify-content-between">
            <span className="text-muted">Grupo</span>
            <span className="fw-semibold text-black">{student.group_name || student.groupName || emptyValue}</span>
          </div>
          <div className="d-flex align-items-center justify-content-between">
            <span className="text-muted">Nivel</span>
            <span className="fw-semibold text-black">{student.scholar_level_name || student.level || emptyValue}</span>
          </div>
          <div className="d-flex align-items-center justify-content-between">
            <span className="text-muted">Generación</span>
            <span className="fw-semibold text-black">{student.generation || emptyValue}</span>
          </div>
          <div className="d-flex align-items-center justify-content-between">
            <span className="text-muted">Matrícula</span>
            <span className="fw-semibold text-black">{student.register_id || emptyValue}</span>
          </div>
          <div className="d-flex align-items-center justify-content-between">
            <span className="text-muted">Referencia de pago</span>
            <span className="fw-semibold text-black">{student.payment_reference || emptyValue}</span>
          </div>
        </div>
      )}
    </InfoCard>
  )
}
