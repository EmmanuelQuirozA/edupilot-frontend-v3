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

function TargetCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="card shadow-sm border-0 h-100">
      <div className="card-body d-flex flex-column gap-2">
        <span className="text-muted small text-uppercase fw-semibold">{title}</span>
        <span className="fw-semibold fs-5">{description}</span>
      </div>
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

  const renderTarget = () => {
    if (!requestDetail) return null

    if (requestDetail.student_detail) {
      const student = requestDetail.student_detail
      const labelParts = [student.full_name]
      if (student.register_id) labelParts.push(`ID: ${student.register_id}`)
      if (student.grade_group) labelParts.push(student.grade_group)
      return <TargetCard title={t('student')} description={labelParts.join(' · ')} />
    }

    if (requestDetail.group_detail) {
      const group = requestDetail.group_detail
      const details: string[] = []

      const gradeGroup = [group.grade, group.group].filter(Boolean).join('-')
      if (gradeGroup) {
        details.push(gradeGroup)
      }

      if (group.scholar_level) {
        details.push(group.scholar_level)
      }

      if (group.generation) {
        details.push(`${t('generation')}: ${group.generation}`)
      }

      const description = [group.school_name, ...details].filter(Boolean).join(' · ')

      return <TargetCard title={t('classes')} description={description || t('noInformation')} />
    }

    if (requestDetail.school_detail) {
      const school = requestDetail.school_detail
      const description = [school.school_name, school.scholar_level].filter(Boolean).join(' · ')
      return <TargetCard title={t('schoolsTitle')} description={description} />
    }

    return <TargetCard title={t('paymentsFinance')} description={t('noInformation')} />
  }

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
                label="Fecha de referencia"
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
                  label="Próxima ejecución"
                  value={formatDate(log.schedule.next_execution_date, locale, { year: 'numeric', month: 'short', day: '2-digit' })}
                />
                <DetailRow label="Periodicidad" value={log.schedule.period_of_time_name} />
              </div>

              {log.rules?.map((rule, ruleIndex) => (
                <div key={`rules-${ruleIndex}`} className="d-flex flex-column gap-3">
                  {renderRuleList('Solicitudes creadas', rule.created)}
                  {renderRuleList('Duplicados', rule.Duplicated)}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    )
  }

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
        <div className="d-flex flex-column gap-4">
          <div className="card">
            <div className="card-body">
              <div className="d-flex flex-wrap gap-3 align-items-center justify-content-between">
                <div className="d-flex flex-column">
                  <span className="text-muted text-uppercase small fw-semibold">{t('scheduledTab')}</span>
                  <h5> #{requestDetail.payment_request_scheduled_id} - {requestDetail.rule_name}</h5>
                </div>
                <Badge label={requestDetail.active ? 'Activa' : 'Inactiva'} variant={requestDetail.active ? 'success' : 'secondary'} />
              </div>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-12 col-lg-7">
              <div className="card shadow-sm border-0 h-100">
                <div className='d-flex align-items-center justify-content-between card-header border-bottom-0 bg-white'>
                  <h5>Programación</h5>
                </div>
                <div className="card-body d-flex flex-column gap-3">
                  <div className="d-flex flex-wrap gap-4">
                    <DetailRow label={t('concept')} value={requestDetail.payment_concept} />
                    <DetailRow
                      label="Inicio"
                      value={formatDate(requestDetail.start_date, locale, { year: 'numeric', month: 'short', day: '2-digit' })}
                    />
                    <DetailRow
                      label="Próxima ejecución"
                      value={formatDate(requestDetail.next_execution_date, locale, { year: 'numeric', month: 'short', day: '2-digit' })}
                    />
                    <DetailRow label="Periodicidad" value={`${requestDetail.period_name} (${requestDetail.interval_count})`} />
                    <DetailRow label="Ventana de pago (días)" value={requestDetail.payment_window} />
                    <DetailRow label={t('amount')} value={currencyFormatter.format(requestDetail.amount)} />
                    <DetailRow label={t('late_fee')} value={`${currencyFormatter.format(requestDetail.late_fee)} (${requestDetail.fee_type})`} />
                    <DetailRow label={t('comments')} value={requestDetail.comments || t('noInformation')} />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-5 d-flex flex-column gap-3">
              {renderTarget()}
              <div className="card shadow-sm border-0">
                <div className="card-body d-flex flex-wrap gap-4">
                  <DetailRow
                    label="Última ejecución"
                    value={requestDetail.last_executed_at ? formatDate(requestDetail.last_executed_at, locale, { year: 'numeric', month: 'short', day: '2-digit' }) : t('noInformation')}
                  />
                  <DetailRow label={t('created_at')} value={formatDate(requestDetail.created_at, locale, { year: 'numeric', month: 'short', day: '2-digit' })} />
                  <DetailRow label={t('updated_at')} value={formatDate(requestDetail.updated_at, locale, { year: 'numeric', month: 'short', day: '2-digit' })} />
                </div>
              </div>
            </div>
          </div>

          <div className="d-flex flex-column gap-3">
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex flex-column">
                <span className="text-muted small text-uppercase fw-semibold">Ejecuciones</span>
                <h3 className="h6 mb-0">Historial de ejecuciones</h3>
              </div>
              {logsLoading ? <span className="text-muted">{t('tableLoading')}</span> : null}
            </div>

            {logsError ? (
              <div className="alert alert-danger" role="alert">
                {logsError}
              </div>
            ) : null}

            {logs.length === 0 && !logsLoading ? (
              <div className="card shadow-sm border-0">
                <div className="card-body text-center text-muted">{t('noLogs')}</div>
              </div>
            ) : null}

            <div className="d-flex flex-column gap-3">
              {logs.map((log, index) => renderLogCard(log, index))}
            </div>
          </div>
        </div>
      ) : null}
    </Layout>
  )
}
