import { Layout } from '../layout/Layout'
import { useLanguage } from '../context/LanguageContext'

interface DashboardTeacherPageProps {
  onNavigate: (path: string) => void
}

export function DashboardTeacherPage({ onNavigate }: DashboardTeacherPageProps) {
  const { t } = useLanguage()

  return (
    <Layout onNavigate={onNavigate}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <p className="text-uppercase text-muted mb-1">Panel de profesores</p>
          <h2 className="fw-bold mb-2">{t('welcome')}</h2>
          <p className="text-muted mb-0">Administra clases, asistencia y comunica novedades a tus estudiantes.</p>
        </div>
        <button className="btn btn-outline-primary" onClick={() => onNavigate('/')}>Home</button>
      </div>
      <div className="card shadow-sm">
        <div className="card-body">
          <h5 className="card-title">Módulos docentes</h5>
          <p className="mb-0">
            Publica contenidos, gestiona evaluaciones y visualiza el desempeño académico de cada grupo.
          </p>
        </div>
      </div>
    </Layout>
  )
}
