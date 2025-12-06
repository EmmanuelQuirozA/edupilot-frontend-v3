import type { FormState, Student } from '../types'

export interface StudentCatalogs {
  institutions?: Array<{ id: string | number; name: string }>
  statuses?: Array<{ id: string | number; name: string }>
}

interface StudentInstitutionCardProps {
  student: Student | null
  formValues: FormState
  formErrors?: Partial<Record<keyof FormState, string>>
  isEditing: boolean
  onChange: (field: keyof FormState, value: FormState[keyof FormState]) => void
  catalogs?: StudentCatalogs
}

export function StudentInstitutionCard({
  student,
  formValues,
  formErrors,
  isEditing,
  onChange,
  catalogs,
}: StudentInstitutionCardProps) {
  const institutionOptions = catalogs?.institutions ?? []
  const statusOptions = catalogs?.statuses ?? []

  const resolveInstitutionLabel = () => {
    if (student?.institutionName) return student.institutionName

    const match = institutionOptions.find(
      (option) => String(option.id) === String(formValues.institutionName),
    )

    if (match) return match.name

    return formValues.institutionName || '—'
  }

  const resolveStatusLabel = () => {
    if (student?.status) return student.status

    const match = statusOptions.find((option) => String(option.id) === String(formValues.status))

    if (match) return match.name

    return formValues.status || '—'
  }

  return (
    <div className="card p-3 border-0 shadow-sm h-100">
      <div className="d-flex flex-column gap-3">
        <div>
          <div className="fw-bold text-black">Institution</div>
          <small className="text-muted">School and enrollment details</small>
        </div>

        {isEditing ? (
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label text-muted small mb-1">Institution</label>
              <select
                className="form-select"
                value={formValues.institutionName ?? ''}
                onChange={(event) => onChange('institutionName', event.target.value)}
              >
                <option value="">Select an institution</option>
                {institutionOptions.map((institution) => (
                  <option key={institution.id} value={String(institution.id)}>
                    {institution.name}
                  </option>
                ))}
              </select>
              {formErrors?.institutionName ? (
                <div className="text-danger small mt-1">{formErrors.institutionName}</div>
              ) : null}
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label text-muted small mb-1">Status</label>
              <select
                className="form-select"
                value={formValues.status ?? ''}
                onChange={(event) => onChange('status', event.target.value)}
              >
                <option value="">Select a status</option>
                {statusOptions.map((status) => (
                  <option key={status.id} value={String(status.id)}>
                    {status.name}
                  </option>
                ))}
              </select>
              {formErrors?.status ? (
                <div className="text-danger small mt-1">{formErrors.status}</div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            <div className="d-flex flex-column">
              <span className="text-muted small">Institution</span>
              <span className="fw-semibold text-black">{resolveInstitutionLabel()}</span>
            </div>
            <div className="d-flex flex-column">
              <span className="text-muted small">Status</span>
              <span className="fw-semibold text-black">{resolveStatusLabel()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
