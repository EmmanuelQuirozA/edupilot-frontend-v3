import { useEffect, useMemo, useState } from 'react'
import { Layout } from '../layout/Layout'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { API_BASE_URL } from '../config'
import type { BreadcrumbItem } from '../components/Breadcrumb'
import { LoadingSkeleton } from '../components/LoadingSkeleton'
import { StudentHeader } from './components/StudentHeader'
import { InfoCard } from './components/InfoCard'
import { StudentInstitutionCard } from './components/StudentInstitutionCard'
import { StudentContactCard } from './components/StudentContactCard'
import { TuitionTable } from './components/TuitionTable'
import { PaymentsTable } from './components/PaymentsTable'
import { RequestsTable } from './components/RequestsTable'
import { TopupsTable } from './components/TopupsTable'
import { Tabs } from './components/Tabs'
import type { Student, StudentCatalogs, StudentSummary } from './types/Student'
import type { FormState } from './types/FormState'
import type { TuitionRow } from './types/Tuition'
import type { Payment } from './types/Payments'
import type { PaymentRequest } from './types/Requests'
import type { Topup } from './types/Topups'
import type { DataTablePagination } from '../components/DataTable'

type TabKey = 'tuition' | 'requests' | 'payments' | 'topups'

type SortDirection = 'ASC' | 'DESC'

interface StudentDetailPageProps {
  onNavigate: (path: string) => void
  studentId: number
}

interface PaginatedResponse<T> {
  content?: T[]
  totalElements?: number
  totalPages?: number
  page?: number
  size?: number
}

interface ModalState<T> {
  isOpen: boolean
  payload?: T
}

function buildFormState(student: Student | null): FormState {
  return {
    firstName: student?.firstName ?? '',
    lastName: student?.lastName ?? '',
    email: student?.email ?? '',
    phone: student?.phone ?? '',
    institutionId: undefined,
    groupId: undefined,
    paymentReference: student?.paymentReference,
    status: student?.status,
  }
}

function normalizeStudent(payload: unknown): Student | null {
  if (!payload || typeof payload !== 'object') return null
  const raw = (payload as { content?: unknown; student?: unknown }).content ??
    (payload as { student?: unknown }).student ?? payload

  if (!raw || typeof raw !== 'object') return null

  const data = raw as Record<string, unknown>
  const id = (data.id ?? data.student_id) as number | undefined
  if (!id) return null

  const firstName = (data.firstName ?? data.first_name) as string | undefined
  const lastName =
    (data.lastName ?? data.last_name ?? [data.last_name_father, data.last_name_mother].filter(Boolean).join(' ')) as
      | string
      | undefined
  const fullName = (data.fullName ?? data.full_name ?? [firstName, lastName].filter(Boolean).join(' ')) as
    | string
    | undefined

  return {
    id,
    userId: (data.user_id ?? data.userId) as number | undefined,
    fullName: fullName ?? '',
    firstName: firstName ?? '',
    lastName: lastName ?? '',
    email: (data.email ?? data.username) as string | '',
    phone: (data.phone ?? data.phone_number) as string | '',
    status: (data.status ?? data.user_status ?? 'Activo') as string,
    institutionName: (data.institutionName ?? data.school_name) as string | undefined,
    registerId: (data.registerId ?? data.register_id) as string | undefined,
    paymentReference: (data.paymentReference ?? data.payment_reference) as string | undefined,
    balance: Number(data.balance ?? 0),
    groupName: (data.groupName ?? data.group_name) as string | undefined,
    level: (data.level ?? data.level_name) as string | undefined,
    generation: (data.generation ?? data.generation_name) as string | undefined,
    avatarUrl: (data.avatarUrl ?? data.avatar_url) as string | undefined,
    isActive: Boolean(data.enabled ?? data.isActive ?? true),
  }
}

function normalizeTuitionRow(item: unknown, index: number): TuitionRow {
  const raw = (item ?? {}) as Record<string, unknown>
  const monthlyAmounts = (raw.monthlyAmounts ?? raw.months ?? {}) as Record<string, number>

  return {
    id: (raw.id as number) ?? index,
    concept: (raw.concept ?? raw.description ?? raw.payment_type_name ?? `Concepto ${index + 1}`) as string,
    monthlyAmounts,
    total: Number(raw.total ?? raw.amount ?? 0),
    status: (raw.status ?? raw.payment_status) as string | undefined,
    dueDate: raw.due_date as string | undefined,
    currency: (raw.currency as string | undefined) ?? 'MXN',
  }
}

function normalizePayment(item: unknown, index: number): Payment {
  const raw = (item ?? {}) as Record<string, unknown>
  return {
    id: (raw.id as number) ?? index,
    concept: (raw.concept ?? raw.payment_type_name ?? `Pago ${index + 1}`) as string,
    amount: Number(raw.amount ?? raw.total ?? 0),
    status: (raw.status ?? raw.payment_status ?? 'Pendiente') as string,
    method: (raw.payment_method ?? raw.method ?? raw.payment_through ?? 'N/D') as string,
    reference: (raw.reference ?? raw.payment_reference ?? raw.reference_number ?? '-') as string,
    paymentDate: (raw.payment_date ?? raw.created_at ?? '') as string,
    currency: (raw.currency as string | undefined) ?? 'MXN',
    receiptUrl: raw.receipt_path as string | undefined,
  }
}

function normalizeRequest(item: unknown, index: number): PaymentRequest {
  const raw = (item ?? {}) as Record<string, unknown>
  return {
    id: (raw.id as number) ?? index,
    concept: (raw.concept ?? raw.payment_type_name ?? `Solicitud ${index + 1}`) as string,
    requestedAmount: Number(raw.requested_amount ?? raw.amount ?? 0),
    status: (raw.status ?? raw.payment_status ?? 'Pendiente') as string,
    requestDate: (raw.request_date ?? raw.created_at ?? '') as string,
    dueDate: raw.due_date as string | undefined,
    currency: (raw.currency as string | undefined) ?? 'MXN',
  }
}

function normalizeTopup(item: unknown, index: number): Topup {
  const raw = (item ?? {}) as Record<string, unknown>
  return {
    id: (raw.id as number) ?? index,
    amount: Number(raw.amount ?? 0),
    method: (raw.method ?? raw.payment_method ?? raw.payment_through ?? 'N/D') as string,
    reference: (raw.reference ?? raw.payment_reference ?? '-') as string,
    status: (raw.status ?? raw.transaction_status ?? 'Pendiente') as string,
    date: (raw.date ?? raw.created_at ?? '') as string,
    currency: (raw.currency as string | undefined) ?? 'MXN',
  }
}

function InlineModal<T>({ title, open, onClose, content }: { title: string; open: boolean; onClose: () => void; content?: T }) {
  if (!open) return null
  return (
    <div className="modal fade show d-block" role="dialog" aria-modal="true">
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
          </div>
          <div className="modal-body">
            <pre className="bg-light p-3 rounded small mb-0">{JSON.stringify(content, null, 2)}</pre>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </div>
  )
}

export function StudentDetailPage({ onNavigate, studentId }: StudentDetailPageProps) {
  const { token, hydrated } = useAuth()
  const { locale, t } = useLanguage()

  const [student, setStudent] = useState<Student | null>(null)
  const [studentSummary, setStudentSummary] = useState<StudentSummary | null>(null)
  const [isStudentLoading, setIsStudentLoading] = useState(false)
  const [studentError, setStudentError] = useState<string | null>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [formValues, setFormValues] = useState<FormState>(() => buildFormState(null))
  const [formErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [catalogs] = useState<StudentCatalogs>({ schools: [], groups: [] })

  const [activeTab, setActiveTab] = useState<TabKey>('tuition')

  const [tuitionRows, setTuitionRows] = useState<TuitionRow[]>([])
  const [isTuitionLoading, setIsTuitionLoading] = useState(false)
  const [tuitionError, setTuitionError] = useState<string | null>(null)
  const [tuitionPage, setTuitionPage] = useState(0)
  const [tuitionPageSize, setTuitionPageSize] = useState(10)
  const [tuitionTotalPages, setTuitionTotalPages] = useState(0)
  const [tuitionTotalElements, setTuitionTotalElements] = useState(0)
  const [tuitionSortBy, setTuitionSortBy] = useState<string | undefined>('concept')
  const [tuitionSortDirection, setTuitionSortDirection] = useState<SortDirection>('ASC')

  const [payments, setPayments] = useState<Payment[]>([])
  const [isPaymentsLoading, setIsPaymentsLoading] = useState(false)
  const [paymentsError, setPaymentsError] = useState<string | null>(null)
  const [paymentsPage, setPaymentsPage] = useState(0)
  const [paymentsPageSize, setPaymentsPageSize] = useState(10)
  const [paymentsTotalPages, setPaymentsTotalPages] = useState(0)
  const [paymentsTotalElements, setPaymentsTotalElements] = useState(0)
  const [paymentsSortBy, setPaymentsSortBy] = useState<string | undefined>('paymentDate')
  const [paymentsSortDirection, setPaymentsSortDirection] = useState<SortDirection>('DESC')

  const [requests, setRequests] = useState<PaymentRequest[]>([])
  const [isRequestsLoading, setIsRequestsLoading] = useState(false)
  const [requestsError, setRequestsError] = useState<string | null>(null)
  const [requestsPage, setRequestsPage] = useState(0)
  const [requestsPageSize, setRequestsPageSize] = useState(10)
  const [requestsTotalPages, setRequestsTotalPages] = useState(0)
  const [requestsTotalElements, setRequestsTotalElements] = useState(0)
  const [requestsSortBy, setRequestsSortBy] = useState<string | undefined>('requestDate')
  const [requestsSortDirection, setRequestsSortDirection] = useState<SortDirection>('DESC')

  const [topups, setTopups] = useState<Topup[]>([])
  const [isTopupsLoading, setIsTopupsLoading] = useState(false)
  const [topupsError, setTopupsError] = useState<string | null>(null)
  const [topupsPage, setTopupsPage] = useState(0)
  const [topupsPageSize, setTopupsPageSize] = useState(10)
  const [topupsTotalPages, setTopupsTotalPages] = useState(0)
  const [topupsTotalElements, setTopupsTotalElements] = useState(0)
  const [topupsSortBy, setTopupsSortBy] = useState<string | undefined>('date')
  const [topupsSortDirection, setTopupsSortDirection] = useState<SortDirection>('DESC')

  const [balanceModal, setBalanceModal] = useState<ModalState<StudentSummary>>({ isOpen: false })
  const [paymentModal, setPaymentModal] = useState<ModalState<Payment>>({ isOpen: false })
  const [requestModal, setRequestModal] = useState<ModalState<PaymentRequest>>({ isOpen: false })
  const [tuitionModal, setTuitionModal] = useState<ModalState<TuitionRow>>({ isOpen: false })

  const breadcrumbItems: BreadcrumbItem[] = useMemo(
    () => [
      {
        label: t('portalTitle'),
        onClick: () => onNavigate(`/${locale}`),
      },
      { label: t('students') },
      { label: t('viewDetails') },
    ],
    [locale, onNavigate, t],
  )

  const tuitionPagination: DataTablePagination = useMemo(
    () => ({
      page: tuitionPage,
      size: tuitionPageSize,
      totalPages: tuitionTotalPages,
      totalElements: tuitionTotalElements,
      onPageChange: (nextPage) => setTuitionPage(Math.max(0, nextPage)),
      onPageSizeChange: (nextSize) => {
        setTuitionPageSize(nextSize)
        setTuitionPage(0)
      },
    }),
    [tuitionPage, tuitionPageSize, tuitionTotalElements, tuitionTotalPages],
  )

  const paymentsPagination: DataTablePagination = useMemo(
    () => ({
      page: paymentsPage,
      size: paymentsPageSize,
      totalPages: paymentsTotalPages,
      totalElements: paymentsTotalElements,
      onPageChange: (nextPage) => setPaymentsPage(Math.max(0, nextPage)),
      onPageSizeChange: (nextSize) => {
        setPaymentsPageSize(nextSize)
        setPaymentsPage(0)
      },
    }),
    [paymentsPage, paymentsPageSize, paymentsTotalElements, paymentsTotalPages],
  )

  const requestsPagination: DataTablePagination = useMemo(
    () => ({
      page: requestsPage,
      size: requestsPageSize,
      totalPages: requestsTotalPages,
      totalElements: requestsTotalElements,
      onPageChange: (nextPage) => setRequestsPage(Math.max(0, nextPage)),
      onPageSizeChange: (nextSize) => {
        setRequestsPageSize(nextSize)
        setRequestsPage(0)
      },
    }),
    [requestsPage, requestsPageSize, requestsTotalElements, requestsTotalPages],
  )

  const topupsPagination: DataTablePagination = useMemo(
    () => ({
      page: topupsPage,
      size: topupsPageSize,
      totalPages: topupsTotalPages,
      totalElements: topupsTotalElements,
      onPageChange: (nextPage) => setTopupsPage(Math.max(0, nextPage)),
      onPageSizeChange: (nextSize) => {
        setTopupsPageSize(nextSize)
        setTopupsPage(0)
      },
    }),
    [topupsPage, topupsPageSize, topupsTotalElements, topupsTotalPages],
  )

  useEffect(() => {
    if (!token) return
    const controller = new AbortController()

    const loadStudent = async () => {
      setIsStudentLoading(true)
      setStudentError(null)
      try {
        const response = await fetch(
          `${API_BASE_URL}/students/student-details/${encodeURIComponent(studentId)}?lang=${locale}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          },
        )

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const data = await response.json()
        const detail = normalizeStudent(data)

        if (!detail) {
          throw new Error('missing_student')
        }

        setStudent(detail)
        setStudentSummary({
          balance: detail.balance,
          registerId: detail.registerId,
          paymentReference: detail.paymentReference,
        })
        setFormValues(buildFormState(detail))
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          setStudentError(t('defaultError'))
        }
      } finally {
        setIsStudentLoading(false)
      }
    }

    loadStudent()
    return () => controller.abort()
  }, [locale, studentId, t, token])

  useEffect(() => {
    if (!token || activeTab !== 'tuition') return

    const controller = new AbortController()
    const fetchTuition = async () => {
      setIsTuitionLoading(true)
      setTuitionError(null)
      try {
        const params = new URLSearchParams({
          student_id: String(studentId),
          lang: locale,
          offset: String(tuitionPage * tuitionPageSize),
          limit: String(tuitionPageSize),
        })
        if (tuitionSortBy) {
          params.set('orderBy', tuitionSortBy)
          params.set('order', tuitionSortDirection)
        }

        const response = await fetch(`${API_BASE_URL}/reports/payments/report?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const payload = (await response.json()) as PaginatedResponse<unknown>
        const content = (payload.content ?? []) as unknown[]
        setTuitionRows(content.map(normalizeTuitionRow))
        setTuitionTotalElements(payload.totalElements ?? content.length)
        setTuitionTotalPages(payload.totalPages ?? 1)
        setTuitionPage(payload.page ?? tuitionPage)
        setTuitionPageSize(payload.size ?? tuitionPageSize)
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          setTuitionError(t('defaultError'))
        }
      } finally {
        setIsTuitionLoading(false)
      }
    }

    fetchTuition()
    return () => controller.abort()
  }, [activeTab, locale, studentId, t, token, tuitionPage, tuitionPageSize, tuitionSortBy, tuitionSortDirection])

  useEffect(() => {
    if (!token || activeTab !== 'payments') return

    const controller = new AbortController()
    const fetchPayments = async () => {
      setIsPaymentsLoading(true)
      setPaymentsError(null)
      try {
        const params = new URLSearchParams({
          student_id: String(studentId),
          lang: locale,
          offset: String(paymentsPage * paymentsPageSize),
          limit: String(paymentsPageSize),
        })
        if (paymentsSortBy) {
          params.set('orderBy', paymentsSortBy)
          params.set('order', paymentsSortDirection)
        }

        const response = await fetch(`${API_BASE_URL}/reports/payments?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const payload = (await response.json()) as PaginatedResponse<unknown>
        const content = (payload.content ?? []) as unknown[]
        setPayments(content.map(normalizePayment))
        setPaymentsTotalElements(payload.totalElements ?? content.length)
        setPaymentsTotalPages(payload.totalPages ?? 1)
        setPaymentsPage(payload.page ?? paymentsPage)
        setPaymentsPageSize(payload.size ?? paymentsPageSize)
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          setPaymentsError(t('defaultError'))
        }
      } finally {
        setIsPaymentsLoading(false)
      }
    }

    fetchPayments()
    return () => controller.abort()
  }, [activeTab, locale, paymentsPage, paymentsPageSize, paymentsSortBy, paymentsSortDirection, studentId, t, token])

  useEffect(() => {
    if (!token || activeTab !== 'requests') return

    const controller = new AbortController()
    const fetchRequests = async () => {
      setIsRequestsLoading(true)
      setRequestsError(null)
      try {
        const params = new URLSearchParams({
          student_id: String(studentId),
          lang: locale,
          offset: String(requestsPage * requestsPageSize),
          limit: String(requestsPageSize),
        })
        if (requestsSortBy) {
          params.set('orderBy', requestsSortBy)
          params.set('order', requestsSortDirection)
        }

        const response = await fetch(`${API_BASE_URL}/reports/paymentrequests?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const payload = (await response.json()) as PaginatedResponse<unknown>
        const content = (payload.content ?? []) as unknown[]
        setRequests(content.map(normalizeRequest))
        setRequestsTotalElements(payload.totalElements ?? content.length)
        setRequestsTotalPages(payload.totalPages ?? 1)
        setRequestsPage(payload.page ?? requestsPage)
        setRequestsPageSize(payload.size ?? requestsPageSize)
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          setRequestsError(t('defaultError'))
        }
      } finally {
        setIsRequestsLoading(false)
      }
    }

    fetchRequests()
    return () => controller.abort()
  }, [activeTab, locale, requestsPage, requestsPageSize, requestsSortBy, requestsSortDirection, studentId, t, token])

  useEffect(() => {
    if (!token || activeTab !== 'topups') return

    const controller = new AbortController()
    const fetchTopups = async () => {
      setIsTopupsLoading(true)
      setTopupsError(null)
      try {
        const params = new URLSearchParams({
          user_id: String(studentId),
          lang: locale,
          offset: String(topupsPage * topupsPageSize),
          limit: String(topupsPageSize),
        })
        if (topupsSortBy) {
          params.set('orderBy', topupsSortBy)
          params.set('order', topupsSortDirection)
        }

        const response = await fetch(`${API_BASE_URL}/reports/balance-recharges?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const payload = (await response.json()) as PaginatedResponse<unknown>
        const content = (payload.content ?? []) as unknown[]
        setTopups(content.map(normalizeTopup))
        setTopupsTotalElements(payload.totalElements ?? content.length)
        setTopupsTotalPages(payload.totalPages ?? 1)
        setTopupsPage(payload.page ?? topupsPage)
        setTopupsPageSize(payload.size ?? topupsPageSize)
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          setTopupsError(t('defaultError'))
        }
      } finally {
        setIsTopupsLoading(false)
      }
    }

    fetchTopups()
    return () => controller.abort()
  }, [activeTab, locale, studentId, t, token, topupsPage, topupsPageSize, topupsSortBy, topupsSortDirection])

  const handleFieldChange = (field: keyof FormState, value: string | number | undefined) => {
    setFormValues((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    setIsEditing(false)
    setStudent((prev) =>
      prev
        ? {
            ...prev,
            firstName: formValues.firstName,
            lastName: formValues.lastName,
            email: formValues.email,
            phone: formValues.phone,
            paymentReference: formValues.paymentReference,
          }
        : prev,
    )
  }

  const handleToggleStatus = () => {
    setStudent((prev) => (prev ? { ...prev, isActive: !prev.isActive } : prev))
  }

  if (!hydrated) {
    return (
      <Layout onNavigate={onNavigate} pageTitle={t('students')} breadcrumbItems={breadcrumbItems}>
        <LoadingSkeleton variant="table" rowCount={10} />
      </Layout>
    )
  }

  return (
    <Layout onNavigate={onNavigate} pageTitle={t('students')} breadcrumbItems={breadcrumbItems}>
      <div className="d-flex flex-column gap-4">
        {studentError ? (
          <div className="alert alert-danger" role="alert">
            {studentError}
          </div>
        ) : null}

        {student ? (
          <StudentHeader
            student={student}
            isEditing={isEditing}
            onEdit={() => setIsEditing(true)}
            onCancel={() => {
              setIsEditing(false)
              setFormValues(buildFormState(student))
            }}
            onSave={handleSave}
            onToggleStatus={handleToggleStatus}
          />
        ) : (
          <LoadingSkeleton variant="table" rowCount={1} />
        )}

        <div className="row gy-3">
          <div className="col-12 col-lg-4">
            <InfoCard
              title="Resumen"
              actions={
                <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setBalanceModal({ isOpen: true, payload: studentSummary ?? undefined })}>
                  Recargar saldo
                </button>
              }
            >
              {studentSummary ? (
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex align-items-center justify-content-between">
                    <span className="text-muted">Saldo</span>
                    <span className="fw-bold text-black">${studentSummary.balance.toFixed(2)}</span>
                  </div>
                  <div className="d-flex align-items-center justify-content-between">
                    <span className="text-muted">ID de registro</span>
                    <span className="fw-semibold text-black">{studentSummary.registerId ?? '-'}</span>
                  </div>
                  <div className="d-flex align-items-center justify-content-between">
                    <span className="text-muted">Referencia de pago</span>
                    <span className="fw-semibold text-black">{studentSummary.paymentReference ?? '-'}</span>
                  </div>
                </div>
              ) : (
                <span className="text-muted">Sin información</span>
              )}
            </InfoCard>
          </div>
          <div className="col-12 col-lg-8">
            {student ? (
              <StudentInstitutionCard
                student={student}
                formValues={formValues}
                formErrors={formErrors}
                isEditing={isEditing}
                catalogs={catalogs}
                onChange={handleFieldChange}
              />
            ) : (
              <LoadingSkeleton variant="table" rowCount={4} />
            )}
          </div>
        </div>

        {student ? (
          <StudentContactCard
            student={student}
            formValues={formValues}
            formErrors={formErrors}
            isEditing={isEditing}
            onChange={(field, value) => handleFieldChange(field, value)}
          />
        ) : null}

        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as TabKey)}
          items={[
            {
              key: 'tuition',
              label: 'Colegiaturas',
              content: (
                <div className="d-flex flex-column gap-3">
                  {tuitionError ? (
                    <div className="alert alert-danger" role="alert">
                      {tuitionError}
                    </div>
                  ) : null}
                  <TuitionTable
                    rows={tuitionRows}
                    isLoading={isTuitionLoading || isStudentLoading}
                    pagination={tuitionPagination}
                    emptyMessage={t('tableNoData')}
                    sortBy={tuitionSortBy}
                    sortDirection={tuitionSortDirection}
                    onSort={(columnKey) => {
                      setTuitionSortBy(columnKey)
                      setTuitionSortDirection((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'))
                    }}
                    onViewDetail={(row) => setTuitionModal({ isOpen: true, payload: row })}
                  />
                </div>
              ),
            },
            {
              key: 'requests',
              label: 'Solicitudes',
              content: (
                <div className="d-flex flex-column gap-3">
                  {requestsError ? (
                    <div className="alert alert-danger" role="alert">
                      {requestsError}
                    </div>
                  ) : null}
                  <RequestsTable
                    rows={requests}
                    isLoading={isRequestsLoading || isStudentLoading}
                    pagination={requestsPagination}
                    emptyMessage={t('tableNoData')}
                    sortBy={requestsSortBy}
                    sortDirection={requestsSortDirection}
                    onSort={(columnKey) => {
                      setRequestsSortBy(columnKey)
                      setRequestsSortDirection((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'))
                    }}
                    onViewDetail={(request) => setRequestModal({ isOpen: true, payload: request })}
                  />
                </div>
              ),
            },
            {
              key: 'payments',
              label: 'Pagos',
              content: (
                <div className="d-flex flex-column gap-3">
                  {paymentsError ? (
                    <div className="alert alert-danger" role="alert">
                      {paymentsError}
                    </div>
                  ) : null}
                  <PaymentsTable
                    rows={payments}
                    isLoading={isPaymentsLoading || isStudentLoading}
                    pagination={paymentsPagination}
                    emptyMessage={t('tableNoData')}
                    sortBy={paymentsSortBy}
                    sortDirection={paymentsSortDirection}
                    onSort={(columnKey) => {
                      setPaymentsSortBy(columnKey)
                      setPaymentsSortDirection((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'))
                    }}
                    onViewDetail={(payment) => setPaymentModal({ isOpen: true, payload: payment })}
                  />
                </div>
              ),
            },
            {
              key: 'topups',
              label: 'Recargas',
              content: (
                <div className="d-flex flex-column gap-3">
                  {topupsError ? (
                    <div className="alert alert-danger" role="alert">
                      {topupsError}
                    </div>
                  ) : null}
                  <TopupsTable
                    rows={topups}
                    isLoading={isTopupsLoading || isStudentLoading}
                    pagination={topupsPagination}
                    emptyMessage={t('tableNoData')}
                    sortBy={topupsSortBy}
                    sortDirection={topupsSortDirection}
                    onSort={(columnKey) => {
                      setTopupsSortBy(columnKey)
                      setTopupsSortDirection((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'))
                    }}
                  />
                </div>
              ),
            },
          ]}
        />
      </div>

      <InlineModal
        title="Recargar saldo"
        open={balanceModal.isOpen}
        onClose={() => setBalanceModal({ isOpen: false })}
        content={balanceModal.payload}
      />

      <InlineModal
        title="Detalle de colegiatura"
        open={tuitionModal.isOpen}
        onClose={() => setTuitionModal({ isOpen: false })}
        content={tuitionModal.payload}
      />

      <InlineModal
        title="Detalle de pago"
        open={paymentModal.isOpen}
        onClose={() => setPaymentModal({ isOpen: false })}
        content={paymentModal.payload}
      />

      <InlineModal
        title="Detalle de solicitud"
        open={requestModal.isOpen}
        onClose={() => setRequestModal({ isOpen: false })}
        content={requestModal.payload}
      />
    </Layout>
  )
}
