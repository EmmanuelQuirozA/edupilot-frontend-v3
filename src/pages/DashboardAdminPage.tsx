import { Layout } from '../layout/Layout'
import { useLanguage } from '../context/LanguageContext'

interface DashboardAdminPageProps {
  onNavigate: (path: string) => void
}

export function DashboardAdminPage({ onNavigate }: DashboardAdminPageProps) {
  const { t } = useLanguage()

  return (
    <Layout onNavigate={onNavigate} pageTitle={t('portalTitle')}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <p className="text-uppercase text-muted mb-1">Panel de administración</p>
          <h2 className="fw-bold mb-2">{t('welcome')}</h2>
          <p className="text-muted mb-0">Control centralizado de dashboards, usuarios y configuraciones.</p>
        </div>
        <button className="btn btn-outline-primary" onClick={() => onNavigate('/')}>Home</button>
      </div>
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Módulos administrativos</h5>
          <p className="mb-0">
            Gestiona accesos, monitorea actividad y configura integraciones clave de la plataforma desde un solo
            lugar.
          </p>
        </div>
      </div>
    </Layout>
  )
}
