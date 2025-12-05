import { useLanguage } from '../context/LanguageContext'

export function NoPermission() {
  const { t } = useLanguage()

  return (
    <div className="d-flex flex-column align-items-center justify-content-center text-center py-5">
      <div className="bg-light rounded-circle p-3 mb-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          fill="currentColor"
          className="bi bi-shield-lock text-warning"
          viewBox="0 0 16 16"
        >
          <path d="M5.5 9.5a2.5 2.5 0 0 1 5 0v1.415a1.5 1.5 0 1 1-1 0V9.5a1.5 1.5 0 0 0-3 0V11a.5.5 0 0 1-1 0z" />
          <path d="M5.072 1.21a1 1 0 0 1 .856-.175l2.5.694a1 1 0 0 0 .544 0l2.5-.694A1 1 0 0 1 12.5 2v5.4c0 2.152-1.227 4.337-3.677 6.185a.5.5 0 0 1-.646 0C5.727 11.737 4.5 9.552 4.5 7.4V2a1 1 0 0 1 .572-.79M5.5 2.633v4.767c0 1.693 1.01 3.49 2.5 4.932 1.49-1.441 2.5-3.24 2.5-4.932V2.633l-2 .555a2 2 0 0 1-1.054 0z" />
        </svg>
      </div>
      <h5 className="mb-2">{t('noPermissionTitle')}</h5>
      <p className="text-muted mb-0" style={{ maxWidth: 520 }}>
        {t('noPermissionDescription')}
      </p>
    </div>
  )
}
