import { useLanguage } from '../context/LanguageContext'

export function PublicFooter() {
  const { t } = useLanguage()

  return (
    <footer className="bg-white border-top py-3">
      <div className="container d-flex align-items-center justify-content-between">
        <span className="text-muted small">{t('footerText')}</span>
        <div className="d-flex gap-3 text-muted small">
          <span>Soporte</span>
          <span>Privacidad</span>
        </div>
      </div>
    </footer>
  )
}
