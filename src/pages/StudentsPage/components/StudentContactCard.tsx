import type { FormState, Student } from '../types'

interface StudentContactCardProps {
  student: Student | null
  formValues: FormState
  formErrors?: Partial<Record<keyof FormState, string>>
  isEditing: boolean
  onChange: (field: keyof FormState, value: FormState[keyof FormState]) => void
}

const resolveFieldValue = (
  student: Student | null,
  formValues: FormState,
  field: keyof Pick<FormState, 'firstName' | 'lastName' | 'email' | 'phone'>,
) => student?.[field] ?? formValues[field] ?? ''

const buildDisplayName = (student: Student | null, formValues: FormState) => {
  const parts = [resolveFieldValue(student, formValues, 'firstName'), resolveFieldValue(student, formValues, 'lastName')]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean)

  if (parts.length) return parts.join(' ')

  return resolveFieldValue(student, formValues, 'email') || '—'
}

export function StudentContactCard({ student, formValues, formErrors, isEditing, onChange }: StudentContactCardProps) {
  return (
    <div className="card p-3 border-0 shadow-sm h-100">
      <div className="d-flex flex-column gap-3">
        <div>
          <div className="fw-bold text-black">Contact information</div>
          <small className="text-muted">Personal details used to reach the student</small>
        </div>

        {isEditing ? (
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label text-muted small mb-1">First name</label>
              <input
                type="text"
                className="form-control"
                value={formValues.firstName}
                onChange={(event) => onChange('firstName', event.target.value)}
                placeholder="Enter first name"
              />
              {formErrors?.firstName ? <div className="text-danger small mt-1">{formErrors.firstName}</div> : null}
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label text-muted small mb-1">Last name</label>
              <input
                type="text"
                className="form-control"
                value={formValues.lastName}
                onChange={(event) => onChange('lastName', event.target.value)}
                placeholder="Enter last name"
              />
              {formErrors?.lastName ? <div className="text-danger small mt-1">{formErrors.lastName}</div> : null}
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label text-muted small mb-1">Email</label>
              <input
                type="email"
                className="form-control"
                value={formValues.email}
                onChange={(event) => onChange('email', event.target.value)}
                placeholder="student@example.com"
              />
              {formErrors?.email ? <div className="text-danger small mt-1">{formErrors.email}</div> : null}
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label text-muted small mb-1">Phone</label>
              <input
                type="tel"
                className="form-control"
                value={formValues.phone ?? ''}
                onChange={(event) => onChange('phone', event.target.value)}
                placeholder="Add phone number"
              />
              {formErrors?.phone ? <div className="text-danger small mt-1">{formErrors.phone}</div> : null}
            </div>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            <div className="d-flex flex-column">
              <span className="text-muted small">Name</span>
              <span className="fw-semibold text-black">{buildDisplayName(student, formValues)}</span>
            </div>
            <div className="d-flex flex-column">
              <span className="text-muted small">Email</span>
              <span className="fw-semibold text-black">{resolveFieldValue(student, formValues, 'email') || '—'}</span>
            </div>
            <div className="d-flex flex-column">
              <span className="text-muted small">Phone</span>
              <span className="fw-semibold text-black">{resolveFieldValue(student, formValues, 'phone') || '—'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
