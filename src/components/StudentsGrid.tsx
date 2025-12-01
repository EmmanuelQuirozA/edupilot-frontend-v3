import './StudentsGrid.css'

export interface StudentCardItem {
  id: number
  name: string
  grade: string
  group: string
  email: string
  phone: string
  status: 'Activo' | 'Pendiente' | 'Becado'
  guardian?: string
  attendance?: string
}

interface StudentsGridProps {
  students: StudentCardItem[]
  onNavigate: (path: string) => void
}

export function StudentsGrid({ students, onNavigate }: StudentsGridProps) {
  return (
    <div className="students-grid">
      {students.map((student) => (
        <article key={student.id} className="student-card">
          <header className="student-card__header">
            <span className={`student-card__badge student-card__badge--${student.status.toLowerCase()}`}>
              {student.status}
            </span>
            <span className="student-card__grade">{student.grade}</span>
          </header>

          <div className="student-card__body">
            <div className="student-card__title">
              <h3 className="student-card__name">
                <button
                  type="button"
                  className="student-card__link"
                  onClick={() => onNavigate(`/dashboard/students/${student.id}`)}
                >
                  {student.name}
                </button>
              </h3>
              <p className="student-card__group">{student.group}</p>
            </div>

            <dl className="student-card__details">
              <div>
                <dt>Correo</dt>
                <dd>{student.email}</dd>
              </div>
              <div>
                <dt>Teléfono</dt>
                <dd>{student.phone}</dd>
              </div>
              {student.guardian && (
                <div>
                  <dt>Responsable</dt>
                  <dd>{student.guardian}</dd>
                </div>
              )}
              {student.attendance && (
                <div>
                  <dt>Asistencia</dt>
                  <dd>{student.attendance}</dd>
                </div>
              )}
            </dl>
          </div>
        </article>
      ))}
    </div>
  )
}
