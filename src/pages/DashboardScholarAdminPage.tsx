import { Layout } from '../layout/Layout'
import { useLanguage } from '../context/LanguageContext'

interface DashboardScholarAdminPageProps {
  onNavigate: (path: string) => void
}

export function DashboardScholarAdminPage({ onNavigate }: DashboardScholarAdminPageProps) {
  const { t } = useLanguage()

  return (
    <Layout onNavigate={onNavigate}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <p className="text-uppercase text-muted mb-1">Panel académico</p>
          <h2 className="fw-bold mb-2">{t('welcome')}</h2>
          <p className="text-muted mb-0">Gestiona ciclos, matrículas y reportes académicos en tiempo real.</p>
        </div>
        <button className="btn btn-outline-primary" onClick={() => onNavigate('/')}>Home</button>
      </div>
      <div className="card shadow-sm">
        <div className="card-body">
          <h5 className="card-title">Módulos académicos</h5>
          <p className="mb-0">
            Organiza la planificación escolar, controla la oferta educativa y administra los accesos de docentes y
            estudiantes.
          </p>
        </div>
      </div>
    </Layout>
  )
}
