import { useEffect, useMemo, useState } from 'react'
import { Layout } from '../layout/Layout'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../config'
import { createCurrencyFormatter } from '../utils/currencyFormatter'
import UsersBalanceRechargeModal, { type UsersBalanceSearchItem } from '../components/payments/UsersBalanceRechargeModal'
import { ManualPaymentModal } from './PaymentsFinancePage/components/ManualPaymentModal'
import {
  CreatePaymentRequestModal,
  type ApplyScope,
  type SelectedStudent,
} from './PaymentsFinancePage/components/CreatePaymentRequestModal'
import { initialPaymentRequestFormState } from './PaymentsFinancePage/components/paymentRequestsFormState'
import { StudentCreateModal } from '../components/StudentCreateModal'
import { useModulePermissions } from '../hooks/useModulePermissions'
import './DashboardScholarAdminPage.css'

interface DashboardScholarAdminPageProps {
  onNavigate: (path: string) => void
}

interface ScholarLevelCount {
  scholar_level_id: number
  scholar_level_name: string
  student_count: number
}

interface StudentsCountResponse {
  total_students: number
  by_scholar_level: ScholarLevelCount[]
}

interface IncomeProgressResponse {
  monthIncomeTotal: number
  monthGoalTotal: number
  monthProgressPct: number
}

interface PendingTotalsResponse {
  pendingTotalAmount: number
  studentsWithPendingCount: number
}

export function DashboardScholarAdminPage({ onNavigate }: DashboardScholarAdminPageProps) {
  const { t, locale } = useLanguage()
  const { token } = useAuth()

  const [studentsCount, setStudentsCount] = useState<StudentsCountResponse | null>(null)
  const [incomeProgress, setIncomeProgress] = useState<IncomeProgressResponse | null>(null)
  const [pendingTotals, setPendingTotals] = useState<PendingTotalsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false)
  const [isRechargeModalOpen, setRechargeModalOpen] = useState(false)
  const [isPaymentRequestModalOpen, setPaymentRequestModalOpen] = useState(false)
  const [isStudentModalOpen, setStudentModalOpen] = useState(false)

  const [paymentRequestForm, setPaymentRequestForm] = useState({ ...initialPaymentRequestFormState })
  const [applyScope, setApplyScope] = useState<ApplyScope>('school')
  const [selectedStudent, setSelectedStudent] = useState<SelectedStudent | null>(null)
  const [selectedRechargeUser, setSelectedRechargeUser] = useState<UsersBalanceSearchItem | null>(null)
  const [paymentRequestError, setPaymentRequestError] = useState<string | null>(null)
  const [isSavingRequest, setIsSavingRequest] = useState(false)

  const { permissions: paymentsPermissions } = useModulePermissions('payments')
  const { permissions: balancePermissions } = useModulePermissions('balance')
  const { permissions: requestPermissions } = useModulePermissions('request')

  const currencyFormatter = useMemo(() => createCurrencyFormatter(locale, 'MXN'), [locale])

  useEffect(() => {
    if (!token) return

    const controller = new AbortController()
    const loadDashboardData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({ lang: locale })
        const headers = { Authorization: `Bearer ${token}` }

        const [studentsResponse, incomeResponse, pendingResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/students/counts/by-scholar-level?${params.toString()}`, {
            headers,
            signal: controller.signal,
          }),
          fetch(`${API_BASE_URL}/reports/monthly-income-progress?${params.toString()}`, {
            headers,
            signal: controller.signal,
          }),
          fetch(`${API_BASE_URL}/payment-requests/pending-totals?${params.toString()}`, {
            headers,
            signal: controller.signal,
          }),
        ])

        if (!studentsResponse.ok || !incomeResponse.ok || !pendingResponse.ok) {
          throw new Error('failed_request')
        }

        const studentsPayload = (await studentsResponse.json()) as StudentsCountResponse
        const incomePayload = (await incomeResponse.json()) as IncomeProgressResponse
        const pendingPayload = (await pendingResponse.json()) as PendingTotalsResponse

        setStudentsCount(studentsPayload)
        setIncomeProgress(incomePayload)
        setPendingTotals(pendingPayload)
      } catch (loadError) {
        if ((loadError as Error).name !== 'AbortError') {
          setError(t('defaultError'))
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
    return () => controller.abort()
  }, [locale, t, token])

  const totalStudents = studentsCount?.total_students ?? 0

  const scholarLevels = useMemo(() => {
    const DEFAULT_LEVELS = ['Primaria', 'Secundaria', 'Preparatoria']
    const levelMap = new Map<string, number>()

    studentsCount?.by_scholar_level?.forEach((level) => {
      levelMap.set(level.scholar_level_name, level.student_count)
    })

    return DEFAULT_LEVELS.map((level) => ({
      name: level,
      count: levelMap.get(level) ?? 0,
    }))
  }, [studentsCount])

  const monthIncome = incomeProgress?.monthIncomeTotal ?? 0
  const monthGoal = incomeProgress?.monthGoalTotal ?? 0
  const rawProgress = incomeProgress?.monthProgressPct ?? 0
  const normalizedProgress = rawProgress > 1 ? rawProgress : rawProgress * 100
  const monthProgress = Math.min(100, Math.max(0, Math.round(normalizedProgress)))

  const pendingAmount = pendingTotals?.pendingTotalAmount ?? 0
  const pendingStudents = pendingTotals?.studentsWithPendingCount ?? 0

  const buildRechargeUserFromStudent = (student: SelectedStudent | null): UsersBalanceSearchItem | null => {
    if (!student) return null
    return {
      user_id: Number(student.student_id),
      full_name: student.full_name,
      role_name: 'Student',
      generation: student.generation || null,
      scholar_level_name: student.scholar_level_name || null,
      grade_group: student.grade_group || null,
      balance: 0,
    }
  }

  const canCreatePayments = paymentsPermissions?.c ?? false
  const canReadPayments = paymentsPermissions?.r ?? false
  const canCreateBalance = balancePermissions?.c ?? false
  const canCreateRequest = requestPermissions?.c ?? false

  const frequentActions = [
    canCreatePayments
      ? {
          title: 'recordPayment',
          description: 'recordPaymentDescription',
          icon: 'bi-cash-coin',
          variant: 'primary',
          onClick: () => setPaymentModalOpen(true),
        }
      : null,
    canCreateBalance
      ? {
          title: 'rechargeBalance',
          description: 'rechargeBalanceDescription',
          icon: 'bi-wallet2',
          variant: 'success',
          onClick: () => {
            setSelectedRechargeUser(buildRechargeUserFromStudent(selectedStudent))
            setRechargeModalOpen(true)
          },
        }
      : null,
    canCreateRequest
      ? {
          title: 'newPaymentRequest',
          description: 'newPaymentRequestDescription',
          icon: 'bi-ui-checks-grid',
          variant: 'info',
          onClick: () => setPaymentRequestModalOpen(true),
        }
      : null,
    {
      title: 'enrollStudent',
      description: 'enrollStudentDescription',
      icon: 'bi-person-plus',
      variant: 'secondary',
      onClick: () => setStudentModalOpen(true),
    },
  ].filter(Boolean) as Array<{
    title: string
    description: string
    icon: string
    variant: 'primary' | 'success' | 'info' | 'secondary'
    onClick: () => void
  }>

  const handlePaymentRequestFormChange = <K extends keyof typeof initialPaymentRequestFormState>(
    key: K,
    value: (typeof initialPaymentRequestFormState)[K],
  ) => {
    setPaymentRequestForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handlePaymentRequestClose = () => {
    setPaymentRequestModalOpen(false)
    setPaymentRequestError(null)
    setIsSavingRequest(false)
    setPaymentRequestForm({ ...initialPaymentRequestFormState })
    setSelectedStudent(null)
    setApplyScope('school')
  }

  const handlePaymentRequestSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
    setPaymentRequestError(null)
    setIsSavingRequest(true)

    setTimeout(() => {
      setIsSavingRequest(false)
      handlePaymentRequestClose()
    }, 400)
  }

  return (
    <Layout onNavigate={onNavigate} pageTitle={t('portalTitle')}>
      <div className="scholar-dashboard__header">
        <div>
          <p className="text-uppercase text-muted mb-1">{t('academicPanelLabel')}</p>
          <h2 className="fw-bold mb-2">{t('welcome')}</h2>
          <p className="text-muted mb-0">{t('academicPanelDescription')}</p>
        </div>
      </div>

      {error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="alert alert-info" role="alert">
          {t('academicLoading')}
        </div>
      ) : null}

      <div className="row">
        <div className="col">
          <div className="row g-3 mb-3">
            {canReadPayments ? (
              <div className="col-md-4">
                <div className="scholar-dashboard__stat-card scholar-dashboard__stat-card--income">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <p className="text-uppercase text-muted fw-semibold mb-1">{t('monthIncomeTitle')}</p>
                      <h3 className="fw-bold mb-0">{currencyFormatter.format(monthIncome)}</h3>
                    </div>
                    <span className="scholar-dashboard__stat-pill scholar-dashboard__stat-pill--success">
                      {monthProgress}% {t('monthlyGoalProgress')}
                    </span>
                  </div>
                  <p className="text-muted small mb-3">
                    {t('goal')}: {currencyFormatter.format(monthGoal)}
                  </p>
                  <div className="scholar-dashboard__progress">
                    <div className="scholar-dashboard__progress-bar" style={{ width: `${monthProgress}%` }} />
                  </div>
                </div>
              </div>
            ) : null}

            {canReadPayments ? (
              <div className="col-md-4">
                <div className="scholar-dashboard__stat-card scholar-dashboard__stat-card--pending">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <p className="text-uppercase text-muted fw-semibold mb-1">{t('overdueToCollect')}</p>
                      <h3 className="fw-bold mb-0">{currencyFormatter.format(pendingAmount)}</h3>
                    </div>
                    <span className="scholar-dashboard__stat-icon" aria-hidden>
                      <i className="bi bi-exclamation-octagon" />
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="scholar-dashboard__chip scholar-dashboard__chip--danger">
                      {pendingStudents} {t('students')}
                    </span>
                    <span className="text-muted small">{t('studentsWithDebt')}</span>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="col-md-4">
              <div className="scholar-dashboard__population-card">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <p className="text-uppercase text-light mb-1">{t('schoolPopulation')}</p>
                    <h5 className="text-white mb-0">{t('activeStudents')}</h5>
                    <p className="text-white-50 mb-0">
                      {t('cycleLabel')} 2025-2026
                    </p>
                  </div>
                  <div className="scholar-dashboard__population-badge">
                    <span>{totalStudents}</span>
                  </div>
                </div>

                <div className="scholar-dashboard__population-levels">
                  {scholarLevels.map((level) => (
                    <div key={level.name} className="scholar-dashboard__population-row">
                      <span>{level.name}</span>
                      <strong>{level.count}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="card scholar-dashboard__actions-card">
            <div className="card-body">
              <div className="d-flex align-items-center gap-2 mb-3">
                <span className="scholar-dashboard__eyebrow-icon" aria-hidden>⚡</span>
                <p className="text-uppercase text-muted fw-semibold mb-0">{t('frequentActions')}</p>
              </div>

              <div className="scholar-dashboard__actions-grid">
                {frequentActions.map((action) => (
                  <button
                    key={action.title}
                    type="button"
                    className={`scholar-dashboard__action-tile scholar-dashboard__action-tile--${action.variant}`}
                    onClick={action.onClick}
                    >
                      <div className="scholar-dashboard__action-icon">
                        <i className={`bi ${action.icon}`} aria-hidden />
                      </div>
                      <div>
                        <p className="fw-semibold mb-1">{t(action.title)}</p>
                        <p className="text-muted mb-0">{t(action.description)}</p>
                      </div>
                    </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ManualPaymentModal
        isOpen={isPaymentModalOpen}
        lang={locale}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={() => setPaymentModalOpen(false)}
      />

      <UsersBalanceRechargeModal
        isOpen={isRechargeModalOpen}
        onClose={() => {
          setRechargeModalOpen(false)
          setSelectedRechargeUser(null)
        }}
        user={selectedRechargeUser}
        onSuccess={() => setRechargeModalOpen(false)}
        lang={locale}
      />

      <CreatePaymentRequestModal
        isOpen={isPaymentRequestModalOpen}
        applyScope={applyScope}
        createError={paymentRequestError}
        isSavingRequest={isSavingRequest}
        locale={locale}
        onApplyScopeChange={(scope) => setApplyScope(scope)}
        onClose={handlePaymentRequestClose}
        onFormChange={handlePaymentRequestFormChange}
        onStudentSelect={(student) => {
          setSelectedStudent(student)
          handlePaymentRequestFormChange('student_id', student.student_id)
        }}
        onSubmit={handlePaymentRequestSubmit}
        paymentRequestForm={paymentRequestForm}
        schoolOptions={[]}
        groupOptions={[]}
        selectedStudent={selectedStudent}
        t={(key) => t(key)}
      />

      <StudentCreateModal
        isOpen={isStudentModalOpen}
        onClose={() => setStudentModalOpen(false)}
      />
    </Layout>
  )
}
