import { useState, type FormEvent } from 'react'
import LanguageSelector from '../components/LanguageSelector'
import { useAuth } from '../context/AuthContext'
import { useLanguage, type Locale } from '../context/LanguageContext'
import './LoginPage.css'

interface LoginPageProps {
  onNavigate: (path: string) => void
}

export function LoginPage({ onNavigate }: LoginPageProps) {
  const { login } = useAuth()
  const { locale, setLocale, t } = useLanguage()

  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const handleLanguageChange = (nextLocale: Locale) => {
    if (nextLocale !== locale) {
      setLocale(nextLocale)
      onNavigate(`/${nextLocale}/login`)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setPending(true)

    try {
      await login(usernameOrEmail, password)
    } catch (err) {
      const code = (err as Error).message

      if (code === 'wrong_credentials') {
        setError(t('wrongCredentials'))
        return
      }

      if (code === 'service_unavailable') {
        setError(t('serviceUnavailable'))
        return
      }

      setError(t('defaultError'))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-page__media">
        <div className="login-page__media-overlay" />
        <div className="login-page__language-selector">
          <LanguageSelector value={locale} onChange={handleLanguageChange} />
        </div>
        <div className="login-page__headline">
          <p className="login-page__eyebrow">EduPilot Platform</p>
          <h2>{t('loginPageTitle')}</h2>
        </div>
      </div>
      <div className="login-page__form-wrapper">
        <form className="login-form" onSubmit={handleSubmit}>
          <header className="login-form__header">
            <h1 className="login-form__title">{t('loginTitle')}</h1>
            <p className="login-form__subtitle">{t('loginSubtitle')}</p>
          </header>
          <label className="login-form__field">
            <span className="sr-only">{t('usernameLabel')}</span>
            <input
              type="text"
              autoComplete="username"
              placeholder={t('usernameLabel')}
              value={usernameOrEmail}
              onChange={(event) => setUsernameOrEmail(event.target.value)}
              required
            />
          </label>
          <label className="login-form__field">
            <span className="sr-only">{t('passwordLabel')}</span>
            <input
              type="password"
              autoComplete="current-password"
              placeholder={t('passwordLabel')}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <div className="login-form__actions">
            <div className="login-form__remember">
              <input type="checkbox" id="rememberMe" />
              <label htmlFor="rememberMe">{t('rememberMe')}</label>
            </div>
            <button type="button" className="login-form__link">
              {t('forgotPassword')}
            </button>
          </div>
          {error ? (
            <p className="login-form__error" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" className="login-form__submit" disabled={pending}>
            {pending ? '...' : t('signIn')}
          </button>
        </form>
      </div>
    </div>
  )
}
