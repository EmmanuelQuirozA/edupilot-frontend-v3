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
import { Tabs } from '../StudentsDetailPage/components/Tabs'
import StudentTableCell from '../../components/ui/StudentTableCell';
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

type TabKey = 'executionLogs' | 'logs'
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
  const [activeTab, setActiveTab] = useState<TabKey>('executionLogs')

  const [requestDetail, setRequestDetail] = useState<PaymentRequestScheduleDetail | null>(null)
  const [logs, setLogs] = useState<ScheduledLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [logsLoading, setLogsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logsError, setLogsError] = useState<string | null>(null)
  const [expandedLog, setExpandedLog] = useState<number | null>(null)

  const currencyFormatter = useMemo(() => createCurrencyFormatter(locale, 'MXN'), [locale])

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

  const formatCurrency = (value: number | null | undefined) =>
  (value ?? 0).toLocaleString(
    locale === 'es' ? 'es-MX' : 'en-US',
    { style: 'currency', currency: 'MXN' }
  );
  
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
      <div className="d-flex flex-column gap-3">
        <span className="fw-semibold">{label}</span>
        <div className="d-flex flex-column gap-3">
          {entries.map((entry, index) => (
            <div
              key={`${label}-${entry.payment_request_id ?? index}`}
              className="border rounded-3 p-3 d-flex flex-column gap-2"
            >
              <div className="d-flex justify-content-between flex-wrap gap-2 align-items-center">
                <StudentTableCell
                  name={entry.full_name}
                  fallbackName={t('noInformation')}
                  gradeGroup={entry.grade_group || undefined}
                  scholarLevel={entry.scholar_level || undefined}
                  enrollment={entry.register_id || undefined}
                  avatarFallback={entry.register_id}
                  className="flex-grow-1"
                />

                {entry.payment_request_id ? (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => onNavigate(`/${locale}/finance/request/${entry.payment_request_id}`)}
                  >
                    {t('viewDetails')}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderLogCard = (log: ScheduledLogEntry, index: number, forceExpanded = false) => {
    const isExpanded = forceExpanded || expandedLog === index
    const variant = getLogVariant(log)

    const toggleButton = forceExpanded ? null : (
      <div className="d-flex justify-content-end">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-chevron-right" viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708"/>
        </svg>
      </div>
    )

    return (
      <div key={`${log.reference_date}-${index}`} className="card shadow-sm border-0">
        <div className="card-body d-flex flex-column gap-3">
          <div className="d-flex flex-wrap gap-3 align-items-start justify-content-between">
            <div className="d-flex gap-2 align-items-center">
              <Badge label={log.type ? log.type.toUpperCase() : t('status')} variant={variant} />
              <div className="d-flex flex-column">
                <span className="fw-semibold">{log.title || t('noInformation')}</span>
                <span className="text-muted">{log.message || t('noInformation')}</span>
              </div>
            </div>
            <div className="row gap-4">
              <DetailRow
                label={t('referenceDate')}
                value={formatDate(log.reference_date, locale, { year: 'numeric', month: 'short', day: '2-digit' })}
              />
              <DetailRow label={t('createdCount')} value={log.created_count ?? 0} />
              <DetailRow label={t('duplicateCount')} value={log.duplicate_count ?? 0} />
            </div>
          </div>

          {toggleButton}

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
                <div key={`rules-${ruleIndex}`} className="d-flex flex-column gap-4">
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

  const normalizeLogType = (value) => {
    if (!value) {
      return 'neutral';
    }

    const normalized = String(value).toLowerCase();
    if (normalized === 'success') {
      return 'success';
    }

    if (normalized === 'warning') {
      return 'warning';
    }

    return 'neutral';
  };

  const tagClassName = {
    success: 'schedule-detail__tag schedule-detail__tag--success',
    warning: 'schedule-detail__tag schedule-detail__tag--warning',
    neutral: 'schedule-detail__tag schedule-detail__tag--neutral',
  };



  const renderLogStudents = (title, list = []) => {
    if (!list || list.length === 0) {
      return null;
    }

    return (
      <div className="schedule-detail__log-section">
        <h4>{title}</h4>
        {list.map((student, index) => {
          const studentId = student?.student_id;
          const requestId = student?.payment_request_id;
          const meta = student?.grade_group ?? student?.register_id ?? '';
          const rowKey = `${title}-${requestId ?? studentId ?? index}`;

          return (
            <div key={rowKey} className="schedule-detail__student-row">
              <StudentTableCell
                name={student?.full_name}
                metaValue={meta}
                onClick={studentId ? () => onStudentDetail?.(studentId) : undefined}
                avatarText={getInitials(student?.full_name)}
                nameButtonProps={{ 'aria-label': student?.full_name ?? mergedStrings.viewStudent }}
              />
              <div
                type="button"
                size="sm"
                variant="secondary"
                onClick={requestId ? () => onPaymentRequestDetail?.(requestId) : undefined}
                disabled={!requestId}
                aria-label={mergedStrings.viewRequest}
              >
                {mergedStrings.viewRequest}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderLogs = () => {
    if (logsLoading) {
      return <p className="schedule-detail__subtitle">{t('loading')}</p>;
    }

    if (logsError) {
      return <p className="schedule-detail__subtitle">{t('logsError')}</p>;
    }

    return (
      <ul className="schedule-detail__logs-list">
        {logs.map((log, index) => {
          const logType = normalizeLogType(log?.type);
          const createdList = log?.rules?.[0]?.created ?? [];
          const duplicateList = log?.rules?.[0]?.Duplicated ?? [];
          const referenceDateLabel = formatDate(log?.reference_date, locale);
          const summaryLabel = `${t('referenceDate')}: ${referenceDateLabel || '—'}`;

          return (
            <li key={`${log.reference_date ?? 'log'}-${index}`} className="schedule-detail__log">
              <details>
                <summary className='justify-content-between'>
                  <div className='d-flex align-items-center gap-md-4'>
                    <span className={tagClassName[logType]}>{t('logType')}</span>
                    <div>
                      <strong>{log?.title || t('logsTitle')}</strong>
                      <p className="mb-0 schedule-detail__subtitle">{log?.message || summaryLabel}</p>
                      <div className="schedule-detail__log-meta">
                        {referenceDateLabel ? (
                          <span>
                            {t('referenceDate')}: <strong>{referenceDateLabel}</strong>
                          </span>
                        ) : null}
                        {log?.created_count != null ? (
                          <span>
                            {t('created')}: <strong>{log.created_count}</strong>
                          </span>
                        ) : null}
                        {log?.duplicate_count != null ? (
                          <span>
                            {t('duplicates')}: <strong>{log.duplicate_count}</strong>
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-chevron-right" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708"/>
                  </svg>
                </summary>
                <div className="schedule-detail__log-body">
                  {log?.schedule ? (
                    <div className="schedule-detail__log-section">
                      <h4>{t('schedule')}</h4>
                      <div className="schedule-detail__log-meta">
                        <span>
                          {t('concept')}: <strong>{log.schedule?.concept ?? '—'}</strong>
                        </span>
                        <span>
                          {t('amount')}:{' '}
                          <strong>{formatCurrency(log.schedule?.amount) || '—'}</strong>
                        </span>
                        {log.schedule?.next_execution_date ? (
                          <span>
                            {t('nextExecutionDate')}:{' '}
                            <strong>
                              {formatDate(log.schedule.next_execution_date, locale) || '—'}
                            </strong>
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  {renderLogStudents(t('createdRequests'), createdList)}
                  {renderLogStudents(t('duplicatedRequests'), duplicateList)}
                </div>
              </details>
            </li>
          );
        })}
      </ul>
    );
  };

  const nextExecutionInPast = useMemo(() => {
    if (!requestDetail?.next_execution_date) return false
    return new Date(requestDetail.next_execution_date).getTime() < Date.now()
  }, [requestDetail?.next_execution_date])

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
      <>

        <div className="payment-schedule-detail d-flex flex-column gap-4">
          <div className="card shadow-sm border-0">
            <div className="card-body d-flex flex-column gap-3">
              <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap">
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex align-items-center gap-3 flex-wrap">
                    <div className='d-flex flex-column gap-2'>
                      <p className="text-uppercase text-muted small fw-semibold m-0">{t('scheduledTab')}</p>
                      <h2 className="mb-0 fw-bold">{requestDetail.rule_name}</h2>
                      <div>
                        <span
                          className={`pill-chip ${requestDetail.active ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}
                        >
                          {requestDetail.active ? t('active') : t('inactive')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn d-flex align-items-center gap-2 btn-edit text-muted fw-medium"
                    // onClick={handleEditPaymentClick}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-pencil" viewBox="0 0 16 16">
                      <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325"/>
                    </svg>
                    {t('edit')}
                  </button>

                  
                  <button
                    type="button"
                    className="btn d-flex align-items-center gap-2 btn-edit text-muted fw-medium"
                    // onClick={() => handleStatusUpdate(4)}
                    // disabled={isStatusUpdating}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-pause" viewBox="0 0 16 16">
                      <path d="M6 3.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5m4 0a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5"/>
                    </svg>
                    {t('pause')}
                  </button>

                </div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-md-8">
              <div className="card shadow-sm border-0 prsd-section-card h-100">
                <div className="card-header bg-light border-0 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <span className="prsd-icon-circle text-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-currency-dollar" viewBox="0 0 16 16">
                        <path d="M4 10.781c.148 1.667 1.513 2.85 3.591 3.003V15h1.043v-1.216c2.27-.179 3.678-1.438 3.678-3.3 0-1.59-.947-2.51-2.956-3.028l-.722-.187V3.467c1.122.11 1.879.714 2.07 1.616h1.47c-.166-1.6-1.54-2.748-3.54-2.875V1H7.591v1.233c-1.939.23-3.27 1.472-3.27 3.156 0 1.454.966 2.483 2.661 2.917l.61.162v4.031c-1.149-.17-1.94-.8-2.131-1.718zm3.391-3.836c-1.043-.263-1.6-.825-1.6-1.616 0-.944.704-1.641 1.8-1.828v3.495l-.2-.05zm1.591 1.872c1.287.323 1.852.859 1.852 1.769 0 1.097-.826 1.828-2.2 1.939V8.73z"/>
                      </svg>
                    </span>
                    <h5 className="mb-0">{t('financialConfiguration')}</h5>
                  </div>
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
                          <div className="prsd-icon-circle bg-warning-subtle text-warning">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-clock" viewBox="0 0 16 16">
                              <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z"/>
                              <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0"/>
                            </svg>
                          </div>
                          <div className="d-flex flex-column gap-1">
                            <p className="text-warning fw-semibold mb-0">{t('lateFeeCharge')}</p>
                            <p className="fs-4 fw-bold text-dark mb-0">{currencyFormatter.format(requestDetail.late_fee)}</p>
                            <p className="text-muted small mb-0">{t('late_fee_frequency')+': '+requestDetail.late_fee_frequency || requestDetail.fee_type || t('noInformation')}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="prsd-note mt-4">
                    <span className="fw-semibold text-dark me-2">{t('comments')}:</span>
                    <span className="text-muted">{requestDetail.comments || t('noInformation')}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card prsd-schedule-card text-white h-100">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <span className="prsd-icon-circle bg-white text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-calendar" viewBox="0 0 16 16">
                      <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z"/>
                    </svg>
                  </span>
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
            </div>

            <div className="col-6">
              <div className="card shadow-sm border-0 prsd-section-card  h-100">
                <div className="card-header bg-light border-0 d-flex align-items-center gap-2">
                  <span className="prsd-icon-circle bg-primary-subtle text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-bullseye" viewBox="0 0 16 16">
                      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                      <path d="M8 13A5 5 0 1 1 8 3a5 5 0 0 1 0 10m0 1A6 6 0 1 0 8 2a6 6 0 0 0 0 12"/>
                      <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6m0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8"/>
                      <path d="M9.5 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>
                    </svg>
                  </span>
                  <h5 className="mb-0">{t('assignment')}</h5>
                </div>
                <div className="card-body d-flex align-items-center justify-content-between flex-wrap gap-3">
                  {requestDetail.student_detail ? (
                    <StudentTableCell
                      name={requestDetail.student_detail.full_name}
                      gradeGroup={requestDetail.student_detail.grade_group || undefined}
                      scholarLevel={requestDetail.student_detail.scholar_level || undefined}
                      enrollment={requestDetail.student_detail.register_id || undefined}
                      avatarFallback={requestDetail.student_detail.register_id || 'PR'}
                      className="flex-grow-1"
                    />
                  ) : (
                    <div className="d-flex align-items-center gap-3">
                      <div className="prsd-avatar">{requestDetail.group_detail?.group || requestDetail.school_detail?.school_name?.charAt(0) || 'PR'}</div>
                      <div>
                        <p className="text-muted small mb-1">{requestDetail.group_detail ? t('assignedGroup') : t('schoolsTitle')}</p>
                        <h5 className="mb-0">{
                          requestDetail.group_detail
                            ? `${requestDetail.group_detail.grade ?? ''}° ${requestDetail.group_detail.group ?? ''}`.trim()
                            : requestDetail.school_detail?.school_name || t('noInformation')
                        }</h5>
                        <p className="text-muted small mb-0">
                          {
                            requestDetail.group_detail?.generation ||
                            requestDetail.school_detail?.scholar_level ||
                            t('noInformation')
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-6">
              <div className="card shadow-sm border-0 prsd-section-card  h-100">
                <div className="card-body d-flex flex-column gap-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <h6 className="mb-0">{t('chargeConditions')}</h6>
                  </div>
                  <div>
                    <div className="d-flex align-items-center justify-content-between text-muted small">
                      <span>{t('paymentWindow')}</span>
                      <span className="text-dark fw-semibold">{requestDetail.payment_window} {t('days')}</span>
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
            </div>
          </div>
        </div>
        
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as TabKey)}
          items={[
            {
              key: 'executionLogs',
              label: t('recentExecutions'),
              content: (
                <div className="d-flex flex-column gap-3">
                  {logsError ? (
                    <div className="alert alert-danger" role="alert">
                      {logsError}
                    </div>
                  ) : null}

                  {logsLoading ? (
                    <LoadingSkeleton variant="table" rowCount={3} />
                  ) : logs.length === 0 ? (
                    <div className="alert alert-light border" role="alert">
                      {t('noResultsAvailable')}
                    </div>
                  ) : (
                    <div className='d-flex flex-column gap-3'>
                      <div className="card">
                        {renderLogs()}
                      </div>
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: 'logs',
              label: t('requests'),
              content: (
                <div className="d-flex flex-column gap-3">
                </div>
              ),
            },
          ]}
        />
      </>
      ) : null}
    </Layout>
  )
}
