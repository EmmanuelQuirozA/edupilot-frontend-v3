import { useEffect, useMemo, useState } from 'react'
import type { BreadcrumbItem } from '../components/Breadcrumb'
import { LoadingSkeleton } from '../components/LoadingSkeleton'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { Layout } from '../layout/Layout'
import { API_BASE_URL } from '../config'
import { RolesPermissionsPage } from './RolesPermissionsPage'

interface ModuleAccess {
  moduleId: number
  moduleName: string
  moduleKey: string
  enabled: boolean
  sortOrder: number | null
}

interface GlobalSettingsPageProps {
  onNavigate: (path: string) => void
  initialTab?: 'modules' | 'roles'
}

export function GlobalSettingsPage({ onNavigate, initialTab = 'modules' }: GlobalSettingsPageProps) {
  const { token } = useAuth()
  const { locale, t } = useLanguage()
  const [activeTab, setActiveTab] = useState<'modules' | 'roles'>(initialTab)
  const [modules, setModules] = useState<ModuleAccess[]>([])
  const [modulesLoading, setModulesLoading] = useState(false)

  const breadcrumbItems: BreadcrumbItem[] = useMemo(
    () => [
      {
        label: t('portalTitle'),
        onClick: () => onNavigate(`/${locale}`),
      },
      { label: t('globalSettingsTitle') },
    ],
    [locale, onNavigate, t],
  )

  useEffect(() => {
    if (!token) {
      setModules([])
      return
    }

    const controller = new AbortController()
    const fetchModules = async () => {
      setModulesLoading(true)
      try {
        const response = await fetch(`${API_BASE_URL}/modules/access-control`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!response.ok) throw new Error('Failed to fetch modules')

        const data = (await response.json()) as ModuleAccess[]
        setModules(data)
      } catch (error) {
        if ((error as DOMException)?.name !== 'AbortError') {
          setModules([])
        }
      } finally {
        setModulesLoading(false)
      }
    }

    fetchModules()
    return () => controller.abort()
  }, [token])

  const sortedModules = useMemo(
    () =>
      [...modules]
        .filter((module) => module.enabled)
        .sort((a, b) => {
          const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER
          const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER
          if (orderA !== orderB) return orderA - orderB
          return a.moduleName.localeCompare(b.moduleName)
        }),
    [modules],
  )

  return (
    <Layout onNavigate={onNavigate} pageTitle={t('globalSettingsTitle')} breadcrumbItems={breadcrumbItems}>
      <div className="d-flex flex-column gap-4">
        <div className="card shadow-sm">
          <div className="card-body">
            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
              <div>
                <h2 className="h4 mb-1">{t('globalSettingsTitle')}</h2>
                <p className="text-muted mb-0">{t('globalSettingsSubtitle')}</p>
              </div>
              <div className="nav nav-tabs card-header-tabs mt-3 mt-md-0" role="tablist">
                <button
                  type="button"
                  className={`nav-link ${activeTab === 'modules' ? 'active' : ''}`}
                  role="tab"
                  onClick={() => setActiveTab('modules')}
                >
                  {t('modulesCatalogTab')}
                </button>
                <button
                  type="button"
                  className={`nav-link ${activeTab === 'roles' ? 'active' : ''}`}
                  role="tab"
                  onClick={() => setActiveTab('roles')}
                >
                  {t('rolesPermissionsTitle')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {activeTab === 'modules' ? (
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h3 className="h5 mb-1">{t('modulesCatalogTab')}</h3>
                  <p className="text-muted mb-0">{t('modulesCatalogDescription')}</p>
                </div>
                {modulesLoading ? <span className="badge bg-secondary">{t('tableLoading')}</span> : null}
              </div>

              {modulesLoading ? (
                <LoadingSkeleton variant="dashboard" cardCount={6} />
              ) : sortedModules.length ? (
                <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3">
                  {sortedModules.map((module) => (
                    <div className="col" key={module.moduleId}>
                      <div className="border rounded-3 p-3 h-100">
                        <div className="d-flex justify-content-between align-items-start gap-3">
                          <div>
                            <p className="fw-semibold mb-1">{module.moduleName}</p>
                            <small className="text-muted text-uppercase">{module.moduleKey}</small>
                          </div>
                          <span className="badge bg-success-subtle text-success fw-semibold">
                            {t('moduleEnabledLabel')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted mb-0">{t('modulesCatalogEmpty')}</p>
              )}
            </div>
          </div>
        ) : (
          <RolesPermissionsPage onNavigate={onNavigate} embedded />
        )}
      </div>
    </Layout>
  )
}
