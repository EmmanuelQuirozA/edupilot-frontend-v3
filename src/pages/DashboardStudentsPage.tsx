import { useCallback, useEffect, useMemo, useState } from 'react'
import { DataTable, type DataTableColumn, type DataTablePagination } from '../components/DataTable'
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

interface PaginatedResponse<T> {
  content?: T[]
  totalElements?: number
  page?: number
  size?: number
  totalPages?: number
}

interface GroupedPaymentItem {
  paymentId: number
  amount: number
  partConceptName: string
  paymentThroughName: string
  paymentStatusName: string
  paymentCreatedAt: string
  paymentMonth?: string | null
}

interface GroupedPaymentMonth {
  month: number
  total: number
  items: GroupedPaymentItem[]
}

interface GroupedPaymentYear {
  year: number
  months: GroupedPaymentMonth[]
}

export function DashboardStudentsPage({ onNavigate }: DashboardStudentsPageProps) {
  const { t, locale } = useLanguage()
  const { token } = useAuth()

  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 992)

  const [pendingTotals, setPendingTotals] = useState<PendingTotalsResponse | null>(null)
  const [isPendingLoading, setIsPendingLoading] = useState(false)
  const [pendingError, setPendingError] = useState<string | null>(null)

  const [studentInfo, setStudentInfo] = useState<StudentReadOnlyResponse | null>(null)
  const [isStudentInfoLoading, setIsStudentInfoLoading] = useState(false)
  const [studentInfoError, setStudentInfoError] = useState<string | null>(null)

  const [payments, setPayments] = useState<PaymentResponse[]>([])
  const [groupedPayments, setGroupedPayments] = useState<GroupedPaymentYear[]>([])
  const [isPaymentsLoading, setIsPaymentsLoading] = useState(false)
  const [paymentsError, setPaymentsError] = useState<string | null>(null)
  const [paymentsPage, setPaymentsPage] = useState(0)
  const [paymentsPageSize, setPaymentsPageSize] = useState(10)
  const [paymentsTotalPages, setPaymentsTotalPages] = useState(0)
  const [paymentsTotalElements, setPaymentsTotalElements] = useState(0)

  const currencyFormatter = useMemo(() => createCurrencyFormatter(locale, 'MXN'), [locale])

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 992)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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
    setPaymentsPage(0)
  }, [isDesktop])

  useEffect(() => {
    if (!token) return
    const controller = new AbortController()

    const loadDesktopPayments = async () => {
      setIsPaymentsLoading(true)
      setPaymentsError(null)
      setGroupedPayments([])
      try {
        const params = new URLSearchParams({
          lang: locale,
          offset: String(paymentsPage * paymentsPageSize),
          limit: String(paymentsPageSize),
        })

        const response = await fetch(`${API_BASE_URL}/reports/paymentsStudent?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const payload = (await response.json()) as PaginatedResponse<PaymentResponse>
        const content = payload.content ?? []
        setPayments(content)
        setPaymentsTotalElements(payload.totalElements ?? content.length)
        setPaymentsTotalPages(payload.totalPages ?? 1)
        setPaymentsPage(payload.page ?? paymentsPage)
        setPaymentsPageSize(payload.size ?? paymentsPageSize)
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setPaymentsError(t('defaultError'))
        }
      } finally {
        setIsPaymentsLoading(false)
      }
    }

    const loadMobilePayments = async () => {
      setIsPaymentsLoading(true)
      setPaymentsError(null)
      setPayments([])
      try {
        const response = await fetch(`${API_BASE_URL}/payments/grouped?lang=${locale}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const payload = (await response.json()) as GroupedPaymentYear[]
        setGroupedPayments(payload)
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setPaymentsError(t('defaultError'))
        }
      } finally {
        setIsPaymentsLoading(false)
      }
    }

    if (isDesktop) {
      loadDesktopPayments()
    } else {
      loadMobilePayments()
    }

    return () => controller.abort()
  }, [isDesktop, locale, paymentsPage, paymentsPageSize, t, token])

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

  const formatDate = useCallback((value?: string | null) => {
    if (!value) return 'Sin fecha'
    const targetLocale = locale === 'es' ? 'es-MX' : 'en-US'
    return new Date(value).toLocaleDateString(targetLocale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }, [locale])

  const monthLabel = (month: number) => {
    const targetLocale = locale === 'es' ? 'es-MX' : 'en-US'
    return new Date(2000, month - 1, 1).toLocaleDateString(targetLocale, { month: 'long' })
  }

  const paymentsColumns: Array<DataTableColumn<PaymentResponse>> = useMemo(
    () => [
      {
        key: 'payment_id',
        label: 'ID',
      },
      {
        key: 'pt_name',
        label: 'Concepto',
      },
      {
        key: 'amount',
        label: 'Monto',
        currency: 'MXN',
      },
      {
        key: 'payment_status_name',
        label: 'Estado',
      },
      {
        key: 'payment_date',
        label: 'Fecha de pago',
        render: (row) => <span>{formatDate(row.payment_date ?? row.payment_created_at)}</span>,
      },
      {
        key: 'payment_reference',
        label: 'Referencia',
        render: (row) => row.payment_reference ?? '—',
      },
    ],
    [formatDate],
  )

  const totalPendingAmount = (pendingTotals?.pendingTotal ?? 0) + (pendingTotals?.lateFeeTotal ?? 0)

  return (
    <Layout onNavigate={onNavigate} pageTitle={t('portalTitle')}>
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
        <div>
          <p className="text-uppercase text-muted mb-1">Panel de estudiantes</p>
          <h2 className="fw-bold mb-2">{t('welcome')}</h2>
          <p className="text-muted mb-0">Consulta tus pendientes financieros y mantén tu cuenta al día.</p>
        </div>
        <button className="btn btn-outline-primary" onClick={() => onNavigate(`/${locale}`)}>Home</button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <p className="text-uppercase text-muted small mb-1">Total a pagar</p>
              {isPendingLoading ? (
                <p className="mb-0 text-muted">Cargando...</p>
              ) : pendingError ? (
                <p className="mb-0 text-danger">{pendingError}</p>
              ) : (
                <>
                  <h4 className="fw-bold mb-2">{currencyFormatter.format(totalPendingAmount)}</h4>
                  <p className="text-muted mb-0">
                    Pendiente: {currencyFormatter.format(pendingTotals?.pendingTotal ?? 0)} · Recargos:{' '}
                    {currencyFormatter.format(pendingTotals?.lateFeeTotal ?? 0)}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <p className="text-uppercase text-muted small mb-1">Saldo actual</p>
              {isStudentInfoLoading ? (
                <p className="mb-0 text-muted">Cargando...</p>
              ) : studentInfoError ? (
                <p className="mb-0 text-danger">{studentInfoError}</p>
              ) : (
                <>
                  <h4 className="fw-bold mb-2">{currencyFormatter.format(studentInfo?.balance ?? 0)}</h4>
                  <p className="text-muted mb-0">{studentInfo?.fullName ?? 'Tu cuenta'}</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <p className="text-uppercase text-muted small mb-1">Pagos recientes</p>
              <h6 className="fw-semibold">Gestiona tus comprobantes y estados</h6>
              <p className="text-muted small mb-0">
                Consulta el historial de pagos y verifica su estado en tiempo real desde este panel.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between mb-3">
        <div>
          <p className="text-uppercase text-muted small mb-1">Pagos</p>
          <h5 className="fw-bold mb-0">Historial de pagos</h5>
        </div>
        {paymentsError && <span className="text-danger small">{paymentsError}</span>}
      </div>

      {isDesktop ? (
        <DataTable
          columns={paymentsColumns}
          data={payments}
          isLoading={isPaymentsLoading}
          pagination={paymentsPagination}
          emptyMessage="No hay pagos para mostrar"
        />
      ) : (
        <div className="d-flex flex-column gap-3">
          {isPaymentsLoading ? (
            <div className="card shadow-sm">
              <div className="card-body text-muted">Cargando pagos...</div>
            </div>
          ) : groupedPayments.length === 0 ? (
            <div className="card shadow-sm">
              <div className="card-body text-muted">No hay pagos para mostrar</div>
            </div>
          ) : (
            groupedPayments.map((year) => (
              <div className="card shadow-sm" key={year.year}>
                <div className="card-header bg-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">Pagos {year.year}</h6>
                    <span className="badge bg-primary-subtle text-primary fw-semibold">{year.months.length} meses</span>
                  </div>
                </div>
                <div className="list-group list-group-flush">
                  {year.months.map((month) => (
                    <div key={`${year.year}-${month.month}`} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <strong className="text-capitalize">{monthLabel(month.month)}</strong>
                        <span className="fw-semibold">{currencyFormatter.format(month.total)}</span>
                      </div>
                      <div className="d-flex flex-column gap-2">
                        {month.items.map((item) => (
                          <div key={item.paymentId} className="p-2 rounded bg-light">
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="fw-semibold">{item.partConceptName}</span>
                              <span className="text-muted small">{currencyFormatter.format(item.amount)}</span>
                            </div>
                            <div className="d-flex justify-content-between text-muted small">
                              <span>{item.paymentStatusName}</span>
                              <span>{formatDate(item.paymentCreatedAt ?? item.paymentMonth)}</span>
                            </div>
                            <div className="text-muted small">Método: {item.paymentThroughName}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </Layout>
  )
}
