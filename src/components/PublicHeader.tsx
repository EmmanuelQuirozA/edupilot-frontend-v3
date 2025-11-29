import LanguageSelector from './LanguageSelector'
import { useLanguage, type Locale } from '../context/LanguageContext'

interface PublicHeaderProps {
  onNavigate: (path: string) => void
}

export function PublicHeader({ onNavigate }: PublicHeaderProps) {
  const { locale, setLocale, t } = useLanguage()

  const handleLanguageChange = (nextLocale: Locale) => {
    if (nextLocale !== locale) {
      setLocale(nextLocale)
    }
  }

  return (
    <header className="py-3 border-bottom bg-white">
      <div className="container d-flex justify-content-between align-items-center gap-3">
        <div className="d-flex align-items-center gap-2">
          <div className="logo-circle bg-primary text-white">EP</div>
          <div>
            <p className="mb-0 small text-muted">EduPilot</p>
            <p className="mb-0 fw-semibold">{t('homeTitle')}</p>
          </div>
        </div>
        <div className="d-flex align-items-center gap-3">
          <LanguageSelector value={locale} onChange={handleLanguageChange} />
          <button className="btn btn-primary" onClick={() => onNavigate('/login')}>
            {t('homeCta')}
          </button>
        </div>
      </div>
    </header>
  )
}
