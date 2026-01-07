import { useEffect, useMemo, useState } from 'react'
import './GlobalSettingsPage.css'
import type { BreadcrumbItem } from '../components/Breadcrumb'
import { LoadingSkeleton } from '../components/LoadingSkeleton'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { Layout } from '../layout/Layout'
import { API_BASE_URL } from '../config'
import { RolesPermissionsPage } from './RolesPermissionsPage'
import { PrinterSettingsSection } from '../components/PrinterSettingsSection'

interface ModuleAccess {
  moduleId: number
  moduleName: string
  moduleKey: string 
  moduleDescription: string 
  sortOrder: number | null
}

interface School {
  school_id: number
  description: string
}

interface GlobalSettingsPageProps {
  onNavigate: (path: string) => void
  initialTab?: 'settings' | 'modules' | 'roles'
}

export function GlobalSettingsPage({ onNavigate, initialTab = 'settings' }: GlobalSettingsPageProps) {
  const { token, } = useAuth()
  const { locale, t } = useLanguage()
  const [activeTab, setActiveTab] = useState<'settings' | 'modules' | 'roles'>(initialTab)
  const [modules, setModules] = useState<ModuleAccess[]>([])
  const [modulesLoading, setModulesLoading] = useState(false)
  
  const [schools, setSchools] = useState<School[]>([])
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null)
  const [schoolsLoading, setSchoolsLoading] = useState(false)

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
    if (!token) return

    const controller = new AbortController()

    const fetchSchools = async () => {
      setSchoolsLoading(true)
      try {
        const response = await fetch(`${API_BASE_URL}/schools/list`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const json = (await response.json()) as School[]
        setSchools(json)
      } catch (error) {
        if ((error as DOMException).name !== 'AbortError') {
          setSchools([])
        }
      } finally {
        setSchoolsLoading(false)
      }
    }

    fetchSchools()

    return () => controller.abort()
  }, [token])

  useEffect(() => {
    if (!token || !selectedSchoolId) {
      setModules([])
      return
    }

    const controller = new AbortController()
    const fetchModules = async () => {
      setModulesLoading(true)
      try {
        const params = new URLSearchParams({
          lang: locale,
          school_id: String(selectedSchoolId),
        })
        const response = await fetch(`${API_BASE_URL}/catalog/plan-modules?${params.toString()}`, {
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
  }, [locale, selectedSchoolId, token])

  const sortedModules = useMemo(
    () =>
      [...modules]
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
            </div>
          </div>
        </div>

        <div className="card shadow-sm">
          <div className="card-body">
            <div className="row g-0">
              <div className="col-12 col-lg-3 border-end pe-lg-4">
                <div className="global-settings__tabs">
                  <p className="text-uppercase text-muted fw-semibold small mb-3">{t('globalSettingsGeneralTitle')}</p>
                  <div className="nav flex-column nav-pills gap-2" role="tablist">
                    <button
                      type="button"
                      className={`nav-link text-start d-flex align-items-center gap-2 ${
                        activeTab === 'modules' ? 'active text-primary' : 'text-secondary'
                      }`}
                      role="tab"
                      onClick={() => setActiveTab('modules')}
                    >
                      <i className="bi bi-cash-stack" aria-hidden="true" />
                      <span>{t('globalSettingsFinancialCatalogsTab')}</span>
                    </button>
                    <button
                      type="button"
                      className={`nav-link text-start d-flex align-items-center gap-2 ${
                        activeTab === 'settings' ? 'active text-primary' : 'text-secondary'
                      }`}
                      role="tab"
                      onClick={() => setActiveTab('settings')}
                    >
                      <i className="bi bi-printer" aria-hidden="true" />
                      <span>{t('globalSettingsPrintersTab')}</span>
                    </button>
                    <button
                      type="button"
                      className={`nav-link text-start d-flex align-items-center gap-2 ${
                        activeTab === 'roles' ? 'active text-primary' : 'text-secondary'
                      }`}
                      role="tab"
                      onClick={() => setActiveTab('roles')}
                    >
                      <i className="bi bi-shield-lock" aria-hidden="true" />
                      <span>{t('globalSettingsRolesTab')}</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="col-12 col-lg-9 ps-lg-4 pt-4 pt-lg-0">
                {activeTab === 'settings' ? (
                  <>
                    <h3 className="h5 mb-3">{t('globalSettingsPrintersTab')}</h3>
                    <PrinterSettingsSection />
                  </>
                ) : activeTab === 'modules' ? (
                  <>
                    <h3 className="h5 mb-3">{t('globalSettingsFinancialCatalogsTab')}</h3>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="d-flex flex-column gap-3">
                        <div>
                          <label className="form-label fw-semibold" htmlFor="schoolSelect">
                            {t('selectSchoolLabel')}
                          </label>
                          <select
                            id="schoolSelect"
                            className="form-select"
                            value={selectedSchoolId ?? ''}
                            onChange={(event) => setSelectedSchoolId(event.target.value ? Number(event.target.value) : null)}
                            disabled={schoolsLoading}
                          >
                            <option value="">{schoolsLoading ? t('tableLoading') : t('selectPlaceholder')}</option>
                            {schools.map((school) => (
                              <option key={school.school_id} value={school.school_id}>
                                {school.description}
                              </option>
                            ))}
                          </select>
                        </div>
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
                                  <small className="text-muted">{module.moduleDescription}</small>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted mb-0">{t('modulesCatalogEmpty')}</p>
                    )}
                  </>
                ) : (
                  <RolesPermissionsPage onNavigate={onNavigate} embedded />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
