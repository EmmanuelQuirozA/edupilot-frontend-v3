import { useEffect, useMemo, useState } from 'react'
import { DataTable, type DataTableColumn } from '../../../components/DataTable'
import { DateRangePicker } from '../../../components/ui/DateRangePicker'
import { API_BASE_URL } from '../../../config'
import { useAuth } from '../../../context/AuthContext'
import { useLanguage } from '../../../context/LanguageContext'
import { createCurrencyFormatter } from '../../../utils/currencyFormatter'
import { TuitionPaymentModal } from '../../PaymentsFinancePage/components/TuitionPaymentModal'

type OrderDirection = 'ASC' | 'DESC'

interface PaymentEntry {
  amount: number
  created_at: string
  payment_id: number
  payment_status_id: number
  payment_status_name: string
}

interface PaymentMonthData {
  payments: PaymentEntry[]
  total_amount: number
  payment_month: string
  payment_request_id: number | null
}

interface ResultsColumns {
  payment_reference: string
  scholar_level_name: string
  class: string
  generation: string
  [key: string]: unknown
}

interface DataResponse {
  content: ResultsColumns[]
  totalElements: number
  page: number
  size: number
  totalPages: number
}

interface TuitionTableProps {
  studentId: number
  onNavigate: (path: string) => void
}

export function TuitionTable({ studentId, onNavigate }: TuitionTableProps) {
  const { token } = useAuth()
  const { locale, t } = useLanguage()

  const [rows, setRows] = useState<ResultsColumns[]>([])
  const [page, setPage] = useState(0)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [startMonth, setStartMonth] = useState('')
  const [endMonth, setEndMonth] = useState('')

  const [orderBy, setOrderBy] = useState('')
  const [orderDir, setOrderDir] = useState<OrderDirection>('ASC')
  const [monthColumns, setMonthColumns] = useState<string[]>([])
    const [selectedPayment, setSelectedPayment] = useState<{
      row: ResultsColumns
      monthKey: string
      details: PaymentMonthData
    } | null>(null)

  useEffect(() => {
    if (!token) return

    const controller = new AbortController()

    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const params = new URLSearchParams({
          lang: locale ?? 'es',
          student_id: String(studentId),
          offset: String(page * pageSize),
          limit: String(pageSize),
          exportAll: 'false',
          order_by: orderBy,
          order_dir: orderDir,
        })

        if (startMonth) {
          params.set('start_date', `${startMonth}-01`)
        }

        if (endMonth) {
          params.set('end_date', `${endMonth}-01`)
        }

        const response = await fetch(`${API_BASE_URL}/reports/payments/report?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const data = (await response.json()) as DataResponse
        const nextRows = data.content ?? []
        setRows(nextRows)

        const staticColumns = new Set([
          'student_id',
          'g_enabled_raw',
          'u_enabled_raw',
          'user_status',
          'group_status',
          'student',
          'payment_reference',
          'scholar_level_name',
          'class',
          'generation',
        ])

        const dynamicColumns: string[] = []
        nextRows.forEach((row) => {
          Object.keys(row).forEach((key) => {
            if (!staticColumns.has(key) && !dynamicColumns.includes(key)) {
              dynamicColumns.push(key)
            }
          })
        })

        setMonthColumns(dynamicColumns)
        setTotalElements(data.totalElements ?? 0)
        setTotalPages(data.totalPages ?? 0)
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          setError(t('defaultError'))
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    return () => controller.abort()
  }, [endMonth, locale, orderBy, orderDir, page, pageSize, startMonth, studentId, t, token])

  const handleSort = (columnKey: string) => {
    setPage(0)
    setOrderDir((prevDir) => (orderBy === columnKey ? (prevDir === 'ASC' ? 'DESC' : 'ASC') : 'ASC'))
    setOrderBy(columnKey)
  }

  const handleDateRangeChange = (range: Record<string, string | null>) => {
    setStartMonth(range.startMonth ?? '')
    setEndMonth(range.endMonth ?? '')
    setPage(0)
  }

  const currencyFormatter = useMemo(() => createCurrencyFormatter(locale, 'MXN'), [locale])

  const parsePaymentData = (rawValue: unknown): PaymentMonthData | null => {
    if (rawValue === null || rawValue === undefined) return null

    if (typeof rawValue === 'string') {
      try {
        return JSON.parse(rawValue) as PaymentMonthData
      } catch (parseError) {
        console.error('Unable to parse payment data', parseError)
        return null
      }
    }

    return rawValue as PaymentMonthData
  }

  const groupColumns: Array<DataTableColumn<ResultsColumns>> = useMemo(() => {
    const baseColumns: Array<DataTableColumn<ResultsColumns>> = [
      {
        key: 'student',
        label: 'student',
      },
    ]

    const dynamicMonthColumns: Array<DataTableColumn<ResultsColumns>> = monthColumns.map((monthKey) => ({
      key: monthKey,
      label: monthKey,
      sortable: true,
      currency: 'MXN',
      render: (row) => {
        const paymentDetails = parsePaymentData(row[monthKey])

        if (!paymentDetails) return <span>-</span>

        const amountToShow = paymentDetails.total_amount ?? paymentDetails.payments?.[0]?.amount ?? 0

        return (
          <button
            type="button"
            className="btn btn-link p-0 fw-semibold text-decoration-none"
            onClick={() =>
              setSelectedPayment({
                row,
                monthKey,
                details: paymentDetails,
              })
            }
          >
            {currencyFormatter.format(amountToShow)}
          </button>
        )
      },
    }))

    return [...baseColumns, ...dynamicMonthColumns]
  }, [currencyFormatter, monthColumns])

  return (
    <div className="d-flex flex-column gap-3">
      {error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : null}

      <div className="card shadow-sm border-0">
        <div className="card-body d-flex flex-column gap-3 flex-lg-row align-items-lg-center justify-content-between">
          <div className="d-flex flex-column flex-lg-row align-items-lg-end gap-3 w-100">
            <DateRangePicker
              granularity="month"
              startKey="startMonth"
              endKey="endMonth"
              startLabel={t('startDate')}
              endLabel={t('endDate')}
              value={{ startMonth, endMonth }}
              onChange={handleDateRangeChange}
              className="w-100"
            />
          </div>
        </div>
      </div>

      <DataTable
        columns={groupColumns}
        data={rows}
        isLoading={isLoading}
        emptyMessage={t('tableNoData')}
        sortBy={orderBy}
        sortDirection={orderDir}
        onSort={(columnKey) => handleSort(columnKey)}
      />
      
      <TuitionPaymentModal
        isOpen={Boolean(selectedPayment)}
        onClose={() => setSelectedPayment(null)}
        paymentData={selectedPayment?.details}
        monthLabel={selectedPayment?.monthKey ?? ''}
        onNavigate={onNavigate}
        studentData={selectedPayment?.row}
      />
    </div>
  )
}
