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
  const handleSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = event.target
    onChange(name as keyof FormState, value || undefined)
  }

  return (
    <InfoCard title="Institución" subtitle="Datos académicos">
      {isEditing ? (
        <div className="row gy-3">
          <div className="col-12">
            <label className="form-label">Escuela</label>
            <select
              name="institutionId"
              className="form-select"
              value={formValues.institutionId ?? ''}
              onChange={handleSelectChange}
            >
              <option value="">Selecciona una escuela</option>
              {catalogs.schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.label}
                </option>
              ))}
            </select>
            {formErrors.institutionId ? (
              <div className="text-danger small mt-1">{formErrors.institutionId}</div>
            ) : null}
          </div>

          <div className="col-md-6">
            <label className="form-label">Grupo</label>
            <select
              name="groupId"
              className="form-select"
              value={formValues.groupId ?? ''}
              onChange={handleSelectChange}
            >
              <option value="">Selecciona un grupo</option>
              {catalogs.groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.label}
                </option>
              ))}
            </select>
            {formErrors.groupId ? <div className="text-danger small mt-1">{formErrors.groupId}</div> : null}
          </div>

          <div className="col-md-6">
            <label className="form-label">Referencia de pago</label>
            <input
              name="paymentReference"
              type="text"
              className="form-control"
              value={formValues.paymentReference ?? ''}
              onChange={(event) => onChange('paymentReference', event.target.value)}
            />
          </div>
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          <div className="d-flex align-items-center justify-content-between">
            <span className="text-muted">Escuela</span>
            <span className="fw-semibold text-black">{student.institutionName || 'Sin escuela'}</span>
          </div>
          <div className="d-flex align-items-center justify-content-between">
            <span className="text-muted">Grupo</span>
            <span className="fw-semibold text-black">{student.groupName || 'Sin grupo'}</span>
          </div>
          <div className="d-flex align-items-center justify-content-between">
            <span className="text-muted">Referencia de pago</span>
            <span className="fw-semibold text-black">{student.paymentReference || 'No registrada'}</span>
          </div>
        </div>
      )}
    </InfoCard>
  )
}
