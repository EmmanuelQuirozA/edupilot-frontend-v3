import type { ChangeEvent } from 'react'
import { InfoCard } from './InfoCard'
import type { FormState } from '../types/FormState'
import type { Student } from '../types/Student'

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
  const emptyValue = '—'

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    onChange(name as keyof FormState, value)
  }

  return (
    <InfoCard title="Contacto" subtitle="Información de contacto">
      {isEditing ? (
        <div className="row gy-3">
          <div className="col-md-4">
            <label className="form-label small text-muted" htmlFor="first_name">
              Nombre
            </label>
            <input
              id="first_name"
              name="first_name"
              className="form-control"
              value={formValues.first_name}
              onChange={handleInputChange}
            />
            {formErrors.first_name ? <small className="text-danger">{formErrors.first_name}</small> : null}
          </div>
          <div className="col-md-4">
            <label className="form-label small text-muted" htmlFor="last_name_father">
              Apellido paterno
            </label>
            <input
              id="last_name_father"
              name="last_name_father"
              className="form-control"
              value={formValues.last_name_father}
              onChange={handleInputChange}
            />
            {formErrors.last_name_father ? <small className="text-danger">{formErrors.last_name_father}</small> : null}
          </div>
          <div className="col-md-4">
            <label className="form-label small text-muted" htmlFor="last_name_mother">
              Apellido materno
            </label>
            <input
              id="last_name_mother"
              name="last_name_mother"
              className="form-control"
              value={formValues.last_name_mother}
              onChange={handleInputChange}
            />
            {formErrors.last_name_mother ? <small className="text-danger">{formErrors.last_name_mother}</small> : null}
          </div>
          <div className="col-md-4">
            <label className="form-label small text-muted" htmlFor="birth_date">
              Fecha de nacimiento
            </label>
            <input
              id="birth_date"
              name="birth_date"
              type="date"
              className="form-control"
              value={formValues.birth_date ?? ''}
              onChange={handleInputChange}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label small text-muted" htmlFor="phone_number">
              Teléfono
            </label>
            <input
              id="phone_number"
              name="phone_number"
              className="form-control"
              value={formValues.phone_number ?? ''}
              onChange={handleInputChange}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label small text-muted" htmlFor="tax_id">
              RFC
            </label>
            <input
              id="tax_id"
              name="tax_id"
              className="form-control"
              value={formValues.tax_id ?? ''}
              onChange={handleInputChange}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label small text-muted" htmlFor="email">
              Correo institucional
            </label>
            <input
              id="email"
              name="email"
              className="form-control"
              value={formValues.email}
              onChange={handleInputChange}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label small text-muted" htmlFor="personal_email">
              Correo personal
            </label>
            <input
              id="personal_email"
              name="personal_email"
              className="form-control"
              value={formValues.personal_email ?? ''}
              onChange={handleInputChange}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label small text-muted" htmlFor="street">
              Calle
            </label>
            <input
              id="street"
              name="street"
              className="form-control"
              value={formValues.street ?? ''}
              onChange={handleInputChange}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label small text-muted" htmlFor="ext_number">
              Número exterior
            </label>
            <input
              id="ext_number"
              name="ext_number"
              className="form-control"
              value={formValues.ext_number ?? ''}
              onChange={handleInputChange}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label small text-muted" htmlFor="int_number">
              Número interior
            </label>
            <input
              id="int_number"
              name="int_number"
              className="form-control"
              value={formValues.int_number ?? ''}
              onChange={handleInputChange}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label small text-muted" htmlFor="suburb">
              Colonia
            </label>
            <input
              id="suburb"
              name="suburb"
              className="form-control"
              value={formValues.suburb ?? ''}
              onChange={handleInputChange}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label small text-muted" htmlFor="locality">
              Localidad
            </label>
            <input
              id="locality"
              name="locality"
              className="form-control"
              value={formValues.locality ?? ''}
              onChange={handleInputChange}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label small text-muted" htmlFor="municipality">
              Municipio
            </label>
            <input
              id="municipality"
              name="municipality"
              className="form-control"
              value={formValues.municipality ?? ''}
              onChange={handleInputChange}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label small text-muted" htmlFor="state">
              Estado
            </label>
            <input
              id="state"
              name="state"
              className="form-control"
              value={formValues.state ?? ''}
              onChange={handleInputChange}
            />
          </div>
        </div>
      ) : (
        <div className="row gy-3">
          <div className="col-md-3">
            <small className="text-muted d-block">Nombre</small>
            <span className="fw-semibold text-black">{student.full_name || student.fullName || emptyValue}</span>
          </div>
          <div className="col-md-3">
            <small className="text-muted d-block">Correo</small>
            <span className="fw-semibold text-black">{student.email || emptyValue}</span>
          </div>
          <div className="col-md-3">
            <small className="text-muted d-block">Correo personal</small>
            <span className="fw-semibold text-black">{student.personal_email || emptyValue}</span>
          </div>
          <div className="col-md-3">
            <small className="text-muted d-block">Teléfono</small>
            <span className="fw-semibold text-black">{student.phone_number || student.phone || emptyValue}</span>
          </div>
          <div className="col-12">
            <small className="text-muted d-block">Dirección</small>
            <span className="fw-semibold text-black">
              {[student.street, student.ext_number, student.int_number, student.suburb, student.locality, student.municipality, student.state]
                .filter(Boolean)
                .join(', ') || emptyValue}
            </span>
          </div>
        </div>
      )}
    </InfoCard>
  )
}
