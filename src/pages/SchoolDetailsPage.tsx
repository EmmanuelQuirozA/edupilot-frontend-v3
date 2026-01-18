import { useEffect, useMemo, useState } from 'react'
import { Layout } from '../layout/Layout'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../config'
import { LoadingSkeleton } from '../components/LoadingSkeleton'
import { SchoolUpdateModal } from '../components/SchoolUpdateModal'
import type { BreadcrumbItem } from '../components/Breadcrumb'
import { formatDate } from '../utils/formatDate';
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
  } | null
  conctacts: {
    user_id: number
    full_name: string
    address: string | null
    personal_email: string | null
    phone_number: string | null
  } | null
}

interface ModulePermission {
  enabled: boolean
  c: boolean
  r: boolean
  u: boolean
}

type TabKey = 'overview' | 'details' | 'billing' | 'settings' | 'structure'

export function SchoolDetailsPage({ onNavigate, schoolId }: SchoolDetailsPageProps) {
  const { locale, t } = useLanguage()
  const { token, hydrated } = useAuth()

  const [data, setData] = useState<SchoolDetailsResponse | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permissions, setPermissions] = useState<ModulePermission | null>(null)
  const [permissionsLoading, setPermissionsLoading] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const breadcrumbItems: BreadcrumbItem[] = useMemo(
    () => [
      {
        label: t('portalTitle'),
        onClick: () => onNavigate(`/${locale}`),
      },
      {
        label: t('schoolsBreadcrumbLabel'),
        onClick: () => onNavigate(`/${locale}/schools`),
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
  }, [locale, refreshKey, schoolId, t, token])

  useEffect(() => {
    if (!token) return

    const controller = new AbortController()
    const fetchPermissions = async () => {
      setPermissionsLoading(true)
      try {
        const params = new URLSearchParams({ moduleKey: 'schools' })
        const response = await fetch(`${API_BASE_URL}/permissions/module-access?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const json = (await response.json()) as Array<ModulePermission & Record<string, unknown>>
        const permission = json?.[0]
        setPermissions(
          permission
            ? {
                enabled: Boolean(permission.enabled),
                c: Boolean(permission.c),
                r: Boolean(permission.r),
                u: Boolean(permission.u),
              }
            : null,
        )
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          setError(t('defaultError'))
        }
      } finally {
        setPermissionsLoading(false)
      }
    }

    fetchPermissions()

    return () => controller.abort()
  }, [t, token])

  const childSchools = useMemo<ChildSchool[]>(() => {
    if (!data?.child_schools) return []
    return Array.isArray(data.child_schools) ? data.child_schools : [data.child_schools]
  }, [data?.child_schools])

  const payments: SchoolPayment[] = data?.school_payments ?? []
  const modules: SchoolModule[] = data?.modules ?? []

  const schoolDetails = data?.school_details
  const fullAddress = useMemo(() => {
    if (!schoolDetails) return null

    const streetLine = [schoolDetails.street, schoolDetails.ext_number, schoolDetails.int_number]
      .filter(Boolean)
      .join(' ')

    const localityLine = [schoolDetails.suburb, schoolDetails.locality, schoolDetails.municipality, schoolDetails.state]
      .filter(Boolean)
      .join(', ')

    const address = [streetLine, localityLine].filter(Boolean).join(' · ')

    return address || null
  }, [schoolDetails])

  const hasResults = Boolean(
    data &&
      (childSchools.length ||
        payments.length ||
        modules.length ||
        data.conctacts ||
        data.current_plan ||
        data.roles_per_school),
  )

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

  const canUpdate = permissions?.u ?? false
  const canCreate = permissions?.c ?? false

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

  if (permissionsLoading) {
    return (
      <Layout onNavigate={onNavigate} pageTitle={t('schoolsTitle')} breadcrumbItems={breadcrumbItems}>
        <LoadingSkeleton variant="dashboard" cardCount={6} />
      </Layout>
    )
  }

  if (!permissions || !permissions.r) {
    return (
      <Layout onNavigate={onNavigate} pageTitle={t('schoolsTitle')} breadcrumbItems={breadcrumbItems}>
        <div className="alert alert-warning" role="alert">
          {t('defaultError')}
        </div>
      </Layout>
    )
  }

  return (
    <>
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
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                <div className="d-flex gap-3 align-items-center">
                  <div className="school-avatar">{initials}</div>
                  <div className="d-flex flex-column gap-1">
                    <div className="d-flex flex-wrap align-items-center gap-2">
                      <span className="school-hero__title">{data.school_details.commercial_name}</span>
                    </div>
                    
                    <div className="d-flex flex-wrap align-items-center gap-2">
                      <span className="text-sm text-gray-500">
                        # {t('schoolIdLabel')}: {data.school_details.school_id}
                      </span>
                      <span className="h-1 w-1 bg-gray-300 rounded-full"/>
                      <span className="text-sm text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="map-pin" style={{padding:'6px'}} className="lucide lucide-map-pin h-3 w-3"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path><circle cx="12" cy="10" r="3"></circle></svg>
                      {t('schoolLocationLabel')}: {locationLabel}
                      </span>
                    </div>

                    {hasResults && data.current_plan ? (
                      <div className="d-flex flex-wrap align-items-center gap-2 py-2">
                        <span
                          className="pill-chip"
                          style={{
                            backgroundColor: (data.current_plan?.ui_color ? 'rgba('+data.current_plan?.ui_color+', 0.16)' : 'rgba(42, 33, 168, 0.16)'),
                            color: (data.current_plan?.ui_color ? 'rgb('+data.current_plan?.ui_color+')' : 'rgb(42, 33, 168)'),
                            borderColor: (data.current_plan?.ui_color ? 'rgba('+data.current_plan?.ui_color+', 0.6)' : 'rgba(42, 33, 168, 0.6)')
                          }}
                        >
                          {t('schoolPlanBadge')} {data.current_plan?.plan_name}
                        </span>
                        <span className="pill-chip"
                          // style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#0f766e' }}
                          style={{
                            color: (data.current_plan?.is_active ? '#0f766e' : '#761b0fff'),
                            background: (data.current_plan?.is_active ? 'rgba(16, 185, 129, 0.12)' : 'rgba(185, 16, 16, 0.12)'),
                          }}
                        >
                          {data.current_plan?.status_name}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>

                {canUpdate ? (
                  <div className="d-flex flex-wrap gap-3 align-items-center p-3">
                    <button type="button" className="ghost-button" onClick={() => setIsEditModalOpen(true)}>
                      {t('schoolEditButton')}
                    </button>
                  </div>
                ) : null}
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
                        <small className="text-sm ms-1 text-gray-400 fw-light">/ {data.current_plan?.base_student_limit}</small>
                      </div>
                    </div>
                    <div className="stat-card__icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    </div>
                  </div>
                  <div className="py-2">
                    <div className="progress">
                      <div 
                        className="progress-bar" 
                        style={{
                          width:( data.current_plan?.base_student_limit ?
                            (((data.roles_per_school.student_count/data.current_plan?.base_student_limit)*100).toFixed(0)+'%') : 0)
                        }} 
                        role="progressbar" 
                      />
                    </div>
                  </div>
                  <div className="d-flex justify-content-end">
                    <small className="text-sm text-gray-400 fw-light">{ data.current_plan?.base_student_limit ? 
                      (((data.roles_per_school.student_count/data.current_plan?.base_student_limit)*100).toFixed(0)) : 0
                    }% {t('ocupied')}</small>
                  </div>
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
                        <small className="ms-1 text-sm text-gray-400 fw-light">/ {data.current_plan?.base_admin_users_limit}</small>
                      </div>
                    </div>
                    <div className="stat-card__icon" style={{ color: '#f97316', background: 'rgba(249,115,22,0.12)' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 20a5 5 0 0 1 10 0"></path><circle cx="8" cy="7" r="4"></circle><path d="M20 8v6"></path><path d="M23 11h-6"></path></svg>
                    </div>
                  </div>
                  <div className="py-2">
                    <div className="progress">
                      <div 
                        className="progress-bar" 
                        style={{
                          backgroundColor: '#f97316',
                          width:
                            ( data.current_plan?.base_admin_users_limit ? 
                              (((data.roles_per_school.school_admin_count/data.current_plan?.base_admin_users_limit)*100).toFixed(0)+'%') : 0
                            )
                        }} 
                        role="progressbar" 
                      />
                    </div>
                  </div>
                  <div className="d-flex justify-content-end">
                    <small className="text-sm text-gray-400 fw-light">{
                      data.current_plan?.base_admin_users_limit ? 
                      (((data.roles_per_school.school_admin_count/data.current_plan?.base_admin_users_limit)*100).toFixed(0)): 0
                    }% {t('ocupied')}</small>
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-6 col-xl-3">
                <div className="stat-card card h-100">
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <div>
                      <div className="stat-card__title">{t('schoolCampusesCard')}</div>
                      <div className="stat-card__value">
                        {childSchools.length}
                        <small className="ms-1 text-sm text-gray-400 fw-light">/ {data.current_plan?.base_school_limit}</small>
                      </div>
                    </div>
                    <div className="stat-card__icon" style={{ color: '#16a34a', background: 'rgba(22,163,74,0.12)' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="10" height="14" x="3" y="7" rx="2"></rect><path d="M3 11h10"></path><path d="M8 11v10"></path><path d="m15 5 4-2v3l4-2v14"></path></svg>
                    </div>
                  </div>
                  <div className="py-2">
                    <div className="progress">
                      <div 
                        className="progress-bar" 
                        style={{
                          backgroundColor: '#16a34a',
                          width:
                            ( data.current_plan?.base_school_limit ?
                              (((childSchools.length/data.current_plan?.base_school_limit)*100).toFixed(0)+'%') : 0
                            )
                        }} 
                        role="progressbar" 
                      />
                    </div>
                  </div>
                  <div className="d-flex justify-content-end">
                    <small className="text-sm text-gray-400 fw-light">{
                      data.current_plan?.base_school_limit?
                      (((childSchools.length/data.current_plan?.base_school_limit)*100).toFixed(0)): '0'
                    }% {t('ocupied')}</small>
                  </div>
                </div>
              </div>
            </div>

            {hasResults ? (
              <>
                <div className="d-flex  gap-4 my-2 border-b border-gray-200">
                  {(
                    [
                      {
                        key: 'overview',
                        label: t('schoolOverviewTab'),
                        svg: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="layout-grid" className="p-1 lucide lucide-layout-grid h-4 w-4"><rect width="7" height="7" x="3" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="14" rx="1"></rect><rect width="7" height="7" x="3" y="14" rx="1"></rect></svg>
                      },
                      {
                        key: 'details',
                        label: t('schoolDetailsTab'),
                        svg: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="id-card" className="p-1 lucide lucide-id-card h-4 w-4"><path d="M16 18a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2"></path><circle cx="9" cy="10" r="2"></circle><rect x="4" y="4" width="16" height="16" rx="2"></rect><path d="M15 9h5"></path><path d="M15 12h5"></path></svg>
                      },
                      {
                        key: 'billing',
                        label: t('schoolBillingTab'),
                        svg: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="receipt" className="p-1 lucide lucide-receipt h-4 w-4"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"></path><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><path d="M12 17.5v-11"></path></svg>
                      },
                      {
                        key: 'settings',
                        label: t('schoolSettingsTab'),
                        svg: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="sliders" className="p-1 lucide lucide-sliders h-4 w-4"><path d="M10 8h4"></path><path d="M12 21v-9"></path><path d="M12 8V3"></path><path d="M17 16h4"></path><path d="M19 12V3"></path><path d="M19 21v-5"></path><path d="M3 14h4"></path><path d="M5 10V3"></path><path d="M5 21v-7"></path></svg>
                      },
                      {
                        key: 'structure',
                        label: t('schoolStructureTab'),
                        svg: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="building" className="p-1 lucide lucide-building h-4 w-4"><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M12 6h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M16 6h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path><path d="M8 6h.01"></path><path d="M9 22v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"></path><rect x="4" y="2" width="16" height="20" rx="2"></rect></svg>
                      },
                    ] as Array<{ key: TabKey; label: string; svg: React.ReactNode }>
                  ).map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      className={`tab-pill p-2 fw-light ${activeTab === tab.key ? 'active' : ''}`}
                      onClick={() => setActiveTab(tab.key)}
                    >
                      {tab.svg}
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div>
                  {activeTab === 'overview' ? (
                    <div className="row g-3">
                      <div className="col-12 col-lg-6">
                        <div className="card h-100">
                          <div className="d-flex align-items-center gap-2 mb-3">
                            <h6 className="mb-0 fw-bold">{t('schoolOverviewTitle')}</h6>
                          </div>
                          <ul className="d-flex flex-column p-0 gap-3">
                            <li className="d-flex align-items-center gap-2">
                              <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600 shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="user" className="lucide lucide-user h-5 w-5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                              </div>
                              <div className='d-flex flex-column'>
                                <span className="text-sm text-gray-500">{t('main_contact')}</span>
                                <span className="fw-medium ">{data.conctacts?.full_name || t('schoolNoData')}</span>
                              </div>
                            </li>
                            <li className="d-flex align-items-center gap-2">
                              <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600 shrink-0">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="mail" className="lucide lucide-mail h-5 w-5"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path><rect x="2" y="4" width="20" height="16" rx="2"></rect></svg>
                            </div>
                              <div className='d-flex flex-column'>
                                <span className="text-sm text-gray-500">{t('email')}</span>
                                <span className="fw-medium ">{data.conctacts?.personal_email || t('schoolNoData')}</span>
                              </div>
                            </li>
                            <li className="d-flex align-items-center gap-2">
                              <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600 shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="phone" className="lucide lucide-phone h-5 w-5"><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path></svg>
                              </div>
                              <div className='d-flex flex-column'>
                                <span className="text-sm text-gray-500">{t('schoolContactPhone')}</span>
                                <span className="fw-medium ">{data.conctacts?.phone_number || t('schoolNoData')}</span>
                              </div>
                            </li>
                            <li className="d-flex align-items-center gap-2">
                              <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600 shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="map" className="lucide lucide-map h-5 w-5"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"></path><path d="M15 5.764v15"></path><path d="M9 3.236v15"></path></svg>
                              </div>
                              <div className='d-flex flex-column'>
                                <span className="text-sm text-gray-500">{t('schoolAddressLabel')}</span>
                                <span className="fw-medium ">{data.conctacts?.address || t('schoolNoData')}</span>
                              </div>
                            </li>
                          </ul>
                        </div>
                      </div>

                      <div className="col-12 col-lg-6">
                        <div className="plan-card">
                          <div className="d-flex flex-wrap justify-content-between align-items-center">
                            <div>
                              <p className="text-white-50 fw-semibold mb-1">{t('schoolPlanTitle')}</p>
                            </div>
                            <span className="badge-soft" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}>
                              {t('schoolStatusBadge')}: {data.current_plan?.status_name}
                            </span>
                          </div>
                          <div className="d-flex flex-wrap justify-content-between align-items-center my-4">
                            <div>
                              <h5 className="fw-bolder mb-2">{data.current_plan?.plan_name}</h5>
                              <span className="plan-chip">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="9"></circle>
                                  <line x1="12" y1="12" x2="12" y2="7"></line>
                                  <line x1="12" y1="12" x2="16" y2="12"></line>
                                </svg>

                                {data.current_plan?.pot_name}
                              </span>
                            </div>
                              <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm rounded" style={{color:'rgb(253 224 71)'}}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="crown" className="lucide lucide-crown h-8 w-8 text-yellow-300"><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"></path><path d="M5 21h14"></path></svg>
                              </div>
                          </div>
                          <div className="d-flex gap-2 pt-3"
                            style={{borderTop: '.5px solid rgb(255 255 255 / 0.1)'}}
                          >
                            <div className='col-md-6'>
                              <span className="fw-light">{t('startDate')}</span>
                              <div className="d-flex flex-wrap gap-2 align-items-center">
                                <small className="text-white-50">{formatDate(data.current_plan?.start_date, locale, {year: 'numeric', month: 'short', day: '2-digit'}) || t('schoolNoData')}</small>
                              </div>
                            </div>

                            <div className='col-md-6'>
                              <span className="fw-light">{t('schoolNextBilling')}</span>
                              <div className="d-flex flex-wrap gap-2 align-items-center">
                                <span className="fw-bold">${data.current_plan?.price_yearly.toLocaleString(locale)}</span>
                                <small className="text-white-50">{formatDate(data.current_plan?.renew_plan, locale, {year: 'numeric', month: 'short', day: '2-digit'}) || t('schoolNoData')}</small>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {activeTab === 'details' ? (
                    <div className="row g-3">
                      <div className="col-12 col-lg-6">
                        <div className="card h-100">
                          <div className="d-flex align-items-center gap-2 mb-3">
                            <h6 className="mb-0 fw-bold">{t('schoolDetailsTitle')}</h6>
                          </div>
                          <ul className="info-list d-flex flex-column gap-3">
                            <li className="d-flex flex-column align-items-start">
                              <span className="text-sm text-gray-500">{t('schoolCommercialNameLabel')}</span>
                              <span className="fw-medium">{schoolDetails?.commercial_name || t('schoolNoData')}</span>
                            </li>
                            <li className="d-flex flex-column align-items-start">
                              <span className="text-sm text-gray-500">{t('schoolBusinessNameLabel')}</span>
                              <span className="fw-medium">{schoolDetails?.business_name || t('schoolNoData')}</span>
                            </li>
                            <li className="d-flex flex-column align-items-start">
                              <span className="text-sm text-gray-500">{t('schoolTaxIdLabel')}</span>
                              <span className="fw-medium">{schoolDetails?.tax_id || t('schoolNoData')}</span>
                            </li>
                            <li className="d-flex flex-column gap-1">
                              <span className="text-sm text-gray-500">{t('schoolDescriptionLabel')}</span>
                              <span className="info-list__value">{schoolDetails?.school_description || t('schoolNoData')}</span>
                            </li>
                          </ul>
                        </div>
                      </div>

                      <div className="col-12 col-lg-6">
                        <div className="card h-100">
                          <div className="d-flex align-items-center gap-2 mb-3">
                            <h6 className="mb-0 fw-bold">{t('schoolDetailsLocationTitle')}</h6>
                          </div>
                          <ul className="info-list d-flex flex-column gap-3">
                            <li className="d-flex flex-column align-items-start">
                              <span className="text-sm text-gray-500">{t('schoolAddressLabel')}</span>
                              <span className="fw-medium">{fullAddress || t('schoolNoData')}</span>
                            </li>
                            <li className="d-flex flex-column align-items-start">
                              <span className="text-sm text-gray-500">{t('schoolContactPhone')}</span>
                              <span className="fw-medium">{schoolDetails?.phone_number || t('schoolNoData')}</span>
                            </li>
                            <li className="d-flex flex-column align-items-start">
                              <span className="text-sm text-gray-500">{t('schoolContactEmail')}</span>
                              <span className="fw-medium">{schoolDetails?.email || t('schoolNoData')}</span>
                            </li>
                            <li className="d-flex flex-column align-items-start">
                              <span className="text-sm text-gray-500">{t('schoolCreationDateLabel')}</span>
                              <span className="fw-medium">{formatDate(schoolDetails?.created_at, locale, {year: 'numeric', month: 'short', day: '2-digit'}) || t('schoolNoData')}</span>
                            </li>
                            <li className="d-flex flex-column align-items-start">
                              <span className="text-sm text-gray-500">{t('schoolMaxDebtLabel')}</span>
                              <span className="fw-medium">{schoolDetails?.max_debt?.toLocaleString(locale) ?? t('schoolNoData')}</span>
                            </li>
                            <li className="d-flex flex-column align-items-start">
                              <span className="text-sm text-gray-500">{t('schoolDefaultTuitionLabel')}</span>
                              <span className="fw-medium">{schoolDetails?.default_tuition?.toLocaleString(locale) ?? t('schoolNoData')}</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {activeTab === 'billing' ? (
                    <div className="d-flex flex-column gap-3">
                      <div className="card">
                        <div className="d-flex align-items-center gap-2 mb-3">
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
                            <h6 className="mb-0 fw-bold">{t('schoolModulesTitle')}</h6>
                          </div>
                          {modules && modules.length ? (
                            <ul className="info-list">
                              {modules
                                .sort((a, b) => a.sort_order - b.sort_order)
                                .map((module) => (
                                  <li key={module.module_access_control_id} className="d-flex justify-content-between align-items-center">
                                    <div className="fw-bold">{locale === 'es' ? module.name_es : module.name_en}</div>
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
                      <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                        <h6 className="mb-0 fw-bold">{t('schoolStructureTitle')}</h6>
                        {canCreate ? (
                          <button type="button" className="btn btn-primary">
                            Añadir
                          </button>
                        ) : null}
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
                                    onClick={() => onNavigate(`/${locale}/schools/${school.school_id}`)}
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
            ) : (
              <div className="card">
                <p className="mb-0 text-muted fw-semibold">{t('schoolNoData')}</p>
              </div>
            )}
          </>
        ) : (
          <div className="card">
            <p className="mb-0 text-muted fw-semibold">{t('schoolNoData')}</p>
          </div>
        )}
        </div>
      </Layout>
      <SchoolUpdateModal
        isOpen={isEditModalOpen}
        school={schoolDetails ?? null}
        onClose={() => setIsEditModalOpen(false)}
        onUpdated={() => setRefreshKey((prev) => prev + 1)}
      />
    </>
  )
}
