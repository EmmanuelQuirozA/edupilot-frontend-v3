import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useLanguage } from '../../../context/LanguageContext'
import { API_BASE_URL } from '../../../config'
import { DataTable, type DataTableColumn } from '../../../components/DataTable'
import SearchInput from '../../../components/ui/SearchInput';
import StudentTableCell from '../../../components/ui/StudentTableCell';

type OrderDirection = 'ASC' | 'DESC'

interface ResultsColumns {
  payment_id: number
  student_id: number
  school_id: number
  payment_month: string
  amount: number
  payment_status_id: number
  payment_through_id: number
  payment_concept_id: number
  validated_at: Date
  payment_created_at: Date
  updated_at: Date
  comments: string
  pt_name: string
  payt_name: string
  payment_reference: string
  generation: string
  email: string
  personal_email: string
  student_full_name: string
  address: string
  phone_number: string
  school_description: string
  scholar_level_name: string
  g_enabled: boolean
  u_enabled: boolean
  sc_enabled: boolean
  school_status: string
  user_status: string
  group_status: string
  payment_status_name: string
  grade_group: string
  validator_full_name: string
  validator_phone_number: string
  validator_username: string
  payment_request_id: number
  receipt_path: string
  receipt_file_name: string
  payment_date: Date
}

interface DataResponse {
  content: ResultsColumns[]
  totalElements: number
  page: number
  size: number
  totalPages: number
}

interface PaymentsTabProps {
  onNavigate: (path: string) => void
}

export function PaymentsTab({ onNavigate }: PaymentsTabProps) {
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
  
  const [OrderBy, setOrderBy] = useState('')
  const [OrderDir, setOrderDir] = useState<OrderDirection>('ASC')

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
          order_by: OrderBy,
          order_dir: OrderDir,
        })

        if (appliedSearch) {
          params.set('student', appliedSearch)
        }

        const response = await fetch(`${API_BASE_URL}/reports/payments?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const data = (await response.json()) as DataResponse
        setRows(data.content ?? [])
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
  }, [appliedSearch, OrderBy, OrderDir, Page, PageSize, locale, t, token])

  const handleSearchSubmit = () => {
    setAppliedSearch(searchTerm)
    setPage(0)
  }

  const handleClearSearch = () => {
    setSearchTerm('')
    setAppliedSearch('')
    setPage(0)
  }

  const handleSort = (columnKey: keyof ResultsColumns) => {
    setPage(0)
    setOrderDir((prevDir) => (OrderBy === columnKey ? (prevDir === 'ASC' ? 'DESC' : 'ASC') : 'ASC'))
    setOrderBy(columnKey)
  }

  const groupColumns: Array<DataTableColumn<ResultsColumns>> = useMemo(
    () => [
      {
        key: 'payment_id',
        label: 'id',
        sortable: true,
      },
      {
        key: 'student',
        label: 'student',
        sortable: true,
        render: (row) => (
          <StudentTableCell
            name={row.student_full_name}
            fallbackName={'tableStrings.studentFallback'}
            gradeGroup={row.grade_group}
            scholarLevel={row.scholar_level_name}
            onClick={() => onNavigate(`/${locale}/students/${row.student_id}`)}
            nameButtonProps={{ 'aria-label': row.student_full_name }}
          />
        ),
      },
      {
        key: 'pt_name',
        label: 'paymentType',
        sortable: true,
      },
      { 
        key: 'payment_status_id', 
        label: t('schoolsStatusColumn'),
        sortable: true,
        render: (row) => (
          <small 
            className={'cell-chip px-4 text-nowrap ' + (row.payment_status_id === 3 ? 'bg-success' : row.payment_status_id === 1 ? 'bg-warning' : 'bg-danger')}
          > {row.payment_status_name} </small>
        ),
      },
      {
        key: 'amount',
        label: 'amount',
        sortable: true,
        currency: 'MXN'
      },
      {
        key: 'actions',
        label: t('tableActions'),
        sortable: false,
        render: (row) => (
          <button
            type="button"
            className="btn btn-link p-0"
            onClick={() => onNavigate(`/${locale}/finance/payments/${row.payment_id}`)}
          >
            {t('viewDetails')}
          </button>
        ),
      },
    ],
    [locale, onNavigate, t],
  )

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
            <div className="card-body d-flex flex-column gap-3 flex-md-row align-items-md-center justify-content-between">
              <SearchInput
                value={searchTerm}
                onChange={(val) => setSearchTerm(val)}
                onSubmit={handleSearchSubmit}
                onClear={handleClearSearch}
                placeholder={t("searchByStudent")}
                className="flex-grow-1"
                inputClassName="w-100"
              />
              <button type="button" className="students-filter-button">
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
            sortBy={OrderBy}
            sortDirection={OrderDir}
            onSort={(columnKey) => handleSort(columnKey as keyof ResultsColumns)}
          />
        </>
      </div>
    </>
  )
}
