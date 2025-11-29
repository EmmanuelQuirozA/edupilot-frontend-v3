import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { useLanguage } from '../context/LanguageContext'

interface HomePageProps {
  onNavigate: (path: string) => void
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { t } = useLanguage()

  return (
    <div className="app-shell d-flex flex-column" style={{ minHeight: '100vh' }}>
      <Header onNavigate={onNavigate} />
      <main className="flex-grow-1">
        <div className="container py-5">
          <div className="hero-section mb-4">
            <div className="d-flex justify-content-between align-items-center flex-column flex-md-row gap-3">
              <div>
                <p className="text-uppercase fw-semibold mb-2">{t('heroCta')}</p>
                <h1 className="fw-bold mb-3">{t('homeTitle')}</h1>
                <p className="lead mb-4">{t('homeSubtitle')}</p>
                <button className="btn btn-light text-primary fw-semibold" onClick={() => onNavigate('/login')}>
                  {t('homeCta')}
                </button>
              </div>
              <div className="text-center">
                <div className="logo-circle mb-3">EP</div>
                <p className="mb-0">EduPilot Platform</p>
              </div>
            </div>
          </div>
          <div className="row g-3">
            <div className="col-md-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">Portales</h5>
                  <p className="card-text">
                    Accesos preparados para administración, gestión escolar, docentes, estudiantes y cocina.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">Menús dinámicos</h5>
                  <p className="card-text">
                    El sidebar se alimentará desde endpoints para mostrar módulos según el rol del usuario.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">Multi idioma</h5>
                  <p className="card-text">
                    Español e inglés listos, con soporte para agregar más idiomas en el futuro.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
