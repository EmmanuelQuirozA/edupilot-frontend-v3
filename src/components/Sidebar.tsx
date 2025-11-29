import { useAuth } from '../context/AuthContext'
import './sidebar.css'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const menuIcons = {
  dashboard: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor" />
      <rect x="13" y="3" width="8" height="5" rx="2" fill="currentColor" />
      <rect x="13" y="10" width="8" height="11" rx="2" fill="currentColor" />
      <rect x="3" y="13" width="8" height="8" rx="2" fill="currentColor" />
    </svg>
  ),
  payments: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="6" width="20" height="12" rx="2" fill="currentColor" opacity="0.2" />
      <rect x="2" y="8" width="20" height="3" fill="currentColor" />
      <rect x="4" y="14" width="6" height="2" rx="1" fill="currentColor" />
      <rect x="12" y="14" width="4" height="2" rx="1" fill="currentColor" />
    </svg>
  ),
  students: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 2 8l10 5 7-3.5V15a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-2" fill="currentColor" opacity="0.2" />
      <path d="M12 3 2 8l10 5 10-5-10-5Z" fill="currentColor" />
      <path d="M19 10v6a2 2 0 0 0 2 2h1" fill="currentColor" />
    </svg>
  ),
  teachers: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="9" y="4" width="12" height="8" rx="1.5" fill="currentColor" />
      <circle cx="6.5" cy="9" r="2.5" fill="currentColor" />
      <path d="M2 18a4.5 4.5 0 0 1 9 0v2H2v-2Z" fill="currentColor" />
      <rect x="11" y="13" width="8" height="2" rx="1" fill="currentColor" />
    </svg>
  ),
  schedules: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" fill="currentColor" opacity="0.2" />
      <rect x="3" y="8" width="18" height="3" fill="currentColor" />
      <rect x="7" y="3" width="2" height="4" rx="1" fill="currentColor" />
      <rect x="15" y="3" width="2" height="4" rx="1" fill="currentColor" />
      <path
        d="M9 16l2 2 4-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  grades: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6 3h8l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
        fill="currentColor"
        opacity="0.2"
      />
      <path d="M14 3v5h5" fill="currentColor" />
      <rect x="8" y="12" width="8" height="2" rx="1" fill="currentColor" />
      <rect x="8" y="16" width="6" height="2" rx="1" fill="currentColor" />
    </svg>
  ),
  communications: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 4h10a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3H9l-4 3V7a3 3 0 0 1 3-3Z" fill="currentColor" />
      <path d="M10 12h6a2 2 0 0 1 2 2v5l3-2" fill="currentColor" opacity="0.3" />
    </svg>
  ),
}

const menuSections = [
  {
    label: 'Menú principal',
    items: [
      { key: 'dashboard', label: 'Dashboard', active: true },
      { key: 'payments', label: 'Pagos y Finanzas' },
      { key: 'students', label: 'Alumnos y Grupos' },
      { key: 'teachers', label: 'Profesores' },
      { key: 'schedules', label: 'Horarios y Tareas' },
      { key: 'grades', label: 'Calificaciones' },
      { key: 'communications', label: 'Comunicaciones' },
    ],
  },
  {
    label: 'Ajustes',
    items: [
      { key: 'payments-center', label: 'Centro de pagos' },
      { key: 'settings', label: 'Configuración' },
    ],
  },
]

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuth()
  const initial = user?.first_name?.[0]?.toUpperCase() || 'H'

  return (
    <aside className={`sidebar d-flex flex-column ${isOpen ? 'is-open' : ''}`}>
      <div className="d-flex align-items-center gap-3 mb-3">
        <div className="sidebar-avatar">{initial}</div>
        <div>
          <p className="mb-0 fw-semibold text-white">{user?.full_name || 'Hermenegildo'}</p>
          <small className="text-light sidebar-subtitle">Panel estudiantil</small>
        </div>
        <button className="btn btn-link text-white ms-auto d-lg-none" onClick={onClose} aria-label="Cerrar menú">
          ✕
        </button>
      </div>

      {menuSections.map((section) => (
        <div key={section.label} className="my-3">
          <p className="text-uppercase sidebar-section mb-2">{section.label}</p>
          <nav className="nav flex-column gap-2">
            {section.items.map((item) => (
              <a
                key={item.key}
                className={`nav-link sidebar-link d-flex align-items-center gap-3 ${item.active ? 'active' : ''}`}
                href="#"
              >
                <span className="sidebar-icon">{menuIcons[item.key as keyof typeof menuIcons]}</span>
                <span>{item.label}</span>
              </a>
            ))}
          </nav>
        </div>
      ))}

      <div className="mt-auto pt-2">
        <button className="btn btn-outline-light w-100">Cerrar sesión</button>
      </div>
    </aside>
  )
}
