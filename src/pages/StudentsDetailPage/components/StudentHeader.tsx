import type { Student } from '../types/Student'

interface StudentHeaderProps {
  student: Student
  isEditing: boolean
  statusDraft: boolean
  statusLabel: string
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onToggleStatus: () => void
}

export function StudentHeader({
  student,
  isEditing,
  statusDraft,
  statusLabel,
  onEdit,
  onSave,
  onCancel,
  onToggleStatus,
}: StudentHeaderProps) {
  const initials = student.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0])
    .join('')
    .toUpperCase()

  return (
    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
      <div className="d-flex align-items-center gap-3">
        <div
          className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
          style={{ width: 56, height: 56 }}
        >
          <span className="fw-semibold">{initials || '?'}</span>
        </div>
        <div className="d-flex flex-column gap-2">
          <h4 className="mb-1 fw-semibold text-black">{student.fullName}</h4>
          <div className="d-flex align-items-center gap-2">
            {isEditing ? (
              <div className="student-detail-page__status-toggle">
                <div className="form-check form-switch m-0">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="student-status-switch"
                    aria-label="Desactivar acceso del alumno temporalmente"
                    checked={statusDraft}
                    onChange={onToggleStatus}
                  />
                </div>
                <span>{statusLabel}</span>
              </div>
            ) : (
              <span className="pill-chip"
                // style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#0f766e' }}
                style={{
                  color: (student?.user_enabled ? '#0f766e' : '#761b0fff'),
                  background: (student?.user_enabled ? 'rgba(16, 185, 129, 0.12)' : 'rgba(185, 16, 16, 0.12)'),
                }}
              >
                {statusLabel}
              </span>
            )}
            <span className="pill-chip"
              style={{ background: 'rgba(128, 128, 128, 0.25)', color: '#5a5a5aff' }}
            >
              {student?.role_name}
            </span>
          </div>
        </div>
      </div>

      <div className="d-flex align-items-center gap-2">
        {isEditing ? (
          <>
            <button type="button" className="btn btn-light" onClick={onCancel}>
              Cancelar
            </button>
            <button type="button" className="btn btn-primary" onClick={onSave}>
              Guardar cambios
            </button>
          </>
        ) : (
          <button type="button" className="btn btn-outline-primary" onClick={onEdit}>
            Editar perfil
          </button>
        )}
      </div>
    </div>
  )
}
