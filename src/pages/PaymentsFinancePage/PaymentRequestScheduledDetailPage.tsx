import { useCallback, useEffect, useMemo, useState } from 'react'
import { Layout } from '../../layout/Layout'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import type { BreadcrumbItem } from '../../components/Breadcrumb'
import { LoadingSkeleton } from '../../components/LoadingSkeleton'
import { NoPermission } from '../../components/NoPermission'
import { API_BASE_URL } from '../../config'
import { formatDate } from '../../utils/formatDate'
import { useModulePermissions } from '../../hooks/useModulePermissions'
import { createCurrencyFormatter } from '../../utils/currencyFormatter'
import './PaymentRequestScheduledDetailPage.css'

interface PaymentRequestScheduledDetailPageProps {
  onNavigate: (path: string) => void
  paymentRequestScheduledId: number
}

interface GroupDetail {
  grade: string | null
  group: string | null
  group_id: number | null
  school_id: number | null
  generation: string | null
  scholar_level: string | null
  school_name?: string | null
}

interface StudentDetail {
  full_name: string
  student_id: number
  register_id: string | null
  grade_group?: string | null
  scholar_level?: string | null
  generation?: string | null
}

interface SchoolDetail {
  school_id: number
  school_name: string
  scholar_level?: string | null
}

interface PaymentRequestScheduleDetail {
  active: number
  amount: number
  comments: string | null
  end_date: string | null
  fee_type: string
  group_id: number | null
  late_fee: number
  rule_name: string
  school_id: number | null
  created_at: string
  start_date: string
  student_id: number | null
  updated_at: string
  period_name: string
  group_detail: GroupDetail | null
  school_detail: SchoolDetail | null
  interval_count: string
  payment_window: number
  student_detail: StudentDetail | null
  payment_concept: string
  last_executed_at: string | null
  period_of_time_id: number
  late_fee_frequency: string
  payment_concept_id: number
  next_execution_date: string
  payment_request_scheduled_id: number
}

interface ScheduleInfoLog {
  active: number
  amount: number
  concept: string
  end_date: string | null
  rule_name: string
  start_date: string
  next_execution_date: string
  period_of_time_name: string
}

interface RuleLogEntry {
  full_name?: string
  generation?: string
  student_id?: number
  grade_group?: string
  register_id?: string
  scholar_level?: string
  payment_request_id?: number
}

interface RuleLog {
  created: RuleLogEntry[] | null
  Duplicated: RuleLogEntry[] | null
}

interface ScheduledLogEntry {
  type: string | null
  rules: RuleLog[]
  title: string | null
  message: string | null
  success: boolean | null
  group_id: number | null
  schedule: ScheduleInfoLog
  school_id: number | null
  student_id: number | null
  mass_upload: number | null
  group_detail: GroupDetail | null
  created_count: number | null
  school_detail: SchoolDetail | null
  reference_date: string
  student_detail: StudentDetail | null
  duplicate_count: number | null
  payment_request_scheduled_id: number
}

function DetailRow({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="col-md-3">
      <div className="text-muted small mb-1">{label}</div>
      <div className="fw-semibold">{value ?? '-'}</div>
    </div>
  )
}

type BadgeVariant = 'success' | 'warning' | 'danger' | 'secondary'

function Badge({ label, variant }: { label: string; variant: BadgeVariant }) {
  const variants: Record<BadgeVariant, string> = {
    success: 'bg-success',
    warning: 'bg-warning text-dark',
    danger: 'bg-danger',
    secondary: 'bg-secondary',
  }

  return <span className={`badge ${variants[variant]}`}>{label}</span>
}

export function PaymentRequestScheduledDetailPage({
  onNavigate,
  paymentRequestScheduledId,
}: PaymentRequestScheduledDetailPageProps) {
  const { t, locale } = useLanguage()
  const { token } = useAuth()
  const { permissions, loading: permissionsLoading, error: permissionsError, loaded: permissionsLoaded } = useModulePermissions('payments')

  const [requestDetail, setRequestDetail] = useState<PaymentRequestScheduleDetail | null>(null)
  const [logs, setLogs] = useState<ScheduledLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [logsLoading, setLogsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logsError, setLogsError] = useState<string | null>(null)
  const [expandedLog, setExpandedLog] = useState<number | null>(null)

  const currencyFormatter = useMemo(() => createCurrencyFormatter(locale, 'MXN'), [locale])

  const formatFullDate = useCallback(
    (value: string | null, fallback?: string) => {
      if (!value) return fallback ?? t('noInformation')
      return formatDate(value, locale, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    },
    [locale, t],
  )

  const breadcrumbItems: BreadcrumbItem[] = useMemo(
    () => [
      {
        label: t('portalTitle'),
        onClick: () => onNavigate(`/${locale}`),
      },
      {
        label: t('paymentsFinance'),
        onClick: () => onNavigate(`/${locale}/finance`),
      },
      {
        label: t('scheduledTab'),
        onClick: () => onNavigate(`/${locale}/finance/request`),
      },
      { label: `${t('scheduledTab')} #${paymentRequestScheduledId}` },
    ],
    [locale, onNavigate, paymentRequestScheduledId, t],
  )

  const fetchScheduleDetail = useCallback(
    async (signal?: AbortSignal) => {
      if (!token || !permissionsLoaded || !permissions?.readAllowed) return

      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          payment_request_scheduled_id: String(paymentRequestScheduledId),
          lang: locale,
        })

        const response = await fetch(`${API_BASE_URL}/payment-requests/schedule/details?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const json = await response.json()
        setRequestDetail(json ?? null)
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          setError(t('defaultError'))
        }
      } finally {
        if (!signal || !signal.aborted) {
          setIsLoading(false)
        }
      }
    },
    [locale, paymentRequestScheduledId, permissions?.readAllowed, permissionsLoaded, t, token],
  )

  const fetchLogs = useCallback(
    async (signal?: AbortSignal) => {
      if (!token || !permissionsLoaded || !permissions?.readAllowed) return

      setLogsLoading(true)
      setLogsError(null)
      try {
        const params = new URLSearchParams({
          lang: locale,
          payment_request_scheduled_id: String(paymentRequestScheduledId),
        })

        const response = await fetch(`${API_BASE_URL}/logs/scheduled-jobs?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal,
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
        if (!signal || !signal.aborted) {
          setLogsLoading(false)
        }
      }
    },
    [locale, paymentRequestScheduledId, permissions?.readAllowed, permissionsLoaded, t, token],
  )

  useEffect(() => {
    const controller = new AbortController()
    fetchScheduleDetail(controller.signal)
    return () => controller.abort()
  }, [fetchScheduleDetail])

  useEffect(() => {
    const controller = new AbortController()
    fetchLogs(controller.signal)
    return () => controller.abort()
  }, [fetchLogs])

  const getLogVariant = (log: ScheduledLogEntry): 'success' | 'warning' | 'danger' | 'secondary' => {
    if (log.type === 'warning') return 'warning'
    if (log.type === 'success' || log.success === true) return 'success'
    if (log.success === false) return 'danger'
    return 'secondary'
  }

  const renderRuleList = (label: string, entries: RuleLogEntry[] | null) => {
    if (!entries || entries.length === 0) return null

    return (
      <div className="d-flex flex-column gap-2">
        <span className="fw-semibold">{label}</span>
        <div className="d-flex flex-column gap-2">
          {entries.map((entry, index) => (
            <div key={`${label}-${entry.payment_request_id ?? index}`} className="border rounded p-3 d-flex flex-column gap-1">
              <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between">
                <div className="d-flex flex-column">
                  <span className="fw-semibold">{entry.full_name ?? t('noInformation')}</span>
                  <span className="text-muted small">
                    {[entry.grade_group, entry.scholar_level, entry.generation].filter(Boolean).join(' · ') || t('noInformation')}
                  </span>
                </div>
                {entry.register_id ? <span className="badge bg-light text-dark">{entry.register_id}</span> : null}
              </div>
              {entry.payment_request_id ? (
            <div className="d-flex justify-content-end">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => onNavigate(`/${locale}/finance/request/${entry.payment_request_id}`)}
                  >
                    {t('viewDetails')}
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderLogCard = (log: ScheduledLogEntry, index: number) => {
    const isExpanded = expandedLog === index
    const variant = getLogVariant(log)

    return (
      <div key={`${log.reference_date}-${index}`} className="card shadow-sm border-0">
        <div className="card-body d-flex flex-column gap-3">
          <div className="d-flex flex-wrap gap-3 align-items-start justify-content-between">
              <div className="d-flex gap-2 align-items-center">
                <Badge
                  label={log.type ? log.type.toUpperCase() : t('status')}
                  variant={variant}
                />
                <div className="d-flex flex-column">
                  <span className="fw-semibold">{log.title || t('noInformation')}</span>
                  <span className="text-muted">{log.message || t('noInformation')}</span>
                </div>
              </div>
              <div className="d-flex flex-wrap gap-4">
                <DetailRow
                  label={t('referenceDate')}
                  value={formatDate(log.reference_date, locale, { year: 'numeric', month: 'short', day: '2-digit' })}
                />
                <DetailRow label={t('createdCount')} value={log.created_count ?? 0} />
                <DetailRow label={t('duplicateCount')} value={log.duplicate_count ?? 0} />
              </div>
            </div>

          <div className="d-flex justify-content-end">
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={() => setExpandedLog(isExpanded ? null : index)}
            >
              {isExpanded ? t('close') : t('viewDetails')}
            </button>
          </div>

          {isExpanded ? (
            <div className="border-top pt-3 d-flex flex-column gap-3">
              <div className="d-flex flex-wrap gap-4">
                <DetailRow label={t('concept')} value={log.schedule.concept}
                />
                <DetailRow label={t('amount')} value={currencyFormatter.format(log.schedule.amount ?? 0)} />
                <DetailRow
                  label={t('paymentDate')}
                  value={formatDate(log.schedule.start_date, locale, { year: 'numeric', month: 'short', day: '2-digit' })}
                />
                <DetailRow
                  label={t('nextExecution')}
                  value={formatDate(log.schedule.next_execution_date, locale, { year: 'numeric', month: 'short', day: '2-digit' })}
                />
                <DetailRow label={t('periodicity')} value={log.schedule.period_of_time_name} />
              </div>

              {log.rules?.map((rule, ruleIndex) => (
                <div key={`rules-${ruleIndex}`} className="d-flex flex-column gap-3">
                  {renderRuleList(t('createdRequests'), rule.created)}
                  {renderRuleList(t('duplicates'), rule.Duplicated)}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  const nextExecutionInPast = useMemo(() => {
    if (!requestDetail?.next_execution_date) return false
    return new Date(requestDetail.next_execution_date).getTime() < Date.now()
  }, [requestDetail?.next_execution_date])

  const paymentWindowProgress = useMemo(() => {
    if (!requestDetail?.payment_window) return 0
    return Math.min(100, Math.max(0, Math.round((requestDetail.payment_window / 30) * 100)))
  }, [requestDetail?.payment_window])

  if (permissionsLoading) {
    return (
      <Layout onNavigate={onNavigate} pageTitle={t('paymentsFinance')}>
        <LoadingSkeleton variant="dashboard" cardCount={8} />
      </Layout>
    )
  }

  if (permissionsError || !permissions?.readAllowed) {
    return (
      <Layout onNavigate={onNavigate} pageTitle={t('paymentsFinance')}>
        <NoPermission />
      </Layout>
    )
  }

  return (
    <Layout onNavigate={onNavigate} pageTitle={`${t('scheduledTab')} #${paymentRequestScheduledId}`} breadcrumbItems={breadcrumbItems}>
      {isLoading ? (
        <LoadingSkeleton variant="dashboard" cardCount={6} />
      ) : error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : requestDetail ? (
        <div className="payment-schedule-detail d-flex flex-column gap-4">
          <div className="card shadow-sm border-0 prsd-hero-card">
            <div className="card-body d-flex flex-column gap-3">
              <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap">
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex align-items-center gap-2 text-muted small prsd-breadcrumbs">
                    <span className="fw-semibold">{t('paymentsFinance')}</span>
                    <span className="text-muted">/</span>
                    <span className="fw-semibold">{t('scheduledTab')}</span>
                    <span className="text-muted">/</span>
                    <span className="text-dark fw-semibold">#{requestDetail.payment_request_scheduled_id}</span>
                  </div>
                  <div className="d-flex align-items-center gap-3 flex-wrap">
                    <div>
                      <p className="text-uppercase text-muted small fw-semibold mb-1">{t('scheduledTab')}</p>
                      <h2 className="mb-0 fw-bold">{requestDetail.rule_name}</h2>
                    </div>
                    <span
                      className={`badge rounded-pill px-3 py-2 prsd-status-badge ${requestDetail.active ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}
                    >
                      <span className={`status-dot ${requestDetail.active ? 'bg-success' : 'bg-secondary'}`} />
                      {requestDetail.active ? t('active') : t('inactive')}
                    </span>
                  </div>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  <button type="button" className="btn btn-light prsd-action-btn">
                    <span className="me-2">⏸️</span>
                    {t('pause')}
                  </button>
                  <button type="button" className="btn btn-primary prsd-action-btn">
                    <span className="me-2">✏️</span>
                    {t('editRule')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-12 col-lg-8 d-flex flex-column gap-4">
              <div className="card shadow-sm border-0 prsd-section-card">
                <div className="card-header bg-light border-0 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <span className="prsd-icon-circle text-primary">$</span>
                    <h5 className="mb-0">{t('financialConfiguration')}</h5>
                  </div>
                  <span className="badge text-bg-light text-primary">{requestDetail.payment_concept}</span>
                </div>
                <div className="card-body">
                  <div className="row g-4">
                    <div className="col-sm-6">
                      <p className="text-uppercase text-muted small fw-semibold mb-1">{t('baseAmount')}</p>
                      <div className="d-flex align-items-baseline gap-2">
                        <span className="display-6 fw-bold text-dark">{currencyFormatter.format(requestDetail.amount)}</span>
                      </div>
                      <p className="text-muted small mb-0">{t('concept')}: <span className="fw-semibold text-dark">{requestDetail.payment_concept}</span></p>
                    </div>
                    <div className="col-sm-6">
                      <div className="p-3 rounded-4 border prsd-warning-card h-100">
                        <div className="d-flex gap-3 align-items-start">
                          <div className="prsd-icon-circle bg-warning-subtle text-warning">⏰</div>
                          <div className="d-flex flex-column gap-1">
                            <p className="text-warning fw-semibold mb-0">{t('lateFeeCharge')}</p>
                            <p className="fs-4 fw-bold text-dark mb-0">{currencyFormatter.format(requestDetail.late_fee)}</p>
                            <p className="text-muted small mb-0">{requestDetail.late_fee_frequency || requestDetail.fee_type || t('noInformation')}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="prsd-note mt-4">
                    <span className="fw-semibold text-dark me-2">{t('internalNote')}:</span>
                    <span className="text-muted">{requestDetail.comments || t('noInformation')}</span>
                  </div>
                </div>
              </div>

              <div className="card shadow-sm border-0 prsd-section-card">
                <div className="card-header bg-light border-0 d-flex align-items-center gap-2">
                  <span className="prsd-icon-circle bg-primary-subtle text-primary">🎯</span>
                  <h5 className="mb-0">{t('assignment')}</h5>
                </div>
                <div className="card-body d-flex align-items-center justify-content-between flex-wrap gap-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className="prsd-avatar">{requestDetail.group_detail?.group || requestDetail.student_detail?.register_id || 'PR'}</div>
                    <div>
                      <p className="text-muted small mb-1">{requestDetail.student_detail ? t('student') : requestDetail.group_detail ? t('assignedGroup') : t('schoolsTitle')}</p>
                      <h5 className="mb-0">{
                        requestDetail.student_detail
                          ? requestDetail.student_detail.full_name
                          : requestDetail.group_detail
                            ? `${requestDetail.group_detail.grade ?? ''}° ${requestDetail.group_detail.group ?? ''}`.trim()
                            : requestDetail.school_detail?.school_name || t('noInformation')
                      }</h5>
                      <p className="text-muted small mb-0">
                        {
                          requestDetail.group_detail?.generation ||
                          requestDetail.student_detail?.generation ||
                          requestDetail.school_detail?.scholar_level ||
                          t('noInformation')
                        }
                      </p>
                    </div>
                  </div>
                  <button type="button" className="btn btn-link text-decoration-none fw-semibold text-primary">
                    {t('viewStudents')} ({logs[0]?.created_count ?? '—'})
                  </button>
                </div>
              </div>

              <div className="card shadow-sm border-0 prsd-section-card">
                <div className="card-header bg-white border-0 d-flex align-items-center justify-content-between">
                  <h6 className="mb-0 text-uppercase text-muted small fw-semibold">{t('recentExecutions')}</h6>
                  {logsLoading ? <span className="text-muted small">{t('tableLoading')}</span> : null}
                </div>
                {logsError ? (
                  <div className="alert alert-danger m-3" role="alert">
                    {logsError}
                  </div>
                ) : null}
                <div className="table-responsive">
                      <table className="table table-borderless align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th className="text-muted text-uppercase small">{t('date')}</th>
                            <th className="text-muted text-uppercase small">{t('status')}</th>
                            <th className="text-muted text-uppercase small text-end">{t('generatedRequests')}</th>
                          </tr>
                        </thead>
                    <tbody>
                      {logs.length === 0 && !logsLoading ? (
                        <tr>
                          <td colSpan={3} className="text-center text-muted py-4">
                            {t('noLogs')}
                          </td>
                        </tr>
                      ) : (
                        logs.slice(0, 5).map((log, index) => {
                          const variant = getLogVariant(log)
                          const variantClass: Record<BadgeVariant, string> = {
                            success: 'bg-success-subtle text-success',
                            warning: 'bg-warning-subtle text-dark',
                            danger: 'bg-danger-subtle text-danger',
                            secondary: 'bg-secondary-subtle text-secondary',
                          }

                          return (
                            <tr key={`${log.reference_date}-${index}`} className="border-top">
                              <td className="fw-semibold text-dark">
                                {formatFullDate(log.reference_date)}
                              </td>
                              <td>
                                <span className={`badge rounded-pill ${variantClass[variant]}`}>
                                  {log.type ? log.type.toUpperCase() : t('status')}
                                </span>
                              </td>
                              <td className="text-end text-muted">
                                  {log.created_count ?? 0} {t('requests')}
                                </td>
                              </tr>
                            )
                          })
                        )}
                    </tbody>
                  </table>
                </div>
                {logs.length ? (
                    <div className="p-3 border-top">
                      <div className="d-flex align-items-center justify-content-between">
                        <span className="text-muted small">{t('viewExecutionDetail')}</span>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => setExpandedLog(expandedLog === 0 ? null : 0)}
                        >
                        {expandedLog === 0 ? t('close') : t('viewDetails')}
                      </button>
                    </div>
                    {expandedLog === 0 ? <div className="mt-3">{renderLogCard(logs[0], 0)}</div> : null}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="col-12 col-lg-4 d-flex flex-column gap-4">
              <div className="prsd-schedule-card text-white rounded-4 shadow-sm">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <span className="prsd-icon-circle bg-white text-primary">📅</span>
                  <h5 className="mb-0 text-white">{t('schedule')}</h5>
                </div>
                <div className="d-flex flex-column gap-3">
                  <div>
                    <p className="text-uppercase small text-white-50 mb-1">{t('frequency')}</p>
                    <p className="fs-5 fw-semibold mb-0">{t('every')} {requestDetail.interval_count} {requestDetail.period_name}</p>
                  </div>
                  <div className="border-top border-white-25 pt-3">
                    <p className="text-uppercase small text-white-50 mb-1">{t('nextExecution')}</p>
                    <div className="d-flex align-items-center gap-2">
                      <span className="prsd-icon-circle bg-success text-white">➜</span>
                      <span className="fw-semibold">{formatDate(requestDetail.next_execution_date, locale, { year: 'numeric', month: 'short', day: '2-digit' })}</span>
                    </div>
                    {nextExecutionInPast ? (
                      <p className="text-warning small mt-1 d-flex align-items-center gap-1 mb-0">
                        ⚠️ {t('dateInPastPending')}
                      </p>
                    ) : null}
                  </div>
                  <div className="border-top border-white-25 pt-3">
                    <div className="row g-3">
                      <div className="col-6">
                        <p className="text-uppercase small text-white-50 mb-1">{t('start')}</p>
                        <p className="fw-semibold mb-0">{formatDate(requestDetail.start_date, locale, { year: 'numeric', month: 'short', day: '2-digit' })}</p>
                      </div>
                      <div className="col-6">
                        <p className="text-uppercase small text-white-50 mb-1">{t('end')}</p>
                        <p className="fw-semibold mb-0">{requestDetail.end_date ? formatDate(requestDetail.end_date, locale, { year: 'numeric', month: 'short', day: '2-digit' }) : t('undefinedEnd')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card shadow-sm border-0 prsd-section-card">
                <div className="card-body d-flex flex-column gap-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <h6 className="mb-0">{t('chargeConditions')}</h6>
                  </div>
                  <div>
                    <div className="d-flex align-items-center justify-content-between text-muted small">
                      <span>{t('paymentWindow')}</span>
                      <span className="text-dark fw-semibold">{requestDetail.payment_window} {t('days')}</span>
                    </div>
                    <div className="progress mt-2" role="progressbar" aria-label={t('paymentWindow')} aria-valuenow={paymentWindowProgress} aria-valuemin={0} aria-valuemax={100}>
                      <div className="progress-bar bg-primary" style={{ width: `${paymentWindowProgress}%` }} />
                    </div>
                    <p className="text-muted small text-end mb-0">{t('daysWithoutLateFee')}</p>
                  </div>
                  <div className="border-top pt-2 text-muted small d-flex flex-column gap-1">
                    <div className="d-flex justify-content-between">
                      <span>{t('createdShort')}</span>
                      <span>{formatDate(requestDetail.created_at, locale, { year: 'numeric', month: 'short', day: '2-digit' })}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>{t('lastUpdatedShort')}</span>
                      <span>{formatDate(requestDetail.updated_at, locale, { year: 'numeric', month: 'short', day: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              </div>

              <button type="button" className="btn btn-outline-danger rounded-4 py-3 fw-semibold prsd-danger-btn">
                🗑️ {t('deleteRule')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Layout>
  )
}
