import { useLanguage } from '../context/LanguageContext'

export function Footer() {
  const { t } = useLanguage()
  return (
    <footer className="bg-white border-top" style={{ height: '72px' }}>
      <div className="container-fluid h-100 d-flex align-items-center justify-content-between px-3">
        <span className="text-muted small">{t('footerText')}</span>
        <div className="d-flex gap-3 text-muted small">
          <span>Soporte</span>
          <span>Privacidad</span>
        </div>
      </div>
    </footer>
  )
}
