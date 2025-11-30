import { useEffect, useMemo, useState } from 'react'
import { Layout } from '../layout/Layout'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../config'
import { LoadingSkeleton } from '../components/LoadingSkeleton'
import type { BreadcrumbItem } from '../components/Breadcrumb'
import './SchoolDetailsPage.css'

interface SchoolDetailsPageProps {
  onNavigate: (path: string) => void
  schoolId: number
}

interface ChildSchool {
  school_id: number
  related_school_id: number
  commercial_name: string
  enabled: boolean
  student_count: number
  teacher_count: number
  school_admin_count: number
  other_roles_count: number
}

interface SchoolPayment {
  period: string
  payment_date: string
  payment_method: string
  amount: number
  status: string
}

interface SchoolModule {
  module_access_control_id: number
  module_id: number
  name_en: string
  name_es: string
  key: string
  sort_order: number
  enabled: boolean
}

interface SchoolDetailsResponse {
  school_details: {
    school_id: number
    related_school_id: number | null
    school_description: string
    commercial_name: string
    business_name: string
    tax_id: string
    street: string | null
    ext_number: string | null
    int_number: string | null
    suburb: string | null
    locality: string | null
    municipality: string | null
    state: string | null
    phone_number: string | null
    email: string | null
    default_tuition: number | null
    created_at: string
    enabled: boolean
    image: string | null
    max_debt: number
  }
  roles_per_school: {
    student_count: number
    teacher_count: number
    school_admin_count: number
    other_roles_count: number
    school_roles_count: number
  }
  child_schools: ChildSchool[] | ChildSchool | null
  school_payments: SchoolPayment[] | null
  modules: SchoolModule[] | null
  roles: unknown[]
  current_plan: {
    school_plan_id: number
    start_date: string
    end_date: string | null
    renew_plan: string
    plan_id: number
    plan_name: string
    plan_description: string
    price_monthly: number
    price_yearly: number
    base_student_limit: number
    base_admin_users_limit: number
    base_school_limit: number
    extra_student_price: number
    extra_admin_price: number
    is_active: boolean
    ui_color: string
    period_of_time_id: number
    pot_name: string
    status_id: number
    status_name: string
  }
  conctacts: {
    user_id: number
    full_name: string
    address: string | null
    personal_email: string | null
    phone_number: string | null
  } | null
}

type TabKey = 'overview' | 'billing' | 'settings' | 'structure'

export function SchoolDetailsPage({ onNavigate, schoolId }: SchoolDetailsPageProps) {
  const { locale, t } = useLanguage()
  const { token, hydrated } = useAuth()

  const [data, setData] = useState<SchoolDetailsResponse | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const breadcrumbItems: BreadcrumbItem[] = useMemo(
    () => [
      {
        label: t('portalTitle'),
        onClick: () => onNavigate(`/${locale}/dashboard`),
      },
      {
        label: t('schoolsBreadcrumbLabel'),
        onClick: () => onNavigate(`/${locale}/dashboard/schools`),
      },
      {
        label: data?.school_details.commercial_name || t('schoolDetailsBreadcrumbLabel'),
      },
    ],
    [data?.school_details.commercial_name, locale, onNavigate, t],
  )

  useEffect(() => {
    if (!token) return

    const controller = new AbortController()
    const fetchDetails = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({ school_id: String(schoolId), lang: locale })
        const response = await fetch(`${API_BASE_URL}/schools/details?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const json = (await response.json()) as SchoolDetailsResponse
        setData(json)
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          setError(t('defaultError'))
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchDetails()

    return () => controller.abort()
  }, [locale, schoolId, t, token])

  const childSchools = useMemo<ChildSchool[]>(() => {
    if (!data?.child_schools) return []
    return Array.isArray(data.child_schools) ? data.child_schools : [data.child_schools]
  }, [data?.child_schools])

  const payments: SchoolPayment[] = data?.school_payments ?? []
  const modules: SchoolModule[] = data?.modules ?? []

  const initials = useMemo(() => {
    if (!data?.school_details.commercial_name) return 'SC'
    const parts = data.school_details.commercial_name.trim().split(' ')
    const first = parts[0]?.[0] ?? ''
    const second = parts[1]?.[0] ?? ''
    return `${first}${second}`.toUpperCase() || 'SC'
  }, [data?.school_details.commercial_name])

  const locationLabel = useMemo(() => {
    const { municipality, state } = data?.school_details ?? {}
    if (municipality && state) return `${municipality}, ${state}`
    return municipality || state || t('schoolNoData')
  }, [data?.school_details, t])

  if (!hydrated) {
    return (
      <Layout onNavigate={onNavigate} pageTitle={t('schoolsTitle')} breadcrumbItems={breadcrumbItems}>
        <LoadingSkeleton variant="dashboard" cardCount={6} />
      </Layout>
    )
  }

  if (isLoading && !data) {
    return (
      <Layout onNavigate={onNavigate} pageTitle={t('schoolsTitle')} breadcrumbItems={breadcrumbItems}>
        <LoadingSkeleton variant="dashboard" cardCount={6} />
      </Layout>
    )
  }

  return (
    <Layout onNavigate={onNavigate} pageTitle={t('schoolsTitle')} breadcrumbItems={breadcrumbItems}>
      <div className="d-flex flex-column gap-3">
        {error ? (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        ) : null}

        {data ? (
          <>
            <div className="card school-hero p-4">
              <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                <div className="d-flex gap-3 align-items-center">
                  <div className="school-avatar">{initials}</div>
                  <div className="d-flex flex-column gap-1">
                    <div className="d-flex flex-wrap align-items-center gap-2">
                      <span className="school-hero__title">{data.school_details.commercial_name}</span>
                      <span className="badge-soft">
                        <span className="pill-chip__dot" />
                        {t('schoolPlanBadge')}: {data.current_plan.plan_name}
                      </span>
                    </div>
                    <span className="school-hero__meta">
                      {t('schoolIdLabel')}: {data.school_details.school_id} • {t('schoolLocationLabel')}: {locationLabel}
                    </span>
                    <div className="d-flex flex-wrap align-items-center gap-2">
                      <span className="pill-chip">
                        <span className="pill-chip__dot" />
                        {data.current_plan.status_name}
                      </span>
                      <span className="pill-chip" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#0f766e' }}>
                        <span className="pill-chip__dot" />
                        {data.current_plan.pot_name}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="d-flex flex-wrap gap-3 align-items-center">
                  <div className="d-flex flex-column gap-1">
                    <small className="text-muted fw-semibold">{t('schoolAccessLabel')}</small>
                    <div className="form-check form-switch m-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        checked={data.school_details.enabled}
                        readOnly
                      />
                      <label className="form-check-label fw-semibold">
                        {data.school_details.enabled ? t('schoolStatusActive') : t('schoolStatusInactive')}
                      </label>
                    </div>
                  </div>
                  <button type="button" className="ghost-button">
                    {t('schoolEditButton')}
                  </button>
                </div>
              </div>
            </div>

            <div className="row g-3">
              <div className="col-12 col-md-6 col-xl-3">
                <div className="stat-card card h-100">
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <div>
                      <div className="stat-card__title">{t('schoolStudentsCard')}</div>
                      <div className="stat-card__value">
                        {data.roles_per_school.student_count.toLocaleString(locale)}
                        <small className="text-muted ms-1">/ {data.current_plan.base_student_limit}</small>
                      </div>
                    </div>
                    <div className="stat-card__icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    </div>
                  </div>
                  <small className="text-muted fw-semibold">{t('schoolBaseLimit')}: {data.current_plan.base_student_limit}</small>
                </div>
              </div>

              <div className="col-12 col-md-6 col-xl-3">
                <div className="stat-card card h-100">
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <div>
                      <div className="stat-card__title">{t('schoolTeachersCard')}</div>
                      <div className="stat-card__value">{data.roles_per_school.teacher_count.toLocaleString(locale)}</div>
                    </div>
                    <div className="stat-card__icon" style={{ color: '#0ea5e9', background: 'rgba(14,165,233,0.12)' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5"></circle><path d="M20 21a8 8 0 0 0-16 0"></path></svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-6 col-xl-3">
                <div className="stat-card card h-100">
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <div>
                      <div className="stat-card__title">{t('schoolAdminsCard')}</div>
                      <div className="stat-card__value">
                        {data.roles_per_school.school_admin_count.toLocaleString(locale)}
                        <small className="text-muted ms-1">/ {data.current_plan.base_admin_users_limit}</small>
                      </div>
                    </div>
                    <div className="stat-card__icon" style={{ color: '#f97316', background: 'rgba(249,115,22,0.12)' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 20a5 5 0 0 1 10 0"></path><circle cx="8" cy="7" r="4"></circle><path d="M20 8v6"></path><path d="M23 11h-6"></path></svg>
                    </div>
                  </div>
                  <small className="text-muted fw-semibold">{t('schoolBaseLimit')}: {data.current_plan.base_admin_users_limit}</small>
                </div>
              </div>

              <div className="col-12 col-md-6 col-xl-3">
                <div className="stat-card card h-100">
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <div>
                      <div className="stat-card__title">{t('schoolCampusesCard')}</div>
                      <div className="stat-card__value">
                        {childSchools.length}
                        <small className="text-muted ms-1">/ {data.current_plan.base_school_limit}</small>
                      </div>
                    </div>
                    <div className="stat-card__icon" style={{ color: '#16a34a', background: 'rgba(22,163,74,0.12)' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="10" height="14" x="3" y="7" rx="2"></rect><path d="M3 11h10"></path><path d="M8 11v10"></path><path d="m15 5 4-2v3l4-2v14"></path></svg>
                    </div>
                  </div>
                  <small className="text-muted fw-semibold">{t('schoolBaseLimit')}: {data.current_plan.base_school_limit}</small>
                </div>
              </div>
            </div>

            <div className="d-flex flex-wrap gap-2 mt-2">
              {(
                [
                  { key: 'overview', label: t('schoolOverviewTab') },
                  { key: 'billing', label: t('schoolBillingTab') },
                  { key: 'settings', label: t('schoolSettingsTab') },
                  { key: 'structure', label: t('schoolStructureTab') },
                ] as Array<{ key: TabKey; label: string }>
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`tab-pill ${activeTab === tab.key ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="tab-panel">
              {activeTab === 'overview' ? (
                <div className="row g-3">
                  <div className="col-12 col-lg-6">
                    <div className="card h-100">
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <div className="pill-chip__dot" style={{ background: '#4338ca' }} />
                        <h6 className="mb-0 fw-bold">{t('schoolOverviewTitle')}</h6>
                      </div>
                      <ul className="info-list">
                        <li className="info-list__item">
                          <span className="info-list__label">{t('schoolContactEmail')}</span>
                          <span className="info-list__value">{data.school_details.email || t('schoolNoData')}</span>
                        </li>
                        <li className="info-list__item">
                          <span className="info-list__label">{t('schoolContactPhone')}</span>
                          <span className="info-list__value">{data.school_details.phone_number || t('schoolNoData')}</span>
                        </li>
                        <li className="info-list__item">
                          <span className="info-list__label">{t('schoolAddressLabel')}</span>
                          <span className="info-list__value">
                            {[
                              data.school_details.street,
                              data.school_details.ext_number,
                              data.school_details.suburb,
                              data.school_details.municipality,
                              data.school_details.state,
                            ]
                              .filter(Boolean)
                              .join(', ') || t('schoolNoData')}
                          </span>
                        </li>
                        <li className="info-list__item">
                          <span className="info-list__label">RFC</span>
                          <span className="info-list__value">{data.school_details.tax_id || t('schoolNoData')}</span>
                        </li>
                        <li className="info-list__item">
                          <span className="info-list__label">{t('schoolPlanStatusLabel')}</span>
                          <span className="pill-chip">{data.current_plan.status_name}</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="col-12 col-lg-6">
                    <div className="plan-card">
                      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
                        <div>
                          <p className="text-white-50 fw-semibold mb-1">{t('schoolPlanTitle')}</p>
                          <h5 className="fw-bolder mb-2">{data.current_plan.plan_name}</h5>
                          <span className="plan-chip">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 1 21h22L12 2z"></path><path d="M12 9v4"></path><path d="m12 17 .01-.01"></path></svg>
                            {data.current_plan.pot_name}
                          </span>
                        </div>
                        <span className="badge-soft" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}>
                          {t('schoolStatusBadge')}: {data.current_plan.status_name}
                        </span>
                      </div>
                      <div className="d-flex flex-column gap-2 mt-3">
                        <span className="fw-semibold">{t('schoolNextBilling')}</span>
                        <div className="d-flex flex-wrap gap-2 align-items-center">
                          <span className="fw-bold">${data.current_plan.price_yearly.toLocaleString(locale)}</span>
                          <small className="text-white-50">{data.current_plan.renew_plan}</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {activeTab === 'billing' ? (
                <div className="d-flex flex-column gap-3">
                  <div className="card">
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <div className="pill-chip__dot" style={{ background: '#4338ca' }} />
                      <h6 className="mb-0 fw-bold">{t('schoolPreviousPeriods')}</h6>
                    </div>
                    {payments && payments.length ? (
                      <table className="table-custom">
                        <thead>
                          <tr>
                            <th>{t('schoolNextBilling')}</th>
                            <th>{t('tableActions')}</th>
                            <th>{t('schoolPlanStatusLabel')}</th>
                            <th>{t('schoolsPlanColumn')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map((payment, index) => (
                            <tr key={`${payment.period}-${index}`}>
                              <td className="fw-bold">{payment.payment_date}</td>
                              <td>{payment.payment_method}</td>
                              <td>
                                <span className="pill-chip" style={{ background: 'rgba(16,185,129,0.15)', color: '#0f766e' }}>
                                  {payment.status}
                                </span>
                              </td>
                              <td>${payment.amount.toLocaleString(locale)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="mb-0 text-muted fw-semibold">{t('schoolPaymentsEmpty')}</p>
                    )}
                  </div>
                </div>
              ) : null}

              {activeTab === 'settings' ? (
                <div className="row g-3">
                  <div className="col-12 col-lg-6">
                    <div className="card h-100">
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <div className="pill-chip__dot" style={{ background: '#4338ca' }} />
                        <h6 className="mb-0 fw-bold">{t('schoolModulesTitle')}</h6>
                      </div>
                      {modules && modules.length ? (
                        <ul className="info-list">
                          {modules
                            .sort((a, b) => a.sort_order - b.sort_order)
                            .map((module) => (
                              <li key={module.module_access_control_id} className="d-flex justify-content-between align-items-center">
                                <div className="fw-bold">{locale === 'es' ? module.name_es : module.name_en}</div>
                                <span className="pill-chip" style={{ background: module.enabled ? 'rgba(16,185,129,0.15)' : 'rgba(248,113,113,0.15)', color: module.enabled ? '#0f766e' : '#b91c1c' }}>
                                  {module.enabled ? t('schoolStatusActive') : t('schoolStatusInactive')}
                                </span>
                              </li>
                            ))}
                        </ul>
                      ) : (
                        <p className="mb-0 text-muted fw-semibold">{t('schoolNoData')}</p>
                      )}
                    </div>
                  </div>
                  <div className="col-12 col-lg-6">
                    <div className="card h-100">
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <div className="pill-chip__dot" style={{ background: '#4338ca' }} />
                        <h6 className="mb-0 fw-bold">{t('schoolRolesTitle')}</h6>
                      </div>
                      <div className="d-flex flex-column gap-2">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-semibold">{t('schoolStudentsCard')}</span>
                          <span className="pill-chip">{data.roles_per_school.student_count}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-semibold">{t('schoolTeachersCard')}</span>
                          <span className="pill-chip">{data.roles_per_school.teacher_count}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-semibold">{t('schoolAdminsCard')}</span>
                          <span className="pill-chip">{data.roles_per_school.school_admin_count}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {activeTab === 'structure' ? (
                <div className="card">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <div className="pill-chip__dot" style={{ background: '#4338ca' }} />
                    <h6 className="mb-0 fw-bold">{t('schoolStructureTitle')}</h6>
                  </div>
                  {childSchools.length ? (
                    <table className="table-custom">
                      <thead>
                        <tr>
                          <th>{t('schoolsNameColumn')}</th>
                          <th>{t('schoolsIdColumn')}</th>
                          <th>{t('schoolLocationLabel')}</th>
                          <th>{t('schoolStatusBadge')}</th>
                          <th>{t('tableActions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {childSchools.map((school) => (
                          <tr key={school.school_id}>
                            <td className="fw-bold">{school.commercial_name}</td>
                            <td>{school.school_id}</td>
                            <td className="text-muted">{locationLabel}</td>
                            <td>
                              <span className="pill-chip" style={{ background: school.enabled ? 'rgba(16,185,129,0.15)' : 'rgba(248,113,113,0.15)', color: school.enabled ? '#0f766e' : '#b91c1c' }}>
                                {school.enabled ? t('schoolStatusActive') : t('schoolStatusInactive')}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-link p-0"
                                onClick={() => onNavigate(`/${locale}/dashboard/schools/${school.school_id}`)}
                              >
                                {t('schoolViewDetail')}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="mb-0 text-muted fw-semibold">{t('schoolNoData')}</p>
                  )}
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </Layout>
  )
}
