import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { Layout } from '../layout/Layout'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { API_BASE_URL } from '../config'
import type { BreadcrumbItem } from '../components/Breadcrumb'
import { LoadingSkeleton } from '../components/LoadingSkeleton'
import { BalanceRechargeModal } from '../components/payments/BalanceRechargeModal'
import { StudentHeader } from './StudentsDetailPage/components/StudentHeader'
import { StudentInstitutionCard } from './StudentsDetailPage/components/StudentInstitutionCard'
import { StudentContactCard } from './StudentsDetailPage/components/StudentContactCard'
import { TuitionTable } from './StudentsDetailPage/components/TuitionTable'
import { PaymentsTable } from './StudentsDetailPage/components/PaymentsTable'
import { RequestsTable } from './StudentsDetailPage/components/RequestsTable'
import { TopupsTable } from './StudentsDetailPage/components/TopupsTable'
import { Tabs } from './StudentsDetailPage/components/Tabs'
import type { Student, StudentCatalogs, StudentSummary } from './StudentsDetailPage/types/Student'
import type { FormState } from './StudentsDetailPage/types/FormState'
import type { Payment } from './StudentsDetailPage/types/Payments'
import type { PaymentRequest } from './StudentsDetailPage/types/Requests'
import type { Topup } from './StudentsDetailPage/types/Topups'
import type { DataTablePagination } from '../components/DataTable'
import './StudentDetailPage.css';

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
    register_id: student?.register_id ?? student?.registerId ?? '',
    payment_reference: student?.payment_reference ?? student?.paymentReference ?? '',
    school_id: student?.school_id,
    group_id: student?.group_id,
    first_name: student?.first_name ?? student?.firstName ?? '',
    last_name_father: student?.last_name_father ?? '',
    last_name_mother: student?.last_name_mother ?? '',
    birth_date: student?.birth_date ?? '',
    phone_number: student?.phone_number ?? student?.phone ?? '',
    tax_id: student?.tax_id ?? '',
    personal_email: student?.personal_email ?? '',
    street: student?.street ?? '',
    ext_number: student?.ext_number ?? '',
    int_number: student?.int_number ?? '',
    suburb: student?.suburb ?? '',
    locality: student?.locality ?? '',
    municipality: student?.municipality ?? '',
    state: student?.state ?? '',
    curp: '',
  }
}

function normalizeStudent(payload: unknown): Student | null {
  if (!payload || typeof payload !== 'object') return null
  const raw =
    (payload as { content?: unknown; student?: unknown; data?: unknown }).content ??
    (payload as { student?: unknown; data?: unknown }).student ??
    (payload as { data?: unknown }).data ??
    payload

  const rawStudent = Array.isArray(raw) ? raw[0] : raw
  if (!rawStudent || typeof rawStudent !== 'object') return null

  const data = rawStudent as Record<string, unknown>
  const rawId = data.id ?? data.student_id ?? data.studentId
  const id = typeof rawId === 'string' ? Number(rawId) : (rawId as number | undefined)
  if (!id || Number.isNaN(id)) return null

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
    
    student_id: (data.student_id) as number,
    group_id: (data.group_id) as number,
    register_id: (data.register_id) as string,
    payment_reference: (data.payment_reference) as string,
    user_id: (data.user_id) as number,
    school_id: (data.school_id) as number,
    username: (data.username) as string,
    role_name: (data.role_name) as string,
    full_name: (data.full_name) as string,
    address: (data.address) as string | undefined,
    commercial_name: (data.commercial_name) as string,
    business_name: (data.business_name) as string,
    group_name: (data.group_name) as string | undefined,
    grade_group: (data.grade_group) as string,
    grade: (data.grade) as string,
    group: (data.group) as string,
    scholar_level_id: (data.scholar_level_id) as number,
    scholar_level_name: (data.scholar_level_name) as string,
    first_name: (data.first_name) as string,
    last_name_father: (data.last_name_father) as string,
    last_name_mother: (data.last_name_mother) as string,
    birth_date: (data.birth_date) as string | undefined,
    phone_number: (data.phone_number) as string | undefined,
    tax_id: (data.tax_id) as string | undefined,
    street: (data.street) as string | undefined,
    ext_number: (data.ext_number) as string | undefined,
    int_number: (data.int_number) as string | undefined,
    suburb: (data.suburb) as string | undefined,
    locality: (data.locality) as string | undefined,
    municipality: (data.municipality) as string | undefined,
    state: (data.state) as string | undefined,
    personal_email: (data.personal_email) as string | undefined,
    user_enabled: (data.user_enabled) as boolean,
    role_enabled: (data.role_enabled) as boolean,
    school_enabled: (data.school_enabled) as boolean,
    group_enabled: (data.group_enabled) as boolean,
    user_status: (data.user_status) as string,
    role_status: (data.role_status) as string,
    school_status: (data.school_status) as string,
    group_status: (data.group_status) as string,
    joining_date: (data.joining_date) as string,
    tuition: (data.tuition) as string,
    default_tuition: (data.default_tuition) as string,
  }
}

function normalizePayment(item: unknown, index: number): Payment {
  const raw = (item ?? {}) as Record<string, unknown>
  return {
    payment_id: (raw.payment_id as number) ?? index,
    pt_name: (raw.pt_name) as string,
    payment_status_name: (raw.payment_status_name) as string,
    payment_status_id: (raw.payment_status_id) as number,
    amount: Number(raw.amount ?? 0),
    payment_date: (raw.payment_date ?? '') as string,
  }
}

function normalizeRequest(item: unknown): PaymentRequest {
  const raw = (item ?? {}) as Record<string, unknown>
  return {
    id: (raw.payment_request_id as number),
    concept: (raw.pt_name) as string,
    status: (raw.ps_pr_name) as string,
    paymentStatusId: (raw.payment_status_id) as number,
    requestedAmount: Number(raw.pr_amount ?? 0),
    requestDate: (raw.pr_pay_by ?? '') as string,
  }
}

function normalizeTopup(item: unknown, index: number): Topup {
  const raw = (item ?? {}) as Record<string, unknown>
  return {
    id: (raw.balance_recharge_id as number) ?? index,
    amount: Number(raw.amount ?? 0),
    date: (raw.created_at ?? '') as string,
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
  const [initialFormValues, setInitialFormValues] = useState<FormState>(() => buildFormState(null))
  const [formErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [catalogs, setCatalogs] = useState<StudentCatalogs>({ schools: [], groups: [] })

  const [activeTab, setActiveTab] = useState<TabKey>('tuition')

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

  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false)
  const [paymentModal, setPaymentModal] = useState<ModalState<Payment>>({ isOpen: false })
  const [requestModal, setRequestModal] = useState<ModalState<PaymentRequest>>({ isOpen: false })
  const [isSaving, setIsSaving] = useState(false)
  const [statusDraft, setStatusDraft] = useState<boolean | null>(null)

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

  const formatCurrency = (value: number | null | undefined) =>
  (value ?? 0).toLocaleString(
    locale === 'es' ? 'es-MX' : 'en-US',
    { style: 'currency', currency: 'MXN' }
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
        const state = buildFormState(detail)
        setFormValues(state)
        setInitialFormValues(state)
        setStatusDraft(null)
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
          params.set('order_by', paymentsSortBy)
          params.set('order_dir', paymentsSortDirection)
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
          params.set('order_by', requestsSortBy)
          params.set('order_dir', requestsSortDirection)
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
          user_id: String(student?.user_id),
          lang: locale,
          offset: String(topupsPage * topupsPageSize),
          limit: String(topupsPageSize),
        })
        if (topupsSortBy) {
          params.set('order_by', topupsSortBy)
          params.set('order_dir', topupsSortDirection)
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

  useEffect(() => {
    if (!token) return
    const controller = new AbortController()

    const fetchGroups = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/groups/catalog?lang=${locale}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const data = (await response.json()) as unknown[]

        setCatalogs((prev) => ({
          ...prev,
          groups: data.map((item) => {
            const group = item as StudentCatalogs['groups'][number]
            return {
              ...group,
              id: (group as { group_id?: number | string }).group_id ?? group.id,
              label: `${(group as { grade_group?: string }).grade_group ?? ''} - ${(group as { scholar_level_name?: string }).scholar_level_name ?? ''}`.trim(),
            }
          }),
        }))
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          // swallow catalog errors silently
        }
      }
    }

    const fetchSchools = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/schools/list?lang=${locale}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const data = (await response.json()) as unknown[]

        setCatalogs((prev) => ({
          ...prev,
          schools: data.map((item) => {
            const school = item as StudentCatalogs['schools'][number]
            return {
              ...school,
              id: (school as { school_id?: number | string }).school_id ?? school.id,
              label: `${(school as { commercial_name?: string }).commercial_name ?? ''}`.trim(),
            }
          }),
        }))
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          // swallow catalog errors silently
        }
      }
    }

    fetchGroups()
    fetchSchools()
    return () => controller.abort()
  }, [locale, token])

  const handleSave = async () => {
    if (!student || !token || isSaving) return

    const formKeys: (keyof FormState)[] = [
      'school_id',
      'group_id',
      'register_id',
      'payment_reference',
      'first_name',
      'last_name_father',
      'last_name_mother',
      'birth_date',
      'phone_number',
      'tax_id',
      'curp',
      'street',
      'ext_number',
      'int_number',
      'suburb',
      'locality',
      'municipality',
      'state',
      'personal_email',
      'email',
    ]

    const studentDataChanged = formKeys.some((key) => {
      const currentValue = formValues[key]
      const initialValue = initialFormValues[key]
      return String(currentValue ?? '') !== String(initialValue ?? '')
    })

    const originalStatus = student.user_enabled ?? student.isActive
    const nextStatus = statusDraft ?? originalStatus
    const statusChanged = nextStatus !== originalStatus

    if (!studentDataChanged && !statusChanged) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    setStudentError(null)

    const numericKeys = new Set<keyof FormState>(['school_id', 'group_id'])
    const sanitizedPayload = Object.fromEntries(
      formKeys.map((key) => {
        const value = formValues[key]

        if (numericKeys.has(key)) {
          const numericValue = value === undefined || value === null ? null : Number(value)
          return [key, Number.isNaN(numericValue) ? null : numericValue]
        }

        if (typeof value === 'string') {
          const trimmedValue = value.trim()
          return [key, trimmedValue === '' ? null : trimmedValue]
        }

        return [key, value ?? null]
      }),
    )

    try {
      if (studentDataChanged) {

        const response = await fetch(
          `${API_BASE_URL}/students/update/${encodeURIComponent(student.user_id)}?lang=${locale}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(sanitizedPayload),
          },
        )

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const updateResponse = await response.json()

        Swal.fire({
          icon: (updateResponse as { type?: "success" | "error" })?.type,
          title: (updateResponse as { title?: string })?.title,
          text: (updateResponse as { message?: string })?.message,
        })

        setStudent((prev) =>
          prev
            ? {
                ...prev,
                register_id: sanitizedPayload.register_id,
                registerId: sanitizedPayload.register_id,
                payment_reference: sanitizedPayload.payment_reference ?? undefined,
                first_name: sanitizedPayload.first_name,
                last_name_father: sanitizedPayload.last_name_father,
                last_name_mother: sanitizedPayload.last_name_mother,
                lastName: `${sanitizedPayload.last_name_father} ${sanitizedPayload.last_name_mother}`.trim(),
                birth_date: sanitizedPayload.birth_date,
                phone_number: sanitizedPayload.phone_number,
                phone: sanitizedPayload.phone_number,
                tax_id: sanitizedPayload.tax_id,
                curp: sanitizedPayload.curp,
                street: sanitizedPayload.street,
                ext_number: sanitizedPayload.ext_number,
                int_number: sanitizedPayload.int_number,
                suburb: sanitizedPayload.suburb,
                locality: sanitizedPayload.locality,
                municipality: sanitizedPayload.municipality,
                state: sanitizedPayload.state,
                personal_email: sanitizedPayload.personal_email,
                email: sanitizedPayload.email,
                group_id: Number(sanitizedPayload.group_id),
                school_id: Number(sanitizedPayload.school_id),
                group_name:
                  catalogs.groups.find((item) => String(item.group_id) === String(sanitizedPayload.group_id))?.grade_group ??
                  prev.group_name,
                scholar_level_name:
                  catalogs.groups.find((item) => String(item.group_id) === String(sanitizedPayload.group_id))?.scholar_level_name ??
                  prev.scholar_level_name,
                grade_group:
                  catalogs.groups.find((item) => String(item.group_id) === String(sanitizedPayload.group_id))?.grade_group ??
                  prev.grade_group,
                generation:
                  catalogs.groups.find((item) => String(item.group_id) === String(sanitizedPayload.group_id))?.generation ??
                  prev.generation,
              }
            : prev,
        )

        setStudentSummary((prev) =>
          prev
            ? {
                ...prev,
                registerId: sanitizedPayload.register_id,
                paymentReference: sanitizedPayload.payment_reference ?? undefined,
              }
            : prev,
        )
        setInitialFormValues({ ...formValues })
      }

      if (statusChanged) {
        const response = await fetch(
          `${API_BASE_URL}/users/update/${encodeURIComponent(student.user_id)}/status?lang=${locale}`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: nextStatus ? 'Activo' : 'Inactivo' }),
          },
        )

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const statusResponse = await response.json()

        Swal.fire({
          icon: (statusResponse as { type?: "success" | "error" })?.type,
          title: (statusResponse as { title?: string })?.title,
          text: (statusResponse as { message?: string })?.message,
        })

        setStudent((prev) =>
          prev ? { ...prev, user_enabled: nextStatus, isActive: nextStatus, status: nextStatus ? 'Activo' : 'Inactivo' } : prev,
        )
        setStatusDraft(nextStatus)
      }

      setIsEditing(false)
    } catch {
      setStudentError(t('defaultError'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleStatus = () => {
    const originalStatus = student?.user_enabled ?? student?.isActive ?? false
    const currentStatus = statusDraft ?? originalStatus
    setStatusDraft(!currentStatus)
  }

  const emptyValue = '—'
  const enrollment = t('enrollment') || 'Matrícula'

  const currentStatus = statusDraft ?? student?.user_enabled ?? student?.isActive ?? false
  const statusLabel = currentStatus ? 'Activo' : 'Inactivo'

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    handleFieldChange(name as keyof FormState, value)
  }

  const handleOpenBalanceModal = () => setIsBalanceModalOpen(true)

  if (!hydrated) {
    return (
      <Layout onNavigate={onNavigate} pageTitle={t('students')} breadcrumbItems={breadcrumbItems}>
        <LoadingSkeleton variant="table" rowCount={10} />
      </Layout>
    )
  }

  return (
    <Layout onNavigate={onNavigate} pageTitle={t('students')} breadcrumbItems={breadcrumbItems}>
      <div className="d-flex flex-column gap-3">
      <>
        {studentError ? (
          <div className="alert alert-danger" role="alert">
            {studentError}
          </div>
        ) : null}

        {student ? (
          <div className="card">
            <div className="col-12 ">
              <StudentHeader
                student={student}
                isEditing={isEditing}
                statusDraft={currentStatus}
                statusLabel={statusLabel}
                onEdit={() => setIsEditing(true)}
                onCancel={() => {
                  setIsEditing(false)
                  setFormValues(buildFormState(student))
                  setStatusDraft(null)
                }}
                onSave={handleSave}
                onToggleStatus={handleToggleStatus}
              />
            </div>
          </div>
        ) : (
          <LoadingSkeleton variant="table" rowCount={1} />
        )}

        <div className="row gy-3">
          <div className="col-12 col-lg-4">
              {studentSummary ? (
                  <section className="card h-100 gap-3">
                    <div className="student-card__row">
                      <div>
                        <p className="student-card__label">{enrollment}</p>
                        {isEditing ? (
                          <input
                            name="register_id"
                            value={formValues.register_id ?? studentSummary.registerId ?? ''}
                            onChange={handleInputChange}
                            className={formErrors.register_id ? 'input input--error' : 'input'}
                            placeholder={t('registerPlaceholder')}
                          />
                        ) : (
                          <p className="field__value">{formValues.register_id || studentSummary.registerId || emptyValue}</p>
                        )}
                        {isEditing && formErrors.register_id ? (
                          <span className="input__error">{formErrors.register_id}</span>
                        ) : null}
                      </div>
                      <div>
                        <p className="student-card__label">{t('paymentReference')}</p>
                        {isEditing ? (
                          <input
                            name="payment_reference"
                            value={formValues.payment_reference ?? studentSummary.paymentReference ?? ''}
                            onChange={handleInputChange}
                            className="input"
                            placeholder={t('paymentReferencePlaceholder')}
                          />
                        ) : (
                          <p className="field__value">{formValues.payment_reference || studentSummary.paymentReference || emptyValue}</p>
                        )}
                      </div>
                    </div>
                    <div className="student-card__divider" />
                    <div className="student-card__info">
                      <div>
                        <p className="student-card__label">{t('balance')}</p>
                        <h3>{formatCurrency(studentSummary.balance)}</h3>
                      </div>
                    </div>
                    <button type="button" className="ui-button btn--ghost btn--full" onClick={handleOpenBalanceModal}>
                      {t('balance')}
                    </button>
                  </section>
              ) : (
                <span className="text-muted">Sin información</span>
              )}
          </div>
          <div className="col-12 col-lg-8">
            {student ? (
              <section className="card h-100">
                <StudentInstitutionCard
                  student={student}
                  formValues={formValues}
                  formErrors={formErrors}
                  isEditing={isEditing}
                  catalogs={catalogs}
                  onChange={handleFieldChange}
                />
              </section>
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
                <TuitionTable studentId={studentId} onNavigate={onNavigate} />
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
                    onNavigate={onNavigate}
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
                    onNavigate={onNavigate}
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
      </>

      <BalanceRechargeModal
        isOpen={isBalanceModalOpen}
        onClose={() => setIsBalanceModalOpen(false)}
        user={student && {
          userId: student.userId ?? student.user_id,
          fullName: student.fullName ||
            [student.first_name, student.last_name_father, student.last_name_mother].filter(Boolean).join(' '),
          group: student.group || student.group_name || student.groupName || student.grade_group,
          level: student.level || student.scholar_level_name,
          balance: studentSummary?.balance ?? student.balance ?? 0,
        }}
        onSuccess={(payload) => {
          setStudentSummary((prev) => ({
            balance: payload.newBalance,
            registerId: prev?.registerId,
            paymentReference: prev?.paymentReference,
          }))
          setStudent((prev) => (prev ? { ...prev, balance: payload.newBalance } : prev))
        } } close={function (): void {
          throw new Error('Function not implemented.')
        } }      
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
      </div>
    </Layout>
  )
}
