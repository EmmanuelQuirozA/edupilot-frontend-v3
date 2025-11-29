import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'

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

  const lastNameFromFullName = user?.full_name?.split(' ').at(-1)
  const initials = getUserInitials(user?.first_name, lastNameFromFullName)
  const displayName = user?.full_name || user?.first_name || t('welcome')
  const currentPageTitle = pageTitle ?? t('portalTitle')
  const contextText = pageContext ?? 'School the sauses'

  return (
    <header className="app-header">
      <div className="container-fluid">
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
              <span aria-hidden="true">🔍</span>
              <input className="form-control header-search-input" placeholder="Buscar" type="search" />
            </div>

            <button className="icon-pill" type="button" aria-label="Notifications">
              <span aria-hidden="true">🔔</span>
            </button>

            <div className="dropdown">
              <button
                className="language-pill dropdown-toggle"
                data-bs-toggle="dropdown"
                type="button"
                aria-label={t('languageLabel')}
              >
                {locale.toUpperCase()}
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <button className="dropdown-item" onClick={() => setLocale('es')}>
                    Español
                  </button>
                </li>
                <li>
                  <button className="dropdown-item" onClick={() => setLocale('en')}>
                    English
                  </button>
                </li>
              </ul>
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
      </div>
    </header>
  )
}
