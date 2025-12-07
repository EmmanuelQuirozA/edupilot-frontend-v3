import type { FormState } from '../types/FormState'
import type { Student } from '../types/Student'
import { InfoCard } from './InfoCard'

interface StudentContactCardProps {
  student: Student
  formValues: FormState
  formErrors: Partial<Record<keyof FormState, string>>
  isEditing: boolean
  onChange: (field: keyof FormState, value: string) => void
}

export function StudentContactCard({
  student,
  formValues,
  formErrors,
  isEditing,
  onChange,
}: StudentContactCardProps) {
  return (
    <InfoCard title="Contacto" subtitle="Información de contacto">
      {isEditing ? (
        <div className="row gy-3">
          <div className="col-md-6">
            <label className="form-label">Nombre</label>
            <input
              type="text"
              className="form-control"
              value={formValues.firstName}
              onChange={(event) => onChange('firstName', event.target.value)}
            />
            {formErrors.firstName ? <div className="text-danger small mt-1">{formErrors.firstName}</div> : null}
          </div>
          <div className="col-md-6">
            <label className="form-label">Apellidos</label>
            <input
              type="text"
              className="form-control"
              value={formValues.lastName}
              onChange={(event) => onChange('lastName', event.target.value)}
            />
            {formErrors.lastName ? <div className="text-danger small mt-1">{formErrors.lastName}</div> : null}
          </div>
          <div className="col-md-6">
            <label className="form-label">Correo</label>
            <input
              type="email"
              className="form-control"
              value={formValues.email}
              onChange={(event) => onChange('email', event.target.value)}
            />
            {formErrors.email ? <div className="text-danger small mt-1">{formErrors.email}</div> : null}
          </div>
          <div className="col-md-6">
            <label className="form-label">Teléfono</label>
            <input
              type="tel"
              className="form-control"
              value={formValues.phone}
              onChange={(event) => onChange('phone', event.target.value)}
            />
            {formErrors.phone ? <div className="text-danger small mt-1">{formErrors.phone}</div> : null}
          </div>
        </div>
      ) : (
        <div className="row gy-3">
          <div className="col-md-3">
            <small className="text-muted d-block">Nombre</small>
            <span className="fw-semibold text-black">{student.firstName}</span>
          </div>
          <div className="col-md-3">
            <small className="text-muted d-block">Apellidos</small>
            <span className="fw-semibold text-black">{student.lastName}</span>
          </div>
          <div className="col-md-3">
            <small className="text-muted d-block">Correo</small>
            <span className="fw-semibold text-black">{student.email || 'Sin correo'}</span>
          </div>
          <div className="col-md-3">
            <small className="text-muted d-block">Teléfono</small>
            <span className="fw-semibold text-black">{student.phone || 'Sin teléfono'}</span>
          </div>
        </div>
      )}
    </InfoCard>
  )
}
