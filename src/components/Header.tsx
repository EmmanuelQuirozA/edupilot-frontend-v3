import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'

interface HeaderProps {
  onNavigate: (path: string) => void
}

export function Header({ onNavigate }: HeaderProps) {
  const { locale, setLocale, t } = useLanguage()
  const { user, logout, token } = useAuth()

  return (
    <header className="navbar navbar-expand-lg bg-white px-3 py-2 header-shadow" style={{ height: 'var(--header-height)' }}>
      <div className="container-fluid">
        <div className="d-flex align-items-center gap-2">
          <div className="logo-circle">EP</div>
          <span className="fw-bold text-primary">EduPilot</span>
        </div>

        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small">{t('languageLabel')}:</span>
            <select
              className="form-select form-select-sm"
              style={{ width: '120px' }}
              value={locale}
              onChange={(event) => setLocale(event.target.value as 'es' | 'en')}
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>

          {token ? (
            <div className="dropdown">
              <button className="btn btn-outline-primary dropdown-toggle" data-bs-toggle="dropdown" type="button">
                {user?.first_name || t('welcome')}
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <button className="dropdown-item" onClick={() => onNavigate('/portal')}>
                    {t('portalTitle')}
                  </button>
                </li>
                <li>
                  <button className="dropdown-item" onClick={logout}>
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
