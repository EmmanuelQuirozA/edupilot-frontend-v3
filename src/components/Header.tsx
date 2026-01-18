import { useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../config'
import LanguageSelector from './LanguageSelector'
import type { Locale } from '../context/LanguageContext'
import './Header.css'

interface HeaderProps {
  onNavigate: (path: string) => void
  onToggleSidebar?: () => void
  pageTitle?: string
  pageContext?: string
}

function getUserInitials(name?: string, lastName?: string) {
  const firstInitial = name?.trim().charAt(0) ?? ''
  const lastInitial = lastName?.trim().charAt(0) ?? ''
  return `${firstInitial}${lastInitial}`.toUpperCase() || 'EP'
}

export function Header({ onNavigate, onToggleSidebar, pageTitle, pageContext }: HeaderProps) {
  const { locale, setLocale, t } = useLanguage()
  const { user, logout, token } = useAuth()
  const [schoolName, setSchoolName] = useState<string | null>(null)

  const lastNameFromFullName = user?.full_name?.split(' ').at(-1)
  const initials = getUserInitials(user?.first_name, lastNameFromFullName)
  const displayName = user?.first_name || t('welcome')
  const currentPageTitle = pageTitle ?? t('portalTitle')
  const contextText = pageContext ?? schoolName ?? 'Edupilot'

  useEffect(() => {
    if (!token) {
      setSchoolName(null)
      return
    }

    const controller = new AbortController()

    const fetchCommercialName = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/schools/commercial-name`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const payload = (await response.json()) as
          | string
          | {
              commercial_name?: string | null
              name?: string | null
              school_name?: string | null
            }

        if (typeof payload === 'string') {
          setSchoolName(payload || null)
          return
        }

        setSchoolName(payload.commercial_name || payload.school_name || payload.name || null)
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setSchoolName(null)
        }
      }
    }

    fetchCommercialName()

    return () => controller.abort()
  }, [token])

  const handleLanguageChange = (nextLocale: Locale) => {
    if (nextLocale !== locale) {
      const currentPath = window.location.pathname
      const nextPath = /^\/(es|en)/.test(currentPath)
        ? currentPath.replace(/^\/(es|en)/, `/${nextLocale}`)
        : `/${nextLocale}${currentPath.startsWith('/') ? currentPath : `/${currentPath}`}`

      onNavigate(nextPath)
      setLocale(nextLocale)
    }
  }

  return (
    <header>
      <div className="header-container">
        <div className="d-flex align-items-start gap-3">
          {onToggleSidebar ? (
            <button className="btn btn-outline-primary d-lg-none" onClick={onToggleSidebar} aria-label="Toggle sidebar">
              ☰
            </button>
          ) : null}

          <div>
            <h1 className="header-title mb-1">{currentPageTitle}</h1>
            <p className="header-subtitle mb-0">{contextText}</p>
          </div>
        </div>

        <div className="header-actions">
          <div className="header-search">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16a6.471 6.471 0 0 0 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5Zm-6 0A4.5 4.5 0 1 1 14 9.5 4.505 4.505 0 0 1 9.5 14Z" fill="currentColor"></path></svg>
            <input className="form-control header-search-input" placeholder="Buscar" type="search" />
          </div>

          <button className="notification-pill" type="button" aria-label="Notifications">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a5 5 0 0 0-5 5v2.17c0 .7-.28 1.37-.77 1.86L4.6 13.65A1 1 0 0 0 5.3 15h13.4a1 1 0 0 0 .7-1.35l-1.63-1.62a2.63 2.63 0 0 1-.77-1.86V8a5 5 0 0 0-5-5Zm0 18a2.5 2.5 0 0 1-2.45-2h4.9A2.5 2.5 0 0 1 12 21Z" fill="currentColor"></path></svg>
            <span></span>
          </button>
          
          <div className="sidebar__language-badge">
            <LanguageSelector value={locale} onChange={handleLanguageChange} />
          </div>

          {token ? (
            <div className="dropdown">
              <button className="user-chip" data-bs-toggle="dropdown" type="button">
                <div className="user-avatar">{initials}</div>
                <div className="d-flex flex-column text-start">
                  <span className="user-name">{displayName}</span>
                  <small className="text-muted">{t('portalTitle')}</small>
                </div>
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <button className="dropdown-item" type="button">
                    Perfil
                  </button>
                </li>
                <li>
                  <button className="dropdown-item" type="button">
                    Ayuda
                  </button>
                </li>
                <li>
                  <button className="dropdown-item" onClick={logout} type="button">
                    {t('logout')}
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={() => onNavigate('/login')}>
              {t('homeCta')}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
