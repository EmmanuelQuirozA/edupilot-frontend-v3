import { Layout } from '../layout/Layout'
import { useLanguage } from '../context/LanguageContext'

interface DashboardStudentsPageProps {
  onNavigate: (path: string) => void
}

export function DashboardStudentsPage({ onNavigate }: DashboardStudentsPageProps) {
  const { t } = useLanguage()

  return (
    <Layout onNavigate={onNavigate}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <p className="text-uppercase text-muted mb-1">Panel de estudiantes</p>
          <h2 className="fw-bold mb-2">{t('welcome')}</h2>
          <p className="text-muted mb-0">Consulta clases, calificaciones y recursos asignados por tus docentes.</p>
        </div>
        <button className="btn btn-outline-primary" onClick={() => onNavigate('/')}>Home</button>
      </div>
      <div className="card shadow-sm">
        <div className="card-body">
          <h5 className="card-title">Módulos del estudiante</h5>
          <p className="mb-0">
            Accede a tu agenda, revisa el progreso de tus cursos y mantente al día con las notificaciones del centro
            educativo.
          </p>
        </div>
      </div>
    </Layout>
  )
}
