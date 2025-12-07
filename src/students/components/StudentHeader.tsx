import type { Student } from '../types/Student'

interface StudentHeaderProps {
  student: Student
  isEditing: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onToggleStatus: () => void
}

export function StudentHeader({
  student,
  isEditing,
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
        <div className="d-flex flex-column">
          <h4 className="mb-1 fw-semibold text-black">{student.fullName}</h4>
          <div className="d-flex align-items-center gap-2">
            <span
              className={`badge px-3 py-2 ${student.isActive ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}
            >
              {student.status}
            </span>
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onToggleStatus}>
              {student.isActive ? 'Desactivar' : 'Activar'}
            </button>
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
