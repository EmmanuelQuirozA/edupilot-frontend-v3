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
  icon?: string | TrustedHTML | null
}

interface MenuSection {
  label: string
  items: MenuItem[]
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
  myconsumption: (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-fork-knife" viewBox="0 0 16 16">
      <path d="M13 .5c0-.276-.226-.506-.498-.465-1.703.257-2.94 2.012-3 8.462a.5.5 0 0 0 .498.5c.56.01 1 .13 1 1.003v5.5a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5zM4.25 0a.25.25 0 0 1 .25.25v5.122a.128.128 0 0 0 .256.006l.233-5.14A.25.25 0 0 1 5.24 0h.522a.25.25 0 0 1 .25.238l.233 5.14a.128.128 0 0 0 .256-.006V.25A.25.25 0 0 1 6.75 0h.29a.5.5 0 0 1 .498.458l.423 5.07a1.69 1.69 0 0 1-1.059 1.711l-.053.022a.92.92 0 0 0-.58.884L6.47 15a.971.971 0 1 1-1.942 0l.202-6.855a.92.92 0 0 0-.58-.884l-.053-.022a1.69 1.69 0 0 1-1.059-1.712L3.462.458A.5.5 0 0 1 3.96 0z"/>
    </svg>
  ),
  finance: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 6.5C4 5.12 5.12 4 6.5 4h11A1.5 1.5 0 0 1 19 5.5V7H4V6.5Z"
        fill="currentColor"
        opacity="0.2"
      />
      <path
        d="M4 9h15v9.5A1.5 1.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5V9Z"
        fill="currentColor"
      />
      <path
        d="M12 10v6m0 0a2.5 2.5 0 0 1-2.5-2.5M12 16a2.5 2.5 0 0 0 2.5-2.5M9.5 13.5h5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
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
  const { user, token, logout, role } = useAuth()
  const { locale } = useLanguage()
  const [modules, setModules] = useState<ModuleAccess[]>([])
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname)

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
        const response = await fetch(`${API_BASE_URL}/permissions/menu-access?${params.toString()}`, {
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

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname)
    const handleNavigate = (event: Event) => {
      const customEvent = event as CustomEvent<{ path?: string }>
      const nextPath = customEvent.detail?.path ?? window.location.pathname
      setCurrentPath(nextPath)
    }

    window.addEventListener('popstate', handlePopState)
    window.addEventListener('app:navigate', handleNavigate)
    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('app:navigate', handleNavigate)
    }
  }, [])

  // Construcción de secciones SOLO si usuario autenticado
  const menuSections: MenuSection[] = useMemo(() => {
    const modulePaths: Record<string, string> = {
      dashboard: `/${locale}`,
      settings: `/${locale}/settings`,
      finance: `/${locale}/finance`,
      myconsumption: `/${locale}/myconsumption`,
    }
    if (!token) return []

    const visibleModules = modules
      .sort((a, b) => {
        const orderA = a.sort_order ?? Number.MAX_SAFE_INTEGER
        const orderB = b.sort_order ?? Number.MAX_SAFE_INTEGER
        if (orderA !== orderB) return orderA - orderB
        return a.module_name.localeCompare(b.module_name)
      })

    const moduleItems: MenuItem[] = visibleModules.map((m) => ({
      key: m.module_key,
      label: m.module_name,
      path: modulePaths[m.module_key] ?? `/${locale}/${m.module_key}`,
      icon: m.icon,
    }))

    if (role === 'STUDENT' && !moduleItems.some((item) => item.key === 'finance')) {
      moduleItems.unshift({
        key: 'finance',
        label: 'Mis finanzas',
        path: modulePaths.finance,
      })
    }

    return [
      {
        label: 'Dashboard',
        items: [
          { key: 'dashboard', label: 'Dashboard', path: modulePaths.dashboard }
        ]
      },
      {
        label: 'Menú principal',
        items: moduleItems,
      },
      {
        label: 'Personal',
        items: [
          { key: 'myconsumption', label: 'Mi consumo', path: modulePaths.myconsumption }
        ]
      }
      // ,
      // {
      //   label: 'Ajustes',
      //   items: [
      //     { key: 'settings', label: 'Configuración', path: modulePaths.settings }
      //   ]
      // }
    ]
  }, [locale, modules, role, token])

  // Si no hay token → sidebar completamente oculto o vacío
  if (!token) {
    return null
  }

  const isActivePath = (path?: string) => {
    if (!path) return false
    const normalizedPath = path.replace(/\/+$/, '')
    const normalizedCurrent = currentPath.replace(/\/+$/, '')
    if (normalizedCurrent === normalizedPath) return true
    if (normalizedPath === `/${locale}`) return false
    return normalizedCurrent.startsWith(`${normalizedPath}/`)
  }

  const handleNavigation = (event: MouseEvent<HTMLAnchorElement>, path?: string) => {
    if (!path) return

    const active = isActivePath(path)
    if (active) {
      event.preventDefault()
      return
    }

    event.preventDefault()
    setCurrentPath(path)
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
                className={`nav-link sidebar-link d-flex align-items-center gap-3 ${isActivePath(item.path) ? 'active' : ''}`}
                href={item.path ?? '#'}
                onClick={(event) => handleNavigation(event, item.path)}
                aria-current={isActivePath(item.path) ? 'page' : undefined}
              >
                {(() => {
                  const iconHtml = typeof item.icon === 'string' ? item.icon : item.icon?.toString?.()
                  if (iconHtml && iconHtml.trim().length > 0) {
                    return (
                      <span
                        className="sidebar-icon"
                        dangerouslySetInnerHTML={{ __html: iconHtml }}
                      />
                    )
                  }

                  return (
                    <span className="sidebar-icon">
                      {menuIcons[item.key as keyof typeof menuIcons] || menuIcons.default}
                    </span>
                  )
                })()}
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
