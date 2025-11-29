import { useAuth } from '../context/AuthContext'

const roleLabels: Record<string, string> = {
  ADMIN: 'Administración del sistema',
  SCHOOL: 'Gestión escolar',
  STUDENT: 'Portal de estudiantes',
  TEACHER: 'Portal de profesores',
  KITCHEN: 'Portal de cocina',
  UNKNOWN: 'Portal general',
}

export function Sidebar() {
  const { role } = useAuth()
  const readableRole = roleLabels[role] || roleLabels.UNKNOWN

  const placeholderMenu = [
    { label: 'Panel', active: true },
    { label: 'Módulos dinámicos', active: false },
    { label: 'Configuración', active: false },
  ]

  return (
    <aside className="sidebar d-flex flex-column gap-3">
      <div>
        <p className="text-uppercase fw-semibold mb-1">{readableRole}</p>
        <small className="text-light">Accesos basados en rol desde endpoint de menús.</small>
      </div>
      <nav className="nav flex-column gap-1">
        {placeholderMenu.map((item) => (
          <a key={item.label} className={`nav-link ${item.active ? 'active' : ''}`} href="#">
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  )
}
