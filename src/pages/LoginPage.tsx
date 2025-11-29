import { useState } from 'react'
// import type { FormEvent } from 'react'
// import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import LanguageSelector from '../components/LanguageSelector';
import './LoginPage.css';

interface LoginPageProps {
  onNavigate: (path: string) => void
}

export function LoginPage({ onNavigate }: LoginPageProps) {
  const { login, loading } = useAuth();
  const t = getTranslation(language);
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('');


  const handleSubmit = async (event) => {
    event.preventDefault();

    setError('');

    try {
      await login(username, password);
    } catch (err) {
      if (err?.status === 401) {
        setError(t.errors.invalidCredentials);
        return;
      }

      if (err?.status === 403) {
        setError(t.errors.userDisabled);
        return;
      }

      if (err?.code === 'MISSING_ROLE') {
        setError(t.errors.missingRole);
        return;
      }

      if (err?.code === 'NETWORK_ERROR') {
        setError(t.errors.network);
        return;
      }

      setError(t.errors.unexpected);
    }
  };

  return (
    
    <div className="login-page">
      <div className="login-page__media">
        <div className="login-page__media-overlay" />
        <div className="login-page__language-selector">
          <LanguageSelector value={language} onChange={onLanguageChange} />
        </div>
        <div className="login-page__headline">
          <p>{t.welcomeHeadline}</p>
        </div>
      </div>
      <div className="login-page__form-wrapper">
        <form className="login-form" onSubmit={handleSubmit}>
          <h1 className="login-form__title">{t.loginTitle}</h1>
          <label className="login-form__field">
            <span className="sr-only">{t.usernamePlaceholder}</span>
            <input
              type="text"
              autoComplete="usernameOrEmail"
              placeholder={t.usernamePlaceholder}
              value={usernameOrEmail}
              onChange={(event) => setUsernameOrEmail(event.target.value)}
              required
            />
          </label>
          <label className="login-form__field">
            <span className="sr-only">{t.passwordPlaceholder}</span>
            <input
              type="password"
              autoComplete="current-password"
              placeholder={t.passwordPlaceholder}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <div className="login-form__actions">
            <button type="button" className="login-form__link">
              {t.forgotPassword}
            </button>
          </div>
          {error ? <p className="login-form__error" role="alert">{error}</p> : null}
          <button type="submit" className="login-form__submit" disabled={loading}>
            {loading ? '...' : t.submit}
          </button>
        </form>
      </div>
    </div>
  )
}
