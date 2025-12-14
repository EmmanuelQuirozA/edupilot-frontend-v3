import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import { API_BASE_URL } from '../config'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import './sidebar.css'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  onNavigate?: (path: string) => void
}

interface ModuleAccess {
  module_id: number
  role_id: number
  school_id: number
  permission_id: number
  module_key: string
  module_name: string
  sort_order: number | null
  c: boolean
  r: boolean
  u: boolean
  d: boolean
  icon: string | null
}

interface MenuItem {
  key: string
  label: string
  path?: string
  icon: string | TrustedHTML
}

interface MenuSection {
  label: string
  items: MenuItem[]
}

const menuIcons = {
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


export function Sidebar({ isOpen, onClose, onNavigate }: SidebarProps) {
  const { user, token, logout } = useAuth()
  const { locale } = useLanguage()
  const [modules, setModules] = useState<ModuleAccess[]>([])

  const initial = user?.first_name?.[0]?.toUpperCase() || 'U'

  useEffect(() => {
    if (!token) {
      setModules([])
      return
    }

    const controller = new AbortController()

    async function fetchModules() {
      try {
        const params = new URLSearchParams({
          lang: locale,
        })
        const response = await fetch(`${API_BASE_URL}/permissions/module-access?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!response.ok) throw new Error('Failed to fetch modules')

        const data = await response.json() as ModuleAccess[]
        setModules(data)
      } catch (error) {
        if ((error as DOMException)?.name === 'AbortError') return
        console.error('Error fetching access control modules', error)
        setModules([]) // ← Sidebar vacío si falla
      }
    }

    fetchModules()
    return () => controller.abort()
  }, [locale, token])

  // Construcción de secciones SOLO si usuario autenticado
  const menuSections: MenuSection[] = useMemo(() => {
    const modulePaths: Record<string, string> = {
      dashboard: `/${locale}`,
      schools: `/${locale}/schools`,
      users: `/${locale}/control-access`,
      settings: `/${locale}/settings`,
    }
    if (!token) return []

    const visibleModules = modules
      .filter((module) => module.r)
      .sort((a, b) => {
        const orderA = a.sort_order ?? Number.MAX_SAFE_INTEGER
        const orderB = b.sort_order ?? Number.MAX_SAFE_INTEGER
        if (orderA !== orderB) return orderA - orderB
        return a.module_name.localeCompare(b.module_name)
      })
      
    return [
      {
        label: 'Menú principal',
        items: visibleModules.map((m) => ({
          key: m.module_key,
          label: m.module_name,
          path: modulePaths[m.module_key] ?? `/${locale}/${m.module_key}`,
          icon: m.icon,
        })),
      },
      {
        label: 'Ajustes',
        items: [
          { key: 'settings', label: 'Configuración', path: modulePaths.settings }
        ]
      }
    ]
  }, [locale, modules, token])

  // Si no hay token → sidebar completamente oculto o vacío
  if (!token) {
    return null
  }

  const handleNavigation = (event: MouseEvent<HTMLAnchorElement>, path?: string) => {
    if (!path) return
    event.preventDefault()
    onNavigate?.(path)
    onClose()
  }

  return (
    <aside className={`sidebar d-flex flex-column sidebar_container ${isOpen ? 'is-open' : 'd-none'}`}>
      <div className="d-flex align-items-center gap-3 mb-3">
        <div className="sidebar-avatar">{initial}</div>
        <div>
          <p className="mb-0 fw-semibold text-white">{user?.full_name}</p>
          <small className="text-light sidebar-subtitle">Panel</small>
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
                href={item.path ?? '#'}
                onClick={(event) => handleNavigation(event, item.path)}
              >
                {/* <span
                  className="sidebar-icon"
                  dangerouslySetInnerHTML={{
                    __html: item.icon
                      || menuIcons[item.key as keyof typeof menuIcons]
                      || menuIcons.default
                  }}
                /> */}
                <span className="sidebar-icon">
                  {typeof item.icon === 'string' ? (
                    <span
                      dangerouslySetInnerHTML={{ __html: item.icon }}
                    />
                  ) : (
                    menuIcons[item.key as keyof typeof menuIcons] || menuIcons.default
                  )}
                </span>
                <span>{item.label}</span>
              </a>
            ))}
          </nav>
        </div>
      ))}

      <div className="mt-auto pt-3 sidebar-logout">
        <button className="sidebar-logout__button" onClick={logout} type="button">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m16 17 5-5-5-5"></path>
            <path d="M21 12H9"></path>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          </svg>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}
