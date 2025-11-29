import { useState } from 'react'
import type { FormEvent } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'

interface LoginPageProps {
  onNavigate: (path: string) => void
}

export function LoginPage({ onNavigate }: LoginPageProps) {
  const { t } = useLanguage()
  const { login } = useAuth()
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    try {
      await login(usernameOrEmail, password)
      Swal.fire({ icon: 'success', title: t('welcome') })
      onNavigate('/portal')
    } catch (error) {
      const message = (error as Error).message
      if (message === 'wrong_credentials') {
        Swal.fire({ icon: 'error', title: t('wrongCredentials') })
      } else if (message === 'service_unavailable') {
        Swal.fire({ icon: 'error', title: t('serviceUnavailable') })
      } else {
        Swal.fire({ icon: 'error', title: t('defaultError') })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-5">
      <div className="login-card row g-0">
        <div className="col-lg-5 d-flex flex-column justify-content-between p-4 login-bg">
          <div>
            <div className="d-flex align-items-center gap-2 mb-4">
              <div className="logo-circle bg-white text-primary">EP</div>
              <div>
                <p className="mb-0 text-white-50 small">EduPilot</p>
                <h5 className="mb-0">{t('portalTitle')}</h5>
              </div>
            </div>
            <h3 className="fw-bold mb-3">{t('loginTitle')}</h3>
            <p className="mb-0">{t('loginSubtitle')}</p>
          </div>
          <div className="mt-4">
            <p className="fw-semibold mb-1">Roles soportados</p>
            <ul className="small mb-0">
              <li>Administración</li>
              <li>Gestión escolar</li>
              <li>Administración académica</li>
              <li>Estudiantes</li>
              <li>Profesores</li>
              <li>Cocina</li>
            </ul>
          </div>
        </div>
        <div className="col-lg-7 p-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4 className="fw-bold mb-1">{t('loginTitle')}</h4>
              <p className="text-muted mb-0">{t('loginSubtitle')}</p>
            </div>
            <button className="btn btn-outline-primary" onClick={() => onNavigate('/')}>Home</button>
          </div>
          <form className="row g-3" onSubmit={handleSubmit}>
            <div className="col-12">
              <div className="form-floating">
                <input
                  type="text"
                  className="form-control"
                  id="username"
                  placeholder={t('usernameLabel')}
                  value={usernameOrEmail}
                  onChange={(event) => setUsernameOrEmail(event.target.value)}
                  required
                />
                <label htmlFor="username">{t('usernameLabel')}</label>
              </div>
            </div>
            <div className="col-12">
              <div className="form-floating">
                <input
                  type="password"
                  className="form-control"
                  id="password"
                  placeholder={t('passwordLabel')}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <label htmlFor="password">{t('passwordLabel')}</label>
              </div>
            </div>
            <div className="col-12 d-flex justify-content-between align-items-center">
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="remember" />
                <label className="form-check-label" htmlFor="remember">
                  {t('rememberMe')}
                </label>
              </div>
              <a href="#" className="text-decoration-none">
                {t('forgotPassword')}
              </a>
            </div>
            <div className="col-12">
              <button className="btn btn-primary w-100" type="submit" disabled={loading}>
                {loading ? '...' : t('signIn')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
