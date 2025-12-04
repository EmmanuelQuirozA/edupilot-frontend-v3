import { useEffect, useMemo, useState } from 'react'
import { Layout } from '../../layout/Layout'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import type { BreadcrumbItem } from '../../components/Breadcrumb'
import { LoadingSkeleton } from '../../components/LoadingSkeleton'
import { API_BASE_URL } from '../../config'
import { formatDate } from '../../utils/formatDate'

interface PaymentRequestDetailPageProps {
  onNavigate: (path: string) => void
  paymentRequestId: number
}

interface StudentInfo {
  user_id: number
  student_id: number
  register_id: number | null
  payment_reference: string | null
  email: string | null
  full_name: string
  address: string | null
  generation: string | null
  grade_group: string | null
  scholar_level_name: string | null
  phone_number: string | null
}

interface PaymentRequestInfo {
  payment_request_id: number
  pr_amount: number
  pr_created_at: string
  pr_pay_by: string
  pr_comments: string | null
  late_fee: number
  fee_type: string
  late_fee_frequency: number
  payment_month: string | null
  payment_status_id: number
  partial_payment_transformed: string
  partial_payment: boolean
  mass_upload: number
  pr_payment_status_id: number | null
  ps_pr_name: string
  pt_name: string
  closed_at: string | null
}

interface PaymentEntry {
  payment_id: number
  payment_month: string | null
  amount: number
  payment_status_id: number
  validated_at: string | null
  pay_created_at: string
  payment_date: string
  updated_at: string
  comments: string | null
  pt_name: string
  payment_status_name: string
  validator_full_name: string | null
  validator_phone_number: string | null
  validator_username: string | null
}

interface PaymentInfoSummary {
  totalPaid: number
  latePeriods: number
  lateFeeTotal: number
  accumulatedFees: number
  pendingPayment: number
}

interface BreakdownEntry {
  payment_id: number | null
  type: 'initial_payment_request' | 'late_fee' | 'payment'
  payment_status_id: number | null
  status_name: string | null
  date: string
  amount: number
  balance: number
}

interface PaymentLogChange {
  field: string | null
  from: string | null
  to: string | null
  comments: string | null
}

interface PaymentLog {
  payment_request_id: number
  responsable_user_id: number
  responsable_full_name: string
  role_name: string
  updated_at: string
  log_type_name: string
  changes: PaymentLogChange[]
}

interface PaymentRequestDetailResponse {
  student: StudentInfo
  paymentRequest: PaymentRequestInfo
  payments: PaymentEntry[]
  paymentInfo: PaymentInfoSummary
  breakdown: BreakdownEntry[]
}

export function PaymentRequestDetailPage({ onNavigate, paymentRequestId }: PaymentRequestDetailPageProps) {
  const { t, locale } = useLanguage()
  const { token, hydrated } = useAuth()

  const [paymentRequestDetail, setPaymentRequestDetail] = useState<PaymentRequestDetailResponse | null>(null)
  const [logs, setLogs] = useState<PaymentLog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [logsLoading, setLogsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logsError, setLogsError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'breakdown' | 'activity'>('breakdown')

  const breadcrumbItems: BreadcrumbItem[] = useMemo(
    () => [
      {
        label: t('portalTitle'),
        onClick: () => onNavigate(`/${locale}`),
      },
      {
        label: t('paymentsFinance'),
        onClick: () => onNavigate(`/${locale}/finance/request`),
      },
      { label: `${t('paymentRequestDetail')} #${paymentRequestId}` },
    ],
    [locale, onNavigate, paymentRequestId, t],
  )

  useEffect(() => {
    if (!token) return

    const controller = new AbortController()
    const fetchPaymentRequest = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          payment_request_id: String(paymentRequestId),
          lang: locale,
        })

        const response = await fetch(`${API_BASE_URL}/reports/paymentrequest/details?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const json = await response.json()
        setPaymentRequestDetail(json ?? null)
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          setError(t('defaultError'))
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchPaymentRequest()

    return () => controller.abort()
  }, [locale, paymentRequestId, t, token])

  useEffect(() => {
    if (!token) return

    const controller = new AbortController()
    const fetchLogs = async () => {
      setLogsLoading(true)
      setLogsError(null)
      try {
        const params = new URLSearchParams({ lang: locale })
        const response = await fetch(`${API_BASE_URL}/logs/payment/${paymentRequestId}?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const json = await response.json()
        setLogs(json ?? [])
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          setLogsError(t('defaultError'))
        }
      } finally {
        setLogsLoading(false)
      }
    }

    fetchLogs()

    return () => controller.abort()
  }, [locale, paymentRequestId, t, token])

  if (!hydrated) {
    return (
      <Layout onNavigate={onNavigate} pageTitle={t('paymentsFinance')} breadcrumbItems={breadcrumbItems}>
        <LoadingSkeleton variant="table" rowCount={10} />
      </Layout>
    )
  }

  if (isLoading) {
    return (
      <Layout onNavigate={onNavigate} pageTitle={t('paymentRequestDetail')} breadcrumbItems={breadcrumbItems}>
        <LoadingSkeleton variant="table" rowCount={8} />
      </Layout>
    )
  }

  if (error || !paymentRequestDetail) {
    return (
      <Layout onNavigate={onNavigate} pageTitle={t('paymentRequestDetail')} breadcrumbItems={breadcrumbItems}>
        <div className="alert alert-danger" role="alert">
          {error ?? t('defaultError')}
        </div>
      </Layout>
    )
  }

  const { student, paymentRequest, paymentInfo, payments, breakdown } = paymentRequestDetail

  const formatCurrency = (value: number) =>
    value.toLocaleString(locale === 'es' ? 'es-MX' : 'en-US', { style: 'currency', currency: 'MXN' })

  const groupLabel = t('groupLabel')
    .replace('{{group}}', student.grade_group || '-')
    .replace('{{level}}', student.scholar_level_name || '-')
    .replace('{{generation}}', student.generation || '-')

  const conceptLabel = (type: BreakdownEntry['type']) => {
    if (type === 'initial_payment_request') return t('initialPaymentRequest')
    if (type === 'late_fee') return t('lateFee')
    return t('paymentLabel')
  }

  const commentsText = paymentRequest.pr_comments && paymentRequest.pr_comments !== 'null'
    ? paymentRequest.pr_comments
    : t('noInformation')

  return (
    <Layout onNavigate={onNavigate} pageTitle={t('paymentRequestDetail')} breadcrumbItems={breadcrumbItems}>
      <div className="d-flex flex-column gap-3">
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white">
            <h5 className="mb-0">{t('paymentSummary')}</h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              {[{
                label: t('totalPaid'),
                value: formatCurrency(paymentInfo.totalPaid),
              },
              {
                label: t('latePeriods'),
                value: paymentInfo.latePeriods,
              },
              {
                label: t('lateFeeTotal'),
                value: formatCurrency(paymentInfo.lateFeeTotal),
              },
              {
                label: t('accumulatedFees'),
                value: formatCurrency(paymentInfo.accumulatedFees),
              },
              {
                label: t('pendingPayment'),
                value: formatCurrency(paymentInfo.pendingPayment),
              }].map((item) => (
                <div className="col-12 col-sm-6 col-lg" key={item.label}>
                  <div className="bg-light rounded-3 p-3 h-100">
                    <div className="text-muted small mb-1">{item.label}</div>
                    <div className="fs-5 fw-semibold">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-0">
          <div className="card-header bg-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">{t('studentInformation')}</h5>
          </div>
          <div className="card-body">
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: 56, height: 56 }}>
                <span className="fw-semibold">{student.full_name?.charAt(0) ?? 'S'}</span>
              </div>
              <div className="flex-grow-1">
                <h6 className="mb-1">{student.full_name}</h6>
                <small className="text-muted">{groupLabel}</small>
              </div>
            </div>
            <div className="row mt-4">
              <div className="col-md-6 mb-3 mb-md-0">
                <span className="text-sm text-gray-500">{t('email')}</span>
                {student.email ? (
                  <a className="d-flex align-items-center btn btn-link p-0 align-items-center link-secondary" href={`mailto:${student.email}`}>
                    <svg className="emailIcon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm0 2v.01L12 13l8-5.99V7H4zm0 10h16V9.24l-7.553 5.65a1 1 0 0 1-1.194 0L4 9.24V17z"></path></svg>
                    {student.email}
                  </a>
                ) : (
                  <span className="text-sm text-gray-500">{t('noInformation')}</span>
                )}
              </div>
              <div className="col-md-6">
                <div className="d-flex flex-column align-items-start">
                  <span className="text-sm text-gray-500">{t('phone')}</span>
                  {student.phone_number ? (
                    <span className="text-sm text-gray-500">{student.phone_number}</span>
                  ) : (
                    <span className="text-sm text-gray-500">{t('noInformation')}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-0">
          <div className="d-flex align-items-center justify-content-between card-header bg-white">
            <h5 className="mb-0">{t('paymentInformation')}</h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-3">
                <div className="text-muted small mb-1">{t('paymentRequestDetail')}</div>
                <div className="fw-semibold">#{paymentRequest.payment_request_id}</div>
              </div>
              <div className="col-md-3">
                <div className="text-muted small mb-1">{t('amount')}</div>
                <div className="fw-semibold">{formatCurrency(paymentRequest.pr_amount)}</div>
              </div>
              <div className="col-md-3">
                <div className="text-muted small mb-1">{t('due_date')}</div>
                <div className="fw-semibold">
                  {formatDate(paymentRequest.pr_pay_by, locale, { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
              </div>
              <div className="col-md-3">
                <div className="text-muted small mb-1">{t('status')}</div>
                <small className={'cell-chip px-4 text-nowrap ' + (paymentRequest.payment_status_id === 3 ? 'bg-success' : paymentRequest.payment_status_id === 1 ? 'bg-warning' : 'bg-danger')}>
                  {paymentRequest.ps_pr_name}
                </small>
              </div>
              <div className="col-md-3">
                <div className="text-muted small mb-1">{t('paymentType')}</div>
                <div className="fw-semibold">{paymentRequest.pt_name}</div>
              </div>
              <div className="col-md-3">
                <div className="text-muted small mb-1">{t('lateFeeTotal')}</div>
                <div className="fw-semibold">{formatCurrency(paymentRequest.late_fee)}</div>
              </div>
              <div className="col-md-3">
                <div className="text-muted small mb-1">{t('partialPayment')}</div>
                <div className="fw-semibold">{paymentRequest.partial_payment_transformed}</div>
              </div>
              <div className="col-md-12">
                <div className="text-muted small mb-1">{t('comments')}</div>
                <div className="fw-semibold">{commentsText}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-0">
          <div className="card-header bg-white">
            <h5 className="mb-0">{t('paymentsList')}</h5>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th scope="col">ID</th>
                    <th scope="col">{t('paymentType')}</th>
                    <th scope="col">{t('status')}</th>
                    <th scope="col">{t('paymentDate')}</th>
                    <th scope="col">{t('amount')}</th>
                    <th scope="col">{t('comments')}</th>
                    <th scope="col">{t('viewDetails')}</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center text-muted py-4">
                        {t('tableNoData')}
                      </td>
                    </tr>
                  ) : (
                    payments.map((payment) => (
                      <tr key={payment.payment_id}>
                        <td className="fw-semibold">{payment.payment_id}</td>
                        <td>{payment.pt_name}</td>
                        <td>
                          <small className={'cell-chip px-3 text-nowrap ' + (payment.payment_status_id === 3 ? 'bg-success' : payment.payment_status_id === 1 ? 'bg-warning' : 'bg-danger')}>
                            {payment.payment_status_name}
                          </small>
                        </td>
                        <td>{formatDate(payment.payment_date, locale, { dateStyle: 'medium', timeStyle: 'short' })}</td>
                        <td className="fw-semibold">{formatCurrency(payment.amount)}</td>
                        <td>{payment.comments ?? '—'}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-link p-0"
                            onClick={() => onNavigate(`/${locale}/finance/payments/${payment.payment_id}`)}
                          >
                            {t('viewDetails')}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-0">
          <div className="card-header bg-white border-0 pb-0">
            <div className="d-flex align-items-center gap-3">
              <button
                type="button"
                className={`btn btn-link text-decoration-none px-0 ${activeTab === 'breakdown' ? 'fw-semibold' : 'text-muted'}`}
                onClick={() => setActiveTab('breakdown')}
              >
                {t('breakdownTab')}
              </button>
              <button
                type="button"
                className={`btn btn-link text-decoration-none px-0 ${activeTab === 'activity' ? 'fw-semibold' : 'text-muted'}`}
                onClick={() => setActiveTab('activity')}
              >
                {t('activityAndComments')}
              </button>
            </div>
          </div>

          <div className="card-body">
            {activeTab === 'breakdown' ? (
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th scope="col">ID</th>
                      <th scope="col">{t('paymentType')}</th>
                      <th scope="col">{t('status')}</th>
                      <th scope="col">{t('paymentDate')}</th>
                      <th scope="col">{t('amount')}</th>
                      <th scope="col">{t('balance')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdown.map((entry, index) => (
                      <tr key={`${entry.type}-${entry.date}-${index}`}>
                        <td>{entry.payment_id ?? '—'}</td>
                        <td className="fw-semibold">{conceptLabel(entry.type)}</td>
                        <td>{entry.status_name ?? '—'}</td>
                        <td>{formatDate(entry.date, locale, { dateStyle: 'medium', timeStyle: 'short' })}</td>
                        <td className={entry.amount < 0 ? 'text-danger fw-semibold' : 'text-success fw-semibold'}>
                          {formatCurrency(entry.amount)}
                        </td>
                        <td className={entry.balance < 0 ? 'text-danger fw-semibold' : 'text-success fw-semibold'}>
                          {formatCurrency(entry.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="d-flex flex-column gap-4">
                <div className="card shadow-none bg-light bg-gradient mb-0">
                  <div className="card-header bg-transparent">
                    <h3 className="mb-0">{t('comments')}</h3>
                  </div>
                  <div className="card-body">
                    {logsError ? (
                      <div className="alert alert-danger" role="alert">
                        {logsError}
                      </div>
                    ) : logsLoading ? (
                      <LoadingSkeleton variant="table" rowCount={4} />
                    ) : (
                      <div className="list-group list-group-flush">
                        <div className="list-group-item bg-transparent px-0">
                          <div className="mb-3">
                            <span className="fw-medium">{commentsText}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card shadow-none bg-light bg-gradient mb-0">
                  <div className="card-header bg-transparent">
                    <h3 className="mb-0">{t('activityLog')}</h3>
                  </div>
                  <div className="card-body">
                    {logsError ? (
                      <div className="alert alert-danger" role="alert">
                        {logsError}
                      </div>
                    ) : logsLoading ? (
                      <LoadingSkeleton variant="table" rowCount={4} />
                    ) : logs.length === 0 ? (
                      <p className="text-muted mb-0">{t('noLogs')}</p>
                    ) : (
                      <div className="list-group list-group-flush">
                        {logs.map((log, index) => (
                          <div key={`${log.updated_at}-${index}`} className="list-group-item bg-transparent px-0">
                            <div className="d-flex justify-content-between align-items-start">
                              <div className='d-flex align-items-center gap-2'>
                                <div className="fw-semibold">{log.responsable_full_name}</div>
                                <div className="text-muted small">{log.role_name}</div>
                              </div>
                              <div className="text-muted small">
                                {formatDate(log.updated_at, locale, { dateStyle: 'medium', timeStyle: 'short' })}
                              </div>
                            </div>
                            <div className="mt-2">
                              <div className="fw-semibold mb-1">{log.log_type_name}</div>
                              <ul className="log-entry mb-0 ps-3 small text-muted">
                                {log.changes?.map((change, changeIndex) => (
                                  <li key={`${change.field}-${changeIndex}`}>
                                    <span className="fw-semibold">{change.field ?? t('noInformation')}</span>
                                    : {change.from ?? '—'} → {change.to ?? '—'}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
