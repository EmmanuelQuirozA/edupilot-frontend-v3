import { useCallback, useEffect, useMemo, useState } from 'react'
import Tabs from '../../components/ui/Tabs'
import { Layout } from '../../layout/Layout'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { API_BASE_URL } from '../../config'
import type {
  PaymentRecurrenceRow,
  PaymentRequestRow,
  PaymentRow,
  TuitionRow,
} from './types'
import { TuitionTable } from './components/TuitionTable'
import { PaymentsTable } from './components/PaymentsTable'
import { PaymentRequestsTable } from './components/PaymentRequestsTable'
import { PaymentRecurrencesTable } from './components/PaymentRecurrencesTable'
import { createUrlSearchParams, handleExpiredToken } from './utils'
import './PaymentsFinancePage.css'

interface PaymentsFinancePageProps {
  onNavigate: (path: string) => void
}

type TabKey = 'tuition' | 'requests' | 'payments'
type OrderDirection = 'ASC' | 'DESC'

type SortState = {
  key: string
  direction: OrderDirection
}

const DEFAULT_PAGE_SIZE = 10

export function PaymentsFinancePage({ onNavigate }: PaymentsFinancePageProps) {
  const { locale } = useLanguage()
  const { token, logout } = useAuth()

  const [activeTab, setActiveTab] = useState<TabKey>('tuition')
  const [requestsView, setRequestsView] = useState<'history' | 'scheduled'>('history')

  const [tuitionRows, setTuitionRows] = useState<TuitionRow[]>([])
  const [tuitionLoading, setTuitionLoading] = useState(false)
  const [tuitionError, setTuitionError] = useState<string | null>(null)
  const [tuitionTotalElements, setTuitionTotalElements] = useState(0)
  const [tuitionPage] = useState(0)

  const [paymentsRows, setPaymentsRows] = useState<PaymentRow[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [paymentsError, setPaymentsError] = useState<string | null>(null)
  const [paymentsTotalElements, setPaymentsTotalElements] = useState(0)
  const [paymentsPage, setPaymentsPage] = useState(0)
  const [paymentsSort, setPaymentsSort] = useState<SortState>({ key: 'payment_id', direction: 'ASC' })

  const [requestsRows, setRequestsRows] = useState<PaymentRequestRow[]>([])
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [requestsError, setRequestsError] = useState<string | null>(null)
  const [requestsTotalElements, setRequestsTotalElements] = useState(0)
  const [requestsPage, setRequestsPage] = useState(0)
  const [requestsSort, setRequestsSort] = useState<SortState>({ key: 'payment_request_id', direction: 'ASC' })

  const [recurrenceRows, setRecurrenceRows] = useState<PaymentRecurrenceRow[]>([])
  const [recurrenceLoading, setRecurrenceLoading] = useState(false)
  const [recurrenceError, setRecurrenceError] = useState<string | null>(null)
  const [recurrenceTotalElements, setRecurrenceTotalElements] = useState(0)
  const [recurrencePage, setRecurrencePage] = useState(0)
  const [recurrenceSort, setRecurrenceSort] = useState<SortState>({
    key: 'payment_request_scheduled_id',
    direction: 'ASC',
  })

  const isRequestsHistoryView = requestsView === 'history'
  const isRequestsScheduledView = requestsView === 'scheduled'

  const tableStrings = useMemo(
    () => ({
      title: locale === 'es' ? 'Finanzas' : 'Finances',
      breadcrumb: locale === 'es' ? 'Pagos' : 'Payments',
      error: locale === 'es' ? 'Error al cargar la información' : 'Error loading data',
      unknownError: locale === 'es' ? 'Error desconocido' : 'Unknown error',
      tuitionEmpty: locale === 'es' ? 'No hay colegiaturas registradas' : 'No tuition records available',
      columnLabels: {
        student: locale === 'es' ? 'Alumno' : 'Student',
        generation: locale === 'es' ? 'Generación' : 'Generation',
      },
    }),
    [locale],
  )

  const paymentsTableStrings = useMemo(
    () => ({
      empty: locale === 'es' ? 'No hay pagos registrados' : 'No payments found',
      error: locale === 'es' ? 'No fue posible cargar los pagos' : 'Could not load payments',
      columns: {
        id: locale === 'es' ? 'Folio' : 'ID',
        student: locale === 'es' ? 'Alumno' : 'Student',
        concept: locale === 'es' ? 'Concepto' : 'Concept',
        amount: locale === 'es' ? 'Monto' : 'Amount',
        actions: locale === 'es' ? 'Acciones' : 'Actions',
      },
    }),
    [locale],
  )

  const requestsTableStrings = useMemo(
    () => ({
      empty: locale === 'es' ? 'No hay solicitudes registradas' : 'No requests found',
      error: locale === 'es' ? 'No fue posible cargar las solicitudes' : 'Could not load payment requests',
      columns: {
        id: locale === 'es' ? 'Solicitud' : 'Request',
        student: locale === 'es' ? 'Alumno' : 'Student',
        concept: locale === 'es' ? 'Concepto' : 'Concept',
        amount: locale === 'es' ? 'Monto' : 'Amount',
        status: locale === 'es' ? 'Estatus' : 'Status',
        dueDate: locale === 'es' ? 'Fecha límite' : 'Due date',
        actions: locale === 'es' ? 'Acciones' : 'Actions',
      },
    }),
    [locale],
  )

  const requestsRecurrencesTableStrings = useMemo(
    () => ({
      empty: locale === 'es' ? 'No hay solicitudes agendadas' : 'No scheduled requests',
      error: locale === 'es' ? 'No fue posible cargar las recurrencias' : 'Could not load recurrences',
      columns: {
        id: locale === 'es' ? 'Programación' : 'Schedule',
        ruleName: locale === 'es' ? 'Regla' : 'Rule',
        concept: locale === 'es' ? 'Concepto' : 'Concept',
        recurrenceType: locale === 'es' ? 'Tipo' : 'Type',
        appliesTo: locale === 'es' ? 'Aplica a' : 'Applies to',
        amount: locale === 'es' ? 'Monto' : 'Amount',
        nextExecutionDate: locale === 'es' ? 'Próxima ejecución' : 'Next execution',
        active: locale === 'es' ? 'Activa' : 'Active',
        actions: locale === 'es' ? 'Acciones' : 'Actions',
      },
    }),
    [locale],
  )

  const tabs = useMemo(
    () => [
      { key: 'tuition', label: locale === 'es' ? 'Colegiaturas' : 'Tuitions' },
      { key: 'requests', label: locale === 'es' ? 'Solicitudes de pago' : 'Payment requests' },
      { key: 'payments', label: locale === 'es' ? 'Pagos' : 'Payments' },
    ],
    [locale],
  )

  const tuitionFilters = useMemo(
    () =>
      createUrlSearchParams(new URLSearchParams({ lang: locale }), {
        page: tuitionPage,
        size: DEFAULT_PAGE_SIZE,
      }),
    [locale, tuitionPage],
  )
  const paymentsQueryParams = useMemo(
    () =>
      createUrlSearchParams(new URLSearchParams({ lang: locale }), {
        page: paymentsPage,
        size: DEFAULT_PAGE_SIZE,
        order_by: paymentsSort.key,
        order_dir: paymentsSort.direction,
      }),
    [locale, paymentsPage, paymentsSort.direction, paymentsSort.key],
  )

  const requestsQueryParams = useMemo(
    () =>
      createUrlSearchParams(new URLSearchParams({ lang: locale }), {
        page: requestsPage,
        size: DEFAULT_PAGE_SIZE,
        order_by: requestsSort.key,
        order_dir: requestsSort.direction,
      }),
    [locale, requestsPage, requestsSort.direction, requestsSort.key],
  )

  const recurrenceQueryParams = useMemo(
    () =>
      createUrlSearchParams(new URLSearchParams({ lang: locale }), {
        page: recurrencePage,
        size: DEFAULT_PAGE_SIZE,
        order_by: recurrenceSort.key,
        order_dir: recurrenceSort.direction,
      }),
    [locale, recurrencePage, recurrenceSort.direction, recurrenceSort.key],
  )

  const fetchTuitionPayments = useCallback(async () => {
    if (activeTab !== 'tuition' || !token) {
      return
    }

    setTuitionLoading(true)
    setTuitionError(null)

    try {
      const url = `${API_BASE_URL}/reports/payments/report?${tuitionFilters.toString()}`
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      if (!response.ok) {
        handleExpiredToken(response, logout)
        throw new Error(tableStrings.error)
      }

      const payload = await response.json()
      const content = Array.isArray(payload?.content) ? payload.content : []
      setTuitionRows(content)
      setTuitionTotalElements(Number(payload?.totalElements) || content.length || 0)
    } catch (requestError) {
      console.error('Payments fetch error', requestError)
      const fallbackMessage =
        requestError instanceof Error && requestError.message
          ? requestError.message
          : tableStrings.unknownError
      setTuitionError(fallbackMessage)
    } finally {
      setTuitionLoading(false)
    }
  }, [activeTab, logout, tableStrings.error, tableStrings.unknownError, token, tuitionFilters])

  const fetchPaymentsList = useCallback(async () => {
    if (activeTab !== 'payments' || !token) {
      return
    }

    setPaymentsLoading(true)
    setPaymentsError(null)

    try {
      const url = `${API_BASE_URL}/reports/payments?${paymentsQueryParams.toString()}`
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      if (!response.ok) {
        handleExpiredToken(response, logout)
        throw new Error(paymentsTableStrings.error)
      }

      const payload = await response.json()
      const content = Array.isArray(payload?.content) ? payload.content : []
      setPaymentsRows(content)
      setPaymentsTotalElements(Number(payload?.totalElements) || content.length || 0)
    } catch (requestError) {
      console.error('Payments list fetch error', requestError)
      const fallbackMessage =
        requestError instanceof Error && requestError.message
          ? requestError.message
          : paymentsTableStrings.error ?? tableStrings.unknownError
      setPaymentsError(fallbackMessage)
    } finally {
      setPaymentsLoading(false)
    }
  }, [activeTab, logout, paymentsQueryParams, paymentsTableStrings.error, tableStrings.unknownError, token])

  const fetchPaymentRequests = useCallback(async () => {
    if (activeTab !== 'requests' || !isRequestsHistoryView || !token) {
      return
    }

    setRequestsLoading(true)
    setRequestsError(null)

    try {
      const url = `${API_BASE_URL}/reports/paymentrequests?${requestsQueryParams.toString()}`
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      if (!response.ok) {
        handleExpiredToken(response, logout)
        throw new Error(requestsTableStrings.error)
      }

      const payload = await response.json()
      const content = Array.isArray(payload?.content) ? payload.content : []
      setRequestsRows(content)
      setRequestsTotalElements(Number(payload?.totalElements) || content.length || 0)
    } catch (requestError) {
      console.error('Payment requests fetch error', requestError)
      const fallbackMessage =
        requestError instanceof Error && requestError.message
          ? requestError.message
          : requestsTableStrings.error ?? tableStrings.unknownError
      setRequestsError(fallbackMessage)
    } finally {
      setRequestsLoading(false)
    }
  }, [
    activeTab,
    logout,
    requestsQueryParams,
    requestsTableStrings.error,
    isRequestsHistoryView,
    tableStrings.unknownError,
    token,
  ])

  const fetchPaymentRecurrences = useCallback(async () => {
    if (activeTab !== 'requests' || !isRequestsScheduledView || !token) {
      return
    }

    setRecurrenceLoading(true)
    setRecurrenceError(null)

    try {
      const url = `${API_BASE_URL}/reports/payment-request-schedule?${recurrenceQueryParams.toString()}`
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      if (!response.ok) {
        handleExpiredToken(response, logout)
        throw new Error(
          requestsRecurrencesTableStrings.error ?? tableStrings.unknownError,
        )
      }

      const payload = await response.json()
      const content = Array.isArray(payload?.content) ? payload.content : []
      setRecurrenceRows(content)
      setRecurrenceTotalElements(Number(payload?.totalElements) || content.length || 0)
    } catch (requestError) {
      console.error('Payment schedule fetch error', requestError)
      const fallbackMessage =
        requestError instanceof Error && requestError.message
          ? requestError.message
          : requestsRecurrencesTableStrings.error ?? tableStrings.unknownError
      setRecurrenceError(fallbackMessage)
    } finally {
      setRecurrenceLoading(false)
    }
  }, [
    activeTab,
    logout,
    recurrenceQueryParams,
    requestsRecurrencesTableStrings.error,
    isRequestsScheduledView,
    tableStrings.unknownError,
    token,
  ])

  useEffect(() => {
    fetchTuitionPayments()
  }, [fetchTuitionPayments])

  useEffect(() => {
    fetchPaymentsList()
  }, [fetchPaymentsList])

  useEffect(() => {
    fetchPaymentRequests()
  }, [fetchPaymentRequests])

  useEffect(() => {
    fetchPaymentRecurrences()
  }, [fetchPaymentRecurrences])

  const handlePaymentsSort = (key: string) => {
    setPaymentsPage(0)
    setPaymentsSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'ASC' ? 'DESC' : 'ASC',
    }))
  }

  const renderPaymentsSortIndicator = (key: string) => {
    const isActive = paymentsSort.key === key
    const direction = paymentsSort.direction
    return <SortIndicator isActive={isActive} direction={direction} />
  }

  const handleRequestsSort = (key: string) => {
    setRequestsPage(0)
    setRequestsSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'ASC' ? 'DESC' : 'ASC',
    }))
  }

  const renderRequestsSortIndicator = (key: string) => {
    const isActive = requestsSort.key === key
    const direction = requestsSort.direction
    return <SortIndicator isActive={isActive} direction={direction} />
  }

  const handleRecurrenceSort = (key: string) => {
    setRecurrencePage(0)
    setRecurrenceSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'ASC' ? 'DESC' : 'ASC',
    }))
  }

  const renderRecurrenceSortIndicator = (key: string) => {
    const isActive = recurrenceSort.key === key
    const direction = recurrenceSort.direction
    return <SortIndicator isActive={isActive} direction={direction} />
  }

  const breadcrumbItems = useMemo(
    () => [
      {
        label: tableStrings.title,
        onClick: () => onNavigate(`/${locale}/dashboard`),
      },
      { label: tableStrings.breadcrumb },
    ],
    [locale, onNavigate, tableStrings.breadcrumb, tableStrings.title],
  )

  const requestsViewSwitch = (
    <div className="btn-group" role="group" aria-label="Cambiar vista de solicitudes">
      <button
        type="button"
        className={`btn btn-outline-primary ${isRequestsHistoryView ? 'active' : ''}`}
        onClick={() => setRequestsView('history')}
      >
        {locale === 'es' ? 'Historial' : 'History'}
      </button>
      <button
        type="button"
        className={`btn btn-outline-primary ${isRequestsScheduledView ? 'active' : ''}`}
        onClick={() => setRequestsView('scheduled')}
      >
        {locale === 'es' ? 'Agendadas' : 'Scheduled'}
      </button>
    </div>
  )

  return (
    <Layout onNavigate={onNavigate} pageTitle={tableStrings.title} breadcrumbItems={breadcrumbItems}>
      <section className="payments-finance">
        <Tabs tabs={tabs} activeKey={activeTab} onSelect={(key) => setActiveTab(key as TabKey)} actions={activeTab === 'requests' ? requestsViewSwitch : undefined} />

        {activeTab === 'tuition' ? (
          <>
            <TuitionTable
              rows={tuitionRows}
              isLoading={tuitionLoading}
              error={tuitionError}
              columnLabels={tableStrings.columnLabels}
              emptyLabel={tableStrings.tuitionEmpty}
            />
            <p className="payments-finance__meta text-muted small">
              {locale === 'es' ? 'Resultados' : 'Results'}: {tuitionTotalElements}
            </p>
          </>
        ) : null}

        {activeTab === 'payments' ? (
          <>
            <PaymentsTable
              rows={paymentsRows}
              isLoading={paymentsLoading}
              error={paymentsError}
              strings={paymentsTableStrings}
              onSort={handlePaymentsSort}
              renderSortIndicator={renderPaymentsSortIndicator}
            />
            <p className="payments-finance__meta text-muted small">
              {locale === 'es' ? 'Resultados' : 'Results'}: {paymentsTotalElements}
            </p>
          </>
        ) : null}

        {activeTab === 'requests' && isRequestsHistoryView ? (
          <>
            <PaymentRequestsTable
              rows={requestsRows}
              isLoading={requestsLoading}
              error={requestsError}
              strings={requestsTableStrings}
              onSort={handleRequestsSort}
              renderSortIndicator={renderRequestsSortIndicator}
            />
            <p className="payments-finance__meta text-muted small">
              {locale === 'es' ? 'Resultados' : 'Results'}: {requestsTotalElements}
            </p>
          </>
        ) : null}

        {activeTab === 'requests' && isRequestsScheduledView ? (
          <>
            <PaymentRecurrencesTable
              rows={recurrenceRows}
              isLoading={recurrenceLoading}
              error={recurrenceError}
              strings={requestsRecurrencesTableStrings}
              onSort={handleRecurrenceSort}
              renderSortIndicator={renderRecurrenceSortIndicator}
            />
            <p className="payments-finance__meta text-muted small">
              {locale === 'es' ? 'Resultados' : 'Results'}: {recurrenceTotalElements}
            </p>
          </>
        ) : null}
      </section>
    </Layout>
  )
}

function SortIndicator({ isActive, direction }: { isActive: boolean; direction: OrderDirection }) {
  return (
    <svg
      viewBox="0 0 12 12"
      aria-hidden="true"
      className={`finance-table__sort-icon ${isActive ? `finance-table__sort-icon--${direction.toLowerCase()}` : ''}`}
      focusable="false"
    >
      <path d="M6 2l3 4H3l3-4Z" />
      <path d="M6 10l3-4H3l3 4Z" />
    </svg>
  )
}
