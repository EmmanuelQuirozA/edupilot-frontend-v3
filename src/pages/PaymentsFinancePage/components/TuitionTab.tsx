import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useLanguage } from '../../../context/LanguageContext'
import { API_BASE_URL } from '../../../config'
import { DataTable, type DataTableColumn } from '../../../components/DataTable'
import SearchInput from '../../../components/ui/SearchInput';
import StudentTableCell from '../../../components/ui/StudentTableCell';
import { DateRangePicker } from '../../../components/ui/DateRangePicker'
import { createCurrencyFormatter } from '../../../utils/currencyFormatter'
import { TuitionPaymentModal } from './TuitionPaymentModal'

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
  student_id: number
  g_enabled_raw: boolean
  u_enabled_raw: boolean
  user_status: string
  group_status: string
  student: string
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

export function TuitionTab() {
  const { token } = useAuth()
  const { locale, t } = useLanguage()

  // 
  const [rows, setRows] = useState<ResultsColumns[]>([])
  const [Page, setPage] = useState(0)
  const [PageSize] = useState(10)
  const [TotalPages, setTotalPages] = useState(0)
  const [TotalElements, setTotalElements] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')

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

  // fetch data
  useEffect(() => {
    if (!token) return

    const controller = new AbortController()

    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const params = new URLSearchParams({
          lang: locale,
          offset: String(Page * PageSize),
          limit: String(PageSize),
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

        if (appliedSearch) {
          params.set('student', appliedSearch)
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
  }, [appliedSearch, orderBy, orderDir, Page, PageSize, endMonth, locale, startMonth, t, token])

  const handleSearchSubmit = () => {
    setAppliedSearch(searchTerm)
    setPage(0)
  }

  const handleClearSearch = () => {
    setSearchTerm('')
    setAppliedSearch('')
    setPage(0)
  }

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
      } catch (error) {
        console.error('Unable to parse payment data', error)
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
        sortable: true,
        render: (content) => (
          <StudentTableCell
            name={content.student}
            fallbackName={'tableStrings.studentFallback'}
            gradeGroup={content.class}
            scholarLevel={content.scholar_level_name}
            nameButtonProps={{ 'aria-label': content.student }}
          />
        ),
      },
      {
        key: 'generation',
        label: 'Generación',
        sortable: true,
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

        const amountToShow =
          paymentDetails.total_amount ?? paymentDetails.payments?.[0]?.amount ?? 0

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
    <>
      <div className="students-page d-flex flex-column gap-3">
        {error ? (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        ) : null}
      
        <>
          <div className="card shadow-sm border-0">
            <div className="card-body d-flex flex-column gap-3 flex-lg-row align-items-lg-center justify-content-between">
              <SearchInput
                value={searchTerm}
                onChange={(val) => setSearchTerm(val)}
                onSubmit={handleSearchSubmit}
                onClear={handleClearSearch}
                placeholder={t("searchBy")}
                className="flex-grow-1"
                inputClassName="w-100"
              />
              <div className="d-flex flex-column flex-lg-row align-items-lg-end gap-3">
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
                <button type="button" className="students-filter-button align-self-lg-center">
                  <svg
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                    className="students-filter-button__icon"
                    focusable="false"
                  >
                    <path d="M4 5.25C4 4.56 4.56 4 5.25 4h9a.75.75 0 0 1 .6 1.2L12 9.25v3.7a.75.75 0 0 1-.3.6l-2 1.5A.75.75 0 0 1 8.5 14V9.25L4.4 5.2A.75.75 0 0 1 4 4.5Z" />
                  </svg>
                  <span className="fw-semibold">Filtros</span>
                </button>
              </div>
            </div>
          </div>

          <DataTable
            columns={groupColumns}
            data={rows}
            isLoading={isLoading}
            emptyMessage={t('tableNoData')}
            pagination={{
              page: Page,
              size: PageSize,
              totalPages: TotalPages,
              totalElements: TotalElements,
              onPageChange: (nextPage) =>
                setPage(Math.max(0, Math.min(TotalPages - 1, nextPage))),
            }}
            sortBy={orderBy}
            sortDirection={orderDir}
            onSort={(columnKey) => handleSort(columnKey)}
          />

          <TuitionPaymentModal
            isOpen={Boolean(selectedPayment)}
            onClose={() => setSelectedPayment(null)}
            paymentData={selectedPayment?.details}
            monthLabel={selectedPayment?.monthKey ?? ''}
            studentData={selectedPayment?.row}
          />
        </>
      </div>
    </>
  )
}
