import { useEffect, useMemo, useState } from 'react'
import { API_BASE_URL } from '../config'
import { useAuth } from '../context/AuthContext'
import './sidebar.css'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface ModuleAccess {
  moduleId: number
  moduleName: string
  moduleKey: string
  moduleAccessControlId: number
  schoolId: number | null
  enabled: boolean
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
  balances: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" fill="currentColor" opacity="0.2" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="9" cy="13" r="2" fill="currentColor" />
      <circle cx="15" cy="13" r="2" fill="currentColor" />
    </svg>
  ),
  classes: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5h12a2 2 0 0 1 2 2v12H6a2 2 0 0 1-2-2Z" fill="currentColor" opacity="0.2" />
      <path d="M16 5V3H6a2 2 0 0 0-2 2v12h2V5Z" fill="currentColor" />
      <path d="M8 9h8M8 13h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  coffee: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 5h11v9a5 5 0 0 1-5 5H6Z" fill="currentColor" opacity="0.2" />
      <path d="M17 7h2.5a2.5 2.5 0 0 1 0 5H17" stroke="currentColor" strokeWidth="2" />
      <path d="M9 3v3M12 3v3M15 3v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 19h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  reports: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 4h9l3 3v13H6Z" fill="currentColor" opacity="0.2" />
      <path d="M15 4v4h3" stroke="currentColor" strokeWidth="2" />
      <path d="M9 11h6M9 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z"
        fill="currentColor"
        opacity="0.25"
      />
      <path
        d="M19.4 12.94a7.97 7.97 0 0 0 0-1.88l2.04-1.58a.5.5 0 0 0 .12-.64l-1.93-3.34a.5.5 0 0 0-.6-.22l-2.4.96a7.94 7.94 0 0 0-1.62-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.86a.5.5 0 0 0-.5.42l-.36 2.54a7.94 7.94 0 0 0-1.62.94l-2.4-.96a.5.5 0 0 0-.6.22L2.44 8.84a.5.5 0 0 0 .12.64l2.04 1.58a7.97 7.97 0 0 0 0 1.88L2.56 14.5a.5.5 0 0 0-.12.64l1.93 3.34a.5.5 0 0 0 .6.22l2.4-.96c.49.4 1.04.73 1.62.94l.36 2.54a.5.5 0 0 0 .5.42h3.86a.5.5 0 0 0 .5-.42l.36-2.54c.58-.21 1.13-.54 1.62-.94l2.4.96a.5.5 0 0 0 .6-.22l1.93-3.34a.5.5 0 0 0-.12-.64ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7Z"
        fill="currentColor"
      />
    </svg>
  ),
  default: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.2" />
      <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
}

const moduleLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  payments: 'Pagos y Finanzas',
  students: 'Alumnos y Grupos',
  teachers: 'Profesores',
  schedules: 'Horarios y Tareas',
  grades: 'Calificaciones',
  communications: 'Comunicaciones',
  balances: 'Balances',
  classes: 'Clases',
  coffee: 'Cafetería',
  reports: 'Reportes',
}

const settingsItems = [
  { key: 'payments-center', label: 'Centro de pagos' },
  { key: 'settings', label: 'Configuración' },
]

const defaultModules: ModuleAccess[] = [
  {
    moduleId: 1,
    moduleName: 'Dashboard',
    moduleKey: 'dashboard',
    moduleAccessControlId: 1,
    schoolId: null,
    enabled: true,
  },
  {
    moduleId: 2,
    moduleName: 'Payments',
    moduleKey: 'payments',
    moduleAccessControlId: 2,
    schoolId: null,
    enabled: true,
  },
  {
    moduleId: 3,
    moduleName: 'Students',
    moduleKey: 'students',
    moduleAccessControlId: 3,
    schoolId: null,
    enabled: true,
  },
  {
    moduleId: 4,
    moduleName: 'Teachers',
    moduleKey: 'teachers',
    moduleAccessControlId: 4,
    schoolId: null,
    enabled: true,
  },
  {
    moduleId: 5,
    moduleName: 'Schedules',
    moduleKey: 'schedules',
    moduleAccessControlId: 5,
    schoolId: null,
    enabled: true,
  },
  {
    moduleId: 6,
    moduleName: 'Grades',
    moduleKey: 'grades',
    moduleAccessControlId: 6,
    schoolId: null,
    enabled: true,
  },
  {
    moduleId: 7,
    moduleName: 'Communications',
    moduleKey: 'communications',
    moduleAccessControlId: 7,
    schoolId: null,
    enabled: true,
  },
]

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, token } = useAuth()
  const initial = user?.first_name?.[0]?.toUpperCase() || 'H'

  const [modules, setModules] = useState<ModuleAccess[]>([])

  useEffect(() => {
    if (!token) {
      setModules(defaultModules)
      return
    }

    const controller = new AbortController()

    async function fetchModules() {
      try {
        const response = await fetch(`${API_BASE_URL}modules/access-control`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Failed to fetch modules')
        }

        const data = (await response.json()) as ModuleAccess[]
        setModules(data.filter((module) => module.enabled !== false))
      } catch (error) {
        console.error('Error fetching access control modules', error)
        setModules(defaultModules)
      }
    }

    fetchModules()

    return () => controller.abort()
  }, [token])

  const menuSections = useMemo(
    () => [
      {
        label: 'Menú principal',
        items: modules.map((module) => ({
          key: module.moduleKey,
          label: moduleLabels[module.moduleKey] || module.moduleName,
        })),
      },
      {
        label: 'Ajustes',
        items: settingsItems,
      },
    ],
    [modules],
  )

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
                className="nav-link sidebar-link d-flex align-items-center gap-3"
                href="#"
              >
                <span className="sidebar-icon">{menuIcons[item.key as keyof typeof menuIcons] || menuIcons.default}</span>
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
