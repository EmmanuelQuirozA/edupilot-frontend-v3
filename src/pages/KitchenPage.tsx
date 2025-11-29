import { Layout } from '../layout/Layout'
import { useLanguage } from '../context/LanguageContext'

interface KitchenPageProps {
  onNavigate: (path: string) => void
}

export function KitchenPage({ onNavigate }: KitchenPageProps) {
  const { t } = useLanguage()

  return (
    <Layout onNavigate={onNavigate} pageTitle={t('portalTitle')}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <p className="text-uppercase text-muted mb-1">Panel de cocina</p>
          <h2 className="fw-bold mb-2">{t('welcome')}</h2>
          <p className="text-muted mb-0">Coordina menús, suministros y alertas alimentarias para la comunidad.</p>
        </div>
        <button className="btn btn-outline-primary" onClick={() => onNavigate('/')}>Home</button>
      </div>
      <div className="card shadow-sm">
        <div className="card-body">
          <h5 className="card-title">Módulos de cocina</h5>
          <p className="mb-0">
            Administra el calendario de menús, controla inventarios y comunica actualizaciones nutricionales.
          </p>
        </div>
      </div>
    </Layout>
  )
}
