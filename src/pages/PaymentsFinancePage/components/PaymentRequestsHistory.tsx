import { useEffect, useMemo, useState } from 'react'
import { API_BASE_URL } from '../../../config'
import { DataTable, type DataTableColumn } from '../../../components/DataTable'
import { FilterSidebar, type FilterField, type FilterValues } from '../../../components/FilterSidebar'
import SearchInput from '../../../components/ui/SearchInput'
import StudentTableCell from '../../../components/ui/StudentTableCell'
import { useAuth } from '../../../context/AuthContext'
import { useLanguage } from '../../../context/LanguageContext'
import { formatDate } from '../../../utils/formatDate'

interface ResultsColumns {
  payment_request_id: number
  payment_reference: string
  student_full_name: string
  generation: string
  scholar_level_name: string
  grade_group: string
  pr_amount: number
  pr_created_at: Date
  pr_pay_by: Date
  late_fee: string
  fee_type: string
  late_fee_frequency: string
  payment_month: string
  student_id: number
  payment_status_id: number
  ps_pr_name: string
  pt_name: string
  total_amount_payments: Date
  latest_payment_date: Date
  late_fee_total: string
}

interface DataResponse {
  content: ResultsColumns[]
  totalElements: number
  page: number
  size: number
  totalPages: number
}

interface PaymentRequestsHistoryProps {
  onNavigate: (path: string) => void
  schoolOptions: FilterField['options']
  active: boolean
  tabs: Array<{ key: string; label: string }>
  onTabChange: (key: 'history' | 'scheduled') => void
}

const DEFAULT_PAGE_SIZE = 10

type OrderDirection = 'ASC' | 'DESC'

export function PaymentRequestsHistory({
  onNavigate,
  schoolOptions,
  active,
}: PaymentRequestsHistoryProps) {
  const { token } = useAuth()
  const { locale, t } = useLanguage()

  const [rows, setRows] = useState<ResultsColumns[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState<FilterValues>({})

  const [orderBy, setOrderBy] = useState('')
  const [orderDir, setOrderDir] = useState<OrderDirection>('ASC')

  const filterFields: FilterField[] = useMemo(
    () => [
      {
        key: 'payment_reference',
        label: 'Referencia de pago',
        placeholder: 'Ej. 123',
        type: 'text',
      },
      {
        key: 'generation',
        label: 'Generación',
        placeholder: 'Ej. 2024',
        type: 'text',
      },
      {
        key: 'grade_group',
        label: 'Grupo',
        placeholder: 'Ej. 6-A',
        type: 'text',
      },
      {
        key: 'school_id',
        label: 'Escuela',
        placeholder: 'Selecciona una escuela',
        type: 'select',
        options: schoolOptions,
      },
      {
        key: 'group_status',
        label: 'Grupo activo',
        type: 'checkbox',
      },
      {
        key: 'user_status',
        label: 'Usuario activo',
        type: 'checkbox',
      },
    ],
    [schoolOptions],
  )

  const activeFiltersCount = useMemo(
    () =>
      Object.values(appliedFilters).reduce((count, value) => {
        if (value === undefined || value === null) return count

        if (typeof value === 'string') {
          return value.trim() ? count + 1 : count
        }

        if (typeof value === 'boolean') {
          return value ? count + 1 : count
        }

        return count
      }, 0),
    [appliedFilters],
  )

  useEffect(() => {
    if (!token || !active) return

    const controller = new AbortController()

    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const params = new URLSearchParams({
          lang: locale,
          offset: String(page * DEFAULT_PAGE_SIZE),
          limit: String(DEFAULT_PAGE_SIZE),
          exportAll: 'false',
          order_by: orderBy,
          order_dir: orderDir,
        })

        if (appliedSearch) {
          params.set('student_full_name', appliedSearch)
        }

        const paymentReference = String(appliedFilters.payment_reference ?? '').trim()
        if (paymentReference) {
          params.set('payment_reference', paymentReference)
        }

        const gradeGroup = String(appliedFilters.grade_group ?? '').trim()
        if (gradeGroup) {
          params.set('grade_group', gradeGroup)
        }

        const generation = String(appliedFilters.generation ?? '').trim()
        if (generation) {
          params.set('generation', generation)
        }

        const schoolId = String(appliedFilters.school_id ?? '').trim()
        if (schoolId) {
          params.set('school_id', schoolId)
        }

        if (appliedFilters.group_status === true) {
          params.set('group_status', 'true')
        }

        if (appliedFilters.user_status === true) {
          params.set('user_status', 'true')
        }

        const response = await fetch(`${API_BASE_URL}/reports/paymentrequests?${params.toString()}`, {
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
  }, [appliedFilters, appliedSearch, orderBy, orderDir, page, active, locale, t, token])

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
    if (orderBy === columnKey) {
      setOrderDir((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'))
    } else {
      setOrderBy(columnKey)
      setOrderDir('ASC')
    }
  }

  const groupColumns: Array<DataTableColumn<ResultsColumns>> = useMemo(
    () => [
      { key: 'payment_request_id', label: 'ID', sortable: true },
      {
        key: 'student_full_name',
        label: 'student',
        sortable: true,
        render: (row) => (
          <StudentTableCell
            name={row.student_full_name}
            fallbackName={'tableStrings.studentFallback'}
            gradeGroup={row.grade_group}
            scholarLevel={row.scholar_level_name}
            onClick={() => onNavigate(`/${locale}/students&Classes/students/${row.student_id}`)}
            nameButtonProps={{ 'aria-label': row.student_full_name }}
          />
        ),
      },
      {
        key: 'ps_pr_name',
        label: 'status',
        sortable: true,
      },
      {
        key: 'pt_name',
        label: 'type',
        sortable: true,
      },
      {
        key: 'pr_amount',
        label: 'amount',
        sortable: true,
        currency: 'MXN',
      },
      {
        key: 'pr_pay_by',
        label: 'due_date',
        sortable: true,
        render: (content) => formatDate(content?.pr_pay_by, locale, { year: 'numeric', month: 'short', day: '2-digit' }),
      },
      {
        key: 'actions',
        label: t('tableActions'),
        sortable: false,
        render: (row) => (
          <button
            type="button"
            className="btn btn-link p-0"
            onClick={() => onNavigate(`/${locale}/finance/request/${row.payment_request_id}`)}
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
      {error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : null}

      <div className="card shadow-sm border-0">
        <div className="card-body d-flex flex-column gap-3 flex-md-row align-items-md-center justify-content-between">

          <SearchInput
            value={searchTerm}
            onChange={(val) => setSearchTerm(val)}
            onSubmit={handleSearchSubmit}
            onClear={handleClearSearch}
            placeholder={t('searchByStudent')}
            className="flex-grow-1"
            inputClassName="w-100"
          />

          <button type="button" className="students-filter-button" onClick={() => setFiltersOpen(true)}>
            <svg viewBox="0 0 20 20" aria-hidden="true" className="students-filter-button__icon" focusable="false">
              <path d="M4 5.25C4 4.56 4.56 4 5.25 4h9a.75.75 0 0 1 .6 1.2L12 9.25v3.7a.75.75 0 0 1-.3.6l-2 1.5A.75.75 0 0 1 8.5 14V9.25L4.4 5.2A.75.75 0 0 1 4 4.5Z" />
            </svg>
            <span className="fw-semibold">Filtros</span>
            {activeFiltersCount > 0 ? <span className="badge bg-primary rounded-pill ms-2">{activeFiltersCount}</span> : null}
          </button>
        </div>
      </div>

      <DataTable
        columns={groupColumns}
        data={rows}
        isLoading={isLoading}
        emptyMessage={t('tableNoData')}
        pagination={{
          page,
          size: DEFAULT_PAGE_SIZE,
          totalPages,
          totalElements,
          onPageChange: (nextPage) => setPage(Math.max(0, Math.min(totalPages - 1, nextPage))),
        }}
        sortBy={orderBy}
        sortDirection={orderDir}
        onSort={(columnKey) => handleSort(columnKey as keyof ResultsColumns)}
      />

      <FilterSidebar
        title="Filtrar reportes"
        subtitle="Aplica filtros para refinar la búsqueda"
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onClear={() => {
          setAppliedFilters({})
          setPage(0)
          setFiltersOpen(false)
        }}
        onApply={(values) => {
          setAppliedFilters(values ?? {})
          setPage(0)
          setFiltersOpen(false)
        }}
        fields={filterFields}
        initialValues={appliedFilters}
      />
    </>
  )
}

export type { ResultsColumns }
