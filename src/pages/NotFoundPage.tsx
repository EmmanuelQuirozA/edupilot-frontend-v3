import { Layout } from '../layout/Layout'
import { PublicFooter } from '../components/PublicFooter'
import { PublicHeader } from '../components/PublicHeader'
import { useLanguage } from '../context/LanguageContext'
import './NotFoundPage.css'

interface NotFoundPageProps {
  onNavigate: (path: string) => void
  variant?: 'public' | 'app'
}

export function NotFoundPage({ onNavigate, variant = 'public' }: NotFoundPageProps) {
  const { t, locale } = useLanguage()

  const content = (
    <section className="not-found-wrapper">
      <div className="card shadow-sm p-4 not-found-card">
        <div className="not-found-code mb-2">404</div>
        <h1 className="h4 fw-bold mb-2">{t('notFoundTitle')}</h1>
        <p className="text-muted mb-4">{t('notFoundSubtitle')}</p>
        <div className="not-found-actions">
          <button className="btn btn-primary" onClick={() => onNavigate(`/${locale}`)}>
            {t('notFoundCta')}
          </button>
          <button className="btn btn-outline-secondary" onClick={() => window.history.back()}>
            {t('notFoundBack')}
          </button>
        </div>
      </div>
    </section>
  )

  if (variant === 'app') {
    return (
      <Layout onNavigate={onNavigate} pageTitle={t('notFoundTitle')}>
        {content}
      </Layout>
    )
  }

  return (
    <div className="app-shell d-flex flex-column" style={{ minHeight: '100vh' }}>
      <PublicHeader onNavigate={onNavigate} />
      <main className="flex-grow-1">{content}</main>
      <PublicFooter />
    </div>
  )
}
