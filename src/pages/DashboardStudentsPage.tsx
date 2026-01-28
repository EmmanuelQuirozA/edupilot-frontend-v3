import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { Layout } from '../layout/Layout'
import { API_BASE_URL } from '../config'
import { createCurrencyFormatter } from '../utils/currencyFormatter'

interface DashboardStudentsPageProps {
  onNavigate: (path: string) => void
}

interface PendingTotalsResponse {
  pendingTotal: number
  lateFeeTotal: number
}

interface StudentReadOnlyResponse {
  balance: number
  fullName: string
}

interface PaymentResponse {
  payment_id: number
  pt_name: string
  amount: number
  payment_status_name: string
  payment_reference?: string | null
  payment_date?: string | null
  payment_created_at?: string | null
}

interface PaymentRequestItem {
  payment_request_id: number
  payment_reference: string
  student_full_name: string
  generation: string
  scholar_level_name: string
  grade_group: string
  pr_amount: number
  pr_created_at: string
  pr_pay_by: string
  late_fee: number
  fee_type: string
  late_fee_frequency: number
  payment_month: string | null
  student_id: number
  payment_status_id: number
  ps_pr_name: string
  pt_name: string
  total_amount_payments: number | null
  latest_payment_date: string | null
  late_fee_total: number
}

export function DashboardStudentsPage({ onNavigate }: DashboardStudentsPageProps) {
  const { t, locale } = useLanguage()
  const { token } = useAuth()

  const [pendingTotals, setPendingTotals] = useState<PendingTotalsResponse | null>(null)
  const [isPendingLoading, setIsPendingLoading] = useState(false)
  const [pendingError, setPendingError] = useState<string | null>(null)

  const [studentInfo, setStudentInfo] = useState<StudentReadOnlyResponse | null>(null)
  const [isStudentInfoLoading, setIsStudentInfoLoading] = useState(false)
  const [studentInfoError, setStudentInfoError] = useState<string | null>(null)

  const [payments, setPayments] = useState<PaymentResponse[]>([])
  const [isPaymentsLoading, setIsPaymentsLoading] = useState(false)
  const [paymentsError, setPaymentsError] = useState<string | null>(null)

  const [paymentRequests, setPaymentRequests] = useState<PaymentRequestItem[]>([])
  const [isPaymentRequestsLoading, setIsPaymentRequestsLoading] = useState(false)
  const [paymentRequestsError, setPaymentRequestsError] = useState<string | null>(null)

  const currencyFormatter = useMemo(() => createCurrencyFormatter(locale, 'MXN'), [locale])

  useEffect(() => {
    if (!token) return
    const controller = new AbortController()
    const loadPendingTotals = async () => {
      setIsPendingLoading(true)
      setPendingError(null)
      try {
        const response = await fetch(`${API_BASE_URL}/payment-requests/pending?lang=${locale}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const payload = (await response.json()) as PendingTotalsResponse
        setPendingTotals(payload)
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setPendingError(t('defaultError'))
        }
      } finally {
        setIsPendingLoading(false)
      }
    }

    loadPendingTotals()
    return () => controller.abort()
  }, [locale, t, token])

  useEffect(() => {
    if (!token) return
    const controller = new AbortController()
    const loadStudentInfo = async () => {
      setIsStudentInfoLoading(true)
      setStudentInfoError(null)
      try {
        const response = await fetch(`${API_BASE_URL}/students/read-only?lang=${locale}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const payload = (await response.json()) as StudentReadOnlyResponse
        setStudentInfo(payload)
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setStudentInfoError(t('defaultError'))
        }
      } finally {
        setIsStudentInfoLoading(false)
      }
    }

    loadStudentInfo()
    return () => controller.abort()
  }, [locale, t, token])

  useEffect(() => {
    if (!token) return
    const controller = new AbortController()

    const loadPayments = async () => {
      setIsPaymentsLoading(true)
      setPaymentsError(null)
      try {
        const params = new URLSearchParams({
          lang: locale,
          offset: '0',
          limit: '5',
        })

        const response = await fetch(`${API_BASE_URL}/reports/payments?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const payload = (await response.json()) as PaymentResponse[] | { content?: PaymentResponse[] }
        const data = Array.isArray(payload) ? payload : payload.content ?? []
        setPayments(data)
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setPaymentsError(t('defaultError'))
        }
      } finally {
        setIsPaymentsLoading(false)
      }
    }

    loadPayments()

    return () => controller.abort()
  }, [locale, t, token])

  useEffect(() => {
    if (!token) return
    const controller = new AbortController()

    const loadPaymentRequests = async () => {
      setIsPaymentRequestsLoading(true)
      setPaymentRequestsError(null)
      try {
        const params = new URLSearchParams({
          lang: locale,
          offset: '0',
          limit: '5',
        })

        const response = await fetch(`${API_BASE_URL}/reports/paymentrequests?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const payload = (await response.json()) as { content?: PaymentRequestItem[] }
        setPaymentRequests(payload.content ?? [])
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setPaymentRequestsError(t('defaultError'))
        }
      } finally {
        setIsPaymentRequestsLoading(false)
      }
    }

    loadPaymentRequests()
    return () => controller.abort()
  }, [locale, t, token])

  const formatDate = useCallback((value?: string | null) => {
    if (!value) return t('studentsNoDate')
    const targetLocale = locale === 'es' ? 'es-MX' : 'en-US'
    return new Date(value).toLocaleDateString(targetLocale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }, [locale, t])

  const totalPendingAmount = (pendingTotals?.pendingTotal ?? 0) + (pendingTotals?.lateFeeTotal ?? 0)

  const isRequestOverdue = (request: PaymentRequestItem) => {
    const dueDate = new Date(request.pr_pay_by)
    const now = new Date()
    return dueDate.getTime() < now.getTime()
  }

  const renderPendingRequests = () => {
    if (isPaymentRequestsLoading) {
      return <p className="text-muted mb-0">{t('studentsLoadingRequests')}</p>
    }

    if (paymentRequestsError) {
      return <p className="text-danger mb-0">{paymentRequestsError}</p>
    }

    if (paymentRequests.length === 0) {
      return <p className="text-muted mb-0">{t('studentsNoPendingRequests')}</p>
    }

    return (
      <div className="d-flex flex-column gap-3">
        {paymentRequests.map((request) => {
          const overdue = isRequestOverdue(request)
          return (
            <div
              key={request.payment_request_id}
              className="d-flex align-items-center justify-content-between rounded-4 px-3 py-3 border bg-white"
            >
              <div className="d-flex flex-column gap-1">
                <div className="d-flex align-items-center gap-2">
                  <div>
                    <h6 className="mb-0 fw-semibold" style={{ color: '#0F172A' }}>{request.pt_name}</h6>
                    <small className="text-muted">{formatDate(request.pr_pay_by)}</small>
                  </div>
                </div>
              </div>
              <div className="text-end">
                <p className="fw-bold mb-1" style={{ color: overdue ? '#D92D20' : '#0F172A' }}>
                  {currencyFormatter.format(request.pr_amount+request.late_fee_total)}
                </p>
                <span
                  className={`badge px-3 rounded-pill fw-semibold ${
                    overdue ? 'bg-danger-subtle text-danger' : 'bg-warning-subtle text-warning'
                  }`}
                >
                  {overdue ? t('studentsOverdue') : t('studentsPending')}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderRecentPayments = () => {
    if (isPaymentsLoading) {
      return <p className="text-muted mb-0">{t('studentsLoadingRecentPayments')}</p>
    }

    if (paymentsError) {
      return <p className="text-danger mb-0">{paymentsError}</p>
    }

    if (payments.length === 0) {
      return <p className="text-muted mb-0">{t('studentsNoRecentPayments')}</p>
    }

    return (
      <div className="d-flex flex-column gap-3 ">
        {payments.map((payment, index) => (
          <div key={payment.payment_id} className="d-flex justify-content-between rounded-4 px-3 py-3 border">
            <div className='d-flex gap-3'>
              {/* Timeline */}
              <div className="d-flex flex-column align-items-center">
                <span
                  className="rounded-circle"
                  style={{ width: 8, height: 8, backgroundColor: index === 0 ? '#22C55E' : '#6366F1', marginTop: 4 }}
                />
                {index !== payments.length - 1 && (
                  <span style={{ width: 1, flex: 1, backgroundColor: '#E5E7EB', marginTop: 4 }} />
                )}
              </div>

              {/* Content */}
              <div>
                <p className="mb-1 fw-medium" style={{ color: '#0F172A' }}>
                  {payment.pt_name}
                </p>
                <p className="mb-0 text-muted small">
                  {formatDate(payment.payment_date ?? payment.payment_created_at)}
                </p>
              </div>
            </div>

            <div className="text-end">
              <p className="fw-bold mb-0">{currencyFormatter.format(payment.amount)}</p>
              <small className="text-muted">{payment.payment_status_name}</small>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Layout onNavigate={onNavigate} pageTitle={t('portalTitle')}>
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
        <div>
          <p className="text-uppercase text-muted mb-1">{t('studentsDashboardLabel')}</p>
          <h2 className="fw-bold mb-2">{t('welcome')}</h2>
          <p className="text-muted mb-0">{t('studentsDashboardDescription')}</p>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-lg-8">
          <div
            className="card h-100 border-0 shadow-sm text-white position-relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)'}}
          >
            <div className="card-body d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
              <div>
                <p className="text-uppercase small mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  {t('studentsTotalDue')}
                </p>
                {isPendingLoading ? (
                  <p className="mb-0" style={{ color: 'rgba(255,255,255,0.75)' }}>
                    {t('studentsLoading')}
                  </p>
                ) : pendingError ? (
                  <p className="mb-0 text-warning">{pendingError}</p>
                ) : (
                  <>
                    <div className="d-flex align-items-end gap-2 mb-2">
                      <h1 className="fw-bold mb-0" style={{ fontSize: '2.75rem' }}>
                        {currencyFormatter.format(totalPendingAmount)}
                      </h1>
                      <span className="fw-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>MXN</span>
                    </div>
                    <p className="mb-0" style={{ color: 'rgba(255,255,255,0.75)' }}>
                      <i className="bi bi-info-circle me-2"/>
                      {t('studentsIncludesLateFees').replace(
                        '{amount}',
                        currencyFormatter.format(pendingTotals?.lateFeeTotal ?? 0),
                      )}
                    </p>
                  </>
                )}
              </div>
              <div className="text-end d-flex flex-column align-items-end gap-2">
                <button
                  className="btn btn-light text-primary fw-semibold"
                  onClick={() => onNavigate(`/${locale}/finance/request`)}
                >
                  {t('studentsViewMore')}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body d-flex flex-column justify-content-between">
              <div>
                <p className="text-uppercase text-muted small mb-2">{t('studentsAvailableBalance')}</p>
                {isStudentInfoLoading ? (
                  <p className="mb-0 text-muted">{t('studentsLoading')}</p>
                ) : studentInfoError ? (
                  <p className="mb-0 text-danger">{studentInfoError}</p>
                ) : (
                  <div className="d-flex align-items-center gap-2">
                    <div className="rounded-circle bg-success-subtle text-success d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
                      <i className="bi bi-credit-card"></i>
                    </div>
                    <h3 className="fw-bold mb-0">{currencyFormatter.format(studentInfo?.balance ?? 0)}</h3>
                  </div>
                )}
              </div>
              <p className="text-muted small mb-0">{t('studentsBalanceHint')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3">
        {(isPaymentRequestsLoading || !!paymentRequestsError || paymentRequests.length > 0) && (
          <div className="col-lg-7">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <p className="text-uppercase text-muted small mb-1">{t('studentsPendingRequestsLabel')}</p>
                    <h5 className="fw-bold mb-0">{t('studentsUpcomingPayments')}</h5>
                  </div>
                  <button
                    className="btn btn-link text-primary text-decoration-none fw-semibold"
                    onClick={() => onNavigate(`/${locale}/finance/request`)}
                  >
                    {t('studentsViewAll')}
                  </button>
                </div>
                {renderPendingRequests()}
                <hr />
                <button
                  className="btn btn-outline-primary w-100"
                  onClick={() => onNavigate(`/${locale}/finance/request`)}
                >
                  {t('studentsViewFullHistory')}
                </button>
              </div>
            </div>
          </div>
        )}

        <div
          className={
            isPaymentRequestsLoading || !!paymentRequestsError || paymentRequests.length > 0
              ? 'col-lg-5'
              : 'col-lg-12'
          }
        >
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <p className="text-uppercase text-muted small mb-1">{t('studentsRecentPaymentsLabel')}</p>
                  <h5 className="fw-bold mb-0">{t('studentsLatestMovements')}</h5>
                </div>
                <button
                  className="btn btn-link text-primary text-decoration-none fw-semibold"
                  onClick={() => onNavigate(`/${locale}/finance/payments`)}
                >
                  {t('studentsViewMore')}
                </button>
              </div>
              {renderRecentPayments()}
              <hr />
              <button
                className="btn btn-outline-primary w-100"
                onClick={() => onNavigate(`/${locale}/finance/payments`)}
              >
                {t('studentsViewFullHistory')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
