import { Layout } from '../layout/Layout'
import { useLanguage } from '../context/LanguageContext'

interface PortalPageProps {
  onNavigate: (path: string) => void
}

export function PortalPage({ onNavigate }: PortalPageProps) {
  const { t } = useLanguage()

  return (
    <Layout onNavigate={onNavigate}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <p className="text-uppercase text-muted mb-1">{t('portalTitle')}</p>
          <h2 className="fw-bold mb-2">{t('welcome')}</h2>
          <p className="text-muted mb-0">{t('portalSubtitle')}</p>
        </div>
        <button className="btn btn-outline-primary" onClick={() => onNavigate('/')}>Home</button>
      </div>
      <div className="card shadow-sm">
        <div className="card-body">
          <h5 className="card-title">Módulos</h5>
          <p className="mb-0">
            Aquí se mostrarán los accesos dinámicos del menú obtenidos desde el endpoint correspondiente según el
            rol recuperado del token JWT.
          </p>
        </div>
      </div>
    </Layout>
  )
}
