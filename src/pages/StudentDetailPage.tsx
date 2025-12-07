import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { Layout } from '../layout/Layout'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { API_BASE_URL } from '../config'
import type { BreadcrumbItem } from '../components/Breadcrumb'
import { LoadingSkeleton } from '../components/LoadingSkeleton'
import type { DataTablePagination } from '../components/DataTable'
import { handleExpiredToken } from './PaymentsFinancePage/utils'
import type { FormState, Student } from './StudentsPage/types'
import {
  PaymentsTable,
  RequestsTable,
  StudentContactCard,
  StudentHeader,
  StudentInstitutionCard,
  TabbedSection,
  TopupsTable,
  TuitionTable,
} from './StudentsPage/components'
import type { StudentPayment } from './StudentsPage/components/PaymentsTable'
import type { StudentPaymentRequest } from './StudentsPage/components/RequestsTable'
import type { StudentTopup } from './StudentsPage/components/TopupsTable'
import type { TuitionRow } from './StudentsPage/components/TuitionTable'
import type { StudentCatalogs } from './StudentsPage/components/StudentInstitutionCard'

type LoadStatus = 'idle' | 'loading' | 'success' | 'error'
type TabKey = 'tuition' | 'payments' | 'requests' | 'topups'

const TABLE_LIMIT = 10

function buildFormStateFromStudent(student: Student | null): FormState {
  const firstName = student?.firstName ?? student?.first_name ?? ''
  const lastName =
    student?.lastName ??
    [student?.last_name_father, student?.last_name_mother].filter(Boolean).join(' ').trim()

  return {
    firstName,
    lastName,
    email: student?.email ?? '',
    phone: student?.phone ?? '',
    institutionName: student?.institutionName ?? '',
    status: student?.status ?? '',
  }
}

function extractStudentDetail(payload: unknown): Student | null {
  const content =
    (payload as { content?: unknown })?.content ?? (payload as { student?: unknown })?.student ?? payload

  if (!content || typeof content !== 'object') {
    return null
  }

  const raw = content as Record<string, unknown>
  const firstName = (raw.firstName ?? raw.first_name) as string | undefined
  const lastNameFather = raw.last_name_father as string | undefined
  const lastNameMother = raw.last_name_mother as string | undefined
  const lastNameCamel = raw.lastName as string | undefined
  const lastName = lastNameCamel ?? [lastNameFather, lastNameMother].filter(Boolean).join(' ').trim() || undefined
  const fullName = (raw.fullName ?? raw.full_name) as string | undefined

  return {
    id: (raw.id ?? raw.student_id) as number | undefined,
    externalId: raw.external_id as string | undefined,
    firstName,
    first_name: firstName,
    lastName,
    last_name_father: lastNameFather,
    last_name_mother: lastNameMother,
    email: raw.email as string | undefined,
    phone: (raw.phone ?? raw.phone_number) as string | undefined,
    status: (raw.status ?? raw.user_status) as string | undefined,
    fullName: fullName ?? [firstName, lastName].filter(Boolean).join(' ').trim() || undefined,
    full_name: (raw.full_name ?? fullName) as string | undefined,
    institutionName: (raw.institutionName ?? raw.institution_name ?? raw.school_name) as string | undefined,
    registerId: (raw.registerId ?? raw.register_id) as string | undefined,
    register_id: raw.register_id as string | undefined,
    user_id: raw.user_id as number | undefined,
    avatarUrl: (raw.avatarUrl ?? raw.avatar_url) as string | undefined,
  }
}

interface StudentDetailPageProps {
  onNavigate: (path: string) => void
  studentId: number
  language?: string
  onBreadcrumbChange?: (label?: string) => void
}

export default function StudentDetailPage({
  onNavigate,
  studentId,
  language: _language,
  onBreadcrumbChange,
}: StudentDetailPageProps) {
  const { token, hydrated, logout } = useAuth()
  const { locale, t } = useLanguage()
  const language = _language ?? locale
  const errorLabel = t('defaultError')

  const [student, setStudent] = useState<Student | null>(null)
  const [status, setStatus] = useState<LoadStatus>('idle')
  const [error, setError] = useState('')

  const [activeTab, setActiveTab] = useState<TabKey>('tuition')

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [userStatusDraft, setUserStatusDraft] = useState(false)

  const [tuitionRows, setTuitionRows] = useState<TuitionRow[]>([])
  const [tuitionStatus, setTuitionStatus] = useState<LoadStatus>('idle')
  const [, setTuitionError] = useState('')
  const [tuitionFetched, setTuitionFetched] = useState(false)

  const [payments, setPayments] = useState<StudentPayment[]>([])
  const [paymentsStatus, setPaymentsStatus] = useState<LoadStatus>('idle')
  const [, setPaymentsError] = useState('')
  const [paymentsFetched, setPaymentsFetched] = useState(false)

  const [requests, setRequests] = useState<StudentPaymentRequest[]>([])
  const [requestsStatus, setRequestsStatus] = useState<LoadStatus>('idle')
  const [, setRequestsError] = useState('')
  const [requestsFetched, setRequestsFetched] = useState(false)

  const [topups, setTopups] = useState<StudentTopup[]>([])
  const [topupsStatus, setTopupsStatus] = useState<LoadStatus>('idle')
  const [, setTopupsError] = useState('')
  const [topupsFetched, setTopupsFetched] = useState(false)

  const [paymentsPagination] = useState<DataTablePagination | undefined>()
  const [requestsPagination] = useState<DataTablePagination | undefined>()
  const [topupsPagination] = useState<DataTablePagination | undefined>()
  const [formValues, setFormValues] = useState<FormState>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    institutionName: '',
    status: '',
  })
  const [formErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [catalogs] = useState<StudentCatalogs>({
    institutions: [],
    statuses: [],
  })
  const [sortStates] = useState<Record<string, { orderBy?: string; orderDir?: string }>>({})

  const breadcrumbItems: BreadcrumbItem[] = useMemo(
    () => [
      {
        label: t('portalTitle'),
        onClick: () => onNavigate(`/${locale}`),
      },
      { label: t('studentsTitle') },
      { label: t('viewDetails') },
    ],
    [locale, onNavigate, t],
  )

  useEffect(() => {
    if (!studentId) {
      return undefined
    }

    let isCancelled = false
    const controller = new AbortController()

    const loadStudent = async () => {
      try {
        setStatus('loading')
        setError('')

        const response = await fetch(
          `${API_BASE_URL}/students/student-details/${encodeURIComponent(studentId)}?lang=${language ?? 'es'}`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            signal: controller.signal,
          },
        )

        if (!response.ok) {
          handleExpiredToken(response, logout)
          throw new Error('Failed to load student detail')
        }

        const payload = await response.json()
        const detail = extractStudentDetail(payload)

        if (!detail) {
          throw new Error('Missing student detail')
        }

        if (isCancelled) {
          return
        }

        setStudent(detail)
        setFormValues(buildFormStateFromStudent(detail))
        setStatus('success')

        const displayName = [
          detail.full_name,
          [detail.first_name, detail.last_name_father, detail.last_name_mother]
            .filter(Boolean)
            .join(' '),
        ]
          .find((name) => typeof name === 'string' && name.trim().length > 0)

        onBreadcrumbChange?.(displayName?.trim())
      } catch (requestError) {
        if (isCancelled || (requestError as Error).name === 'AbortError') {
          return
        }

        console.error('Failed to load student detail', requestError)
        setStudent(null)
        setStatus('error')
        setError(errorLabel)
      }
    }

    loadStudent()

    return () => {
      isCancelled = true
      controller.abort()
    }
  }, [errorLabel, language, logout, onBreadcrumbChange, studentId, token])

  useEffect(() => {
    setFormValues((previous) => ({
      ...previous,
      ...buildFormStateFromStudent(student),
    }))
  }, [student])

  const handleFormChange = (field: keyof FormState, value: FormState[keyof FormState]) => {
    setFormValues((previous) => ({
      ...previous,
      [field]: typeof value === 'string' ? value : value ?? '',
    }))
  }

  const getSortState = useCallback((tabKey: string) => sortStates[tabKey], [sortStates])

  const tabConfig: Record<
    TabKey,
    {
      endpoint: string
      setRows: Dispatch<SetStateAction<unknown[]>>
      setStatus: Dispatch<SetStateAction<LoadStatus>>
      setError: Dispatch<SetStateAction<string>>
      setFetched: Dispatch<SetStateAction<boolean>>
    }
  > = useMemo(
    () => ({
      tuition: {
        endpoint: 'payments/monthly-payment/student-detail',
        setRows: setTuitionRows,
        setStatus: setTuitionStatus,
        setError: setTuitionError,
        setFetched: setTuitionFetched,
      },
      payments: {
        endpoint: 'payments/student-payments',
        setRows: setPayments,
        setStatus: setPaymentsStatus,
        setError: setPaymentsError,
        setFetched: setPaymentsFetched,
      },
      requests: {
        endpoint: 'payments/student-requests',
        setRows: setRequests,
        setStatus: setRequestsStatus,
        setError: setRequestsError,
        setFetched: setRequestsFetched,
      },
      topups: {
        endpoint: 'reports/balance-recharges',
        setRows: setTopups,
        setStatus: setTopupsStatus,
        setError: setTopupsError,
        setFetched: setTopupsFetched,
      },
    }),
    [],
  )

  const fetchTabRows = useCallback(
    async (
      tabKey: TabKey,
      {
        sort,
        signal,
      }: { sort?: { orderBy?: string; orderDir?: string }; signal?: AbortSignal } = {},
    ) => {
      if (!studentId || !tabConfig[tabKey]) {
        return
      }

      const { endpoint, setRows, setStatus, setError, setFetched } = tabConfig[tabKey]
      const sortState = sort || getSortState(tabKey)
      const params = new URLSearchParams({
        lang: language ?? 'es',
        limit: String(TABLE_LIMIT),
      })

      const shouldUseUserId = endpoint === 'reports/balance-recharges'
      const identifier = shouldUseUserId ? student?.user_id : studentId
      const identifierKey = shouldUseUserId ? 'user_id' : 'student_id'

      if (!identifier) {
        setStatus('error')
        setError('No fue posible cargar la información.')
        return
      }

      params.set(identifierKey, String(identifier))

      if (sortState?.orderBy) {
        params.set('order_by', sortState.orderBy)
      }

      if (sortState?.orderDir) {
        params.set('order_dir', sortState.orderDir)
      }

      try {
        setStatus('loading')
        setError('')

        const response = await fetch(`${API_BASE_URL}/${endpoint}?${params.toString()}`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal,
        })

        if (!response.ok) {
          handleExpiredToken(response, logout)
          throw new Error('Failed to load table data')
        }

        const payload = await response.json()
        const content = Array.isArray(payload?.content)
          ? payload.content
          : Array.isArray(payload)
            ? payload
            : []

        setRows(content)
        setFetched(true)
        setStatus('success')
      } catch (requestError) {
        if ((requestError as Error)?.name === 'AbortError') {
          return
        }

        console.error('Failed to load table', tabKey, requestError)
        setStatus('error')
        setError('No fue posible cargar la información.')
      }
    },
    [getSortState, language, logout, student, studentId, tabConfig, token],
  )

  useEffect(() => {
    if (!studentId) {
      return undefined
    }

    const controller = new AbortController()
    fetchTabRows('tuition', { signal: controller.signal })

    return () => controller.abort()
  }, [fetchTabRows, studentId])

  useEffect(() => {
    if (!studentId) {
      return undefined
    }

    const controller = new AbortController()

    if (activeTab === 'payments' && !paymentsFetched) {
      fetchTabRows('payments', { signal: controller.signal })
    }

    if (activeTab === 'requests' && !requestsFetched) {
      fetchTabRows('requests', { signal: controller.signal })
    }

    if (activeTab === 'topups' && !topupsFetched) {
      fetchTabRows('topups', { signal: controller.signal })
    }

    return () => controller.abort()
  }, [activeTab, fetchTabRows, paymentsFetched, requestsFetched, studentId, topupsFetched])

  const isLoading = status === 'loading'
  const tuitionLoading = tuitionStatus === 'loading'
  const paymentsLoading = paymentsStatus === 'loading'
  const requestsLoading = requestsStatus === 'loading'
  const topupsLoading = topupsStatus === 'loading'

  const handleOpenMonthDetail = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (row: TuitionRow, month: string, details: any) => {
      void row
      void month
      void details
    },
    [],
  )

  const handleOpenPayment = useCallback((paymentId: number) => {
    void paymentId
  }, [])

  const handleOpenRequest = useCallback((requestId: number) => {
    void requestId
  }, [])

  const tabs = useMemo(
    () => [
      {
        key: 'tuition',
        label: t('tuitionLabel'),
        content: (
          <TuitionTable
            data={tuitionRows}
            isLoading={tuitionLoading}
            locale={locale}
            t={t}
            onOpenMonthDetail={handleOpenMonthDetail}
          />
        ),
      },
      {
        key: 'payments',
        label: t('paymentsLabel'),
        content: (
          <PaymentsTable
            data={payments}
            isLoading={paymentsLoading}
            locale={locale}
            t={t}
            onViewPayment={handleOpenPayment}
            pagination={paymentsPagination}
          />
        ),
      },
      {
        key: 'requests',
        label: t('requestsLabel'),
        content: (
          <RequestsTable
            data={requests}
            isLoading={requestsLoading}
            locale={locale}
            t={t}
            onViewRequest={handleOpenRequest}
            pagination={requestsPagination}
          />
        ),
      },
      {
        key: 'topups',
        label: t('topupsLabel'),
        content: (
          <TopupsTable
            data={topups}
            isLoading={topupsLoading}
            locale={locale}
            t={t}
            pagination={topupsPagination}
          />
        ),
      },
    ],
    [
      handleOpenMonthDetail,
      handleOpenPayment,
      handleOpenRequest,
      locale,
      payments,
      paymentsLoading,
      paymentsPagination,
      requests,
      requestsLoading,
      requestsPagination,
      t,
      topups,
      topupsLoading,
      topupsPagination,
      tuitionLoading,
      tuitionRows,
    ],
  )

  const statusLabels = useMemo(
    () => ({
      active: t('schoolStatusActive'),
      inactive: t('schoolStatusInactive'),
    }),
    [t],
  )

  const studentName = useMemo(() => {
    if (!student) {
      return t('student')
    }

    const resolvedFullName = student.fullName ?? student.full_name
    if (resolvedFullName && resolvedFullName.trim().length > 0) {
      return resolvedFullName.trim()
    }

    const parts = [
      student.firstName ?? student.first_name,
      student.lastName ?? student.last_name_father,
      student.last_name_mother,
    ]
      .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)

    if (parts.length) {
      return parts.join(' ')
    }

    return student.email ?? t('student')
  }, [student, t])

  const studentInitials = useMemo(() => {
    if (!student) return ''

    const names = [
      student.firstName ?? student.first_name,
      student.lastName ?? student.last_name_father,
      student.last_name_mother,
    ].filter((part): part is string => typeof part === 'string' && part.trim().length > 0)

    if (!names.length && student.fullName) {
      return student.fullName
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('')
        .slice(0, 2)
    }

    if (!names.length && student.email) {
      return student.email.substring(0, 2).toUpperCase()
    }

    return names
      .join(' ')
      .split(' ')
      .filter(Boolean)
      .map((namePart) => namePart[0]?.toUpperCase() ?? '')
      .join('')
      .slice(0, 2)
  }, [student])

  const normalizeStatus = (value?: string) => value?.toLowerCase().trim()

  useEffect(() => {
    setUserStatusDraft(normalizeStatus(student?.status) === normalizeStatus(statusLabels.active))
  }, [statusLabels.active, student])

  const activeInGroupLabel = locale === 'es' ? 'Activo en grupo' : 'Active in group'
  const resetPasswordLabel = locale === 'es' ? 'Restablecer contraseña' : 'Reset password'

  const handleStartEdit = () => setIsEditing(true)

  const handleCancelEdit = () => {
    setIsEditing(false)
    setUserStatusDraft(normalizeStatus(student?.status) === normalizeStatus(statusLabels.active))
  }

  const handleSave = () => {
    setIsSaving(true)
    setIsEditing(false)
    setIsSaving(false)
  }

  const statusTone =
    normalizeStatus(student?.status) === normalizeStatus(statusLabels.active) ? 'success' : 'warning'

  if (!hydrated) {
    return (
      <Layout onNavigate={onNavigate} pageTitle={t('studentsTitle')} breadcrumbItems={breadcrumbItems}>
        <LoadingSkeleton variant="table" rowCount={10} />
      </Layout>
    )
  }

  return (
    <Layout onNavigate={onNavigate} pageTitle={t('studentsTitle')} breadcrumbItems={breadcrumbItems}>
      <div className="d-flex flex-column gap-3">
        {error ? (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        ) : null}

        <StudentHeader
          isLoading={isLoading}
          initials={studentInitials}
          studentName={studentName}
          activeInGroupLabel={activeInGroupLabel}
          statusChipLabel={student?.status ?? statusLabels.inactive}
          roleChipLabel={student?.institutionName ?? t('student')}
          statusTone={statusTone}
          isEditing={isEditing}
          isSaving={isSaving}
          isStatusActive={userStatusDraft}
          statusLabels={statusLabels}
          onStatusToggle={setUserStatusDraft}
          onStartEdit={handleStartEdit}
          onCancelEdit={handleCancelEdit}
          onSave={handleSave}
          editButtonLabel={t('edit')}
          cancelButtonLabel={t('cancel')}
          saveButtonLabel={t('save')}
          savingLabel={t('saving')}
          resetPasswordLabel={resetPasswordLabel}
          disableActions={isLoading}
        />

        <div className="row g-3">
          <div className="col-12 col-lg-6">
            <StudentInstitutionCard
              student={student}
              formValues={formValues}
              formErrors={formErrors}
              isEditing={isEditing}
              onChange={handleFormChange}
              catalogs={catalogs}
            />
          </div>
          <div className="col-12 col-lg-6">
            <StudentContactCard
              student={student}
              formValues={formValues}
              formErrors={formErrors}
              isEditing={isEditing}
              onChange={handleFormChange}
            />
          </div>
        </div>

        <TabbedSection tabs={tabs} activeKey={activeTab} onTabChange={setActiveTab} />
      </div>
    </Layout>
  )
}
