import { useEffect, useMemo, useState } from 'react'
import { API_BASE_URL } from '../../../config'
import { DataTable, type DataTableColumn } from '../../../components/DataTable'
import { FilterSidebar, type FilterField, type FilterValues } from '../../../components/FilterSidebar'
import SearchInput from '../../../components/ui/SearchInput'
import StudentTableCell from '../../../components/ui/StudentTableCell'
import { useAuth } from '../../../context/AuthContext'
import { useLanguage } from '../../../context/LanguageContext'
import { formatDate } from '../../../utils/formatDate'

interface BalanceRecharge {
  balance_recharge_id: number
  user_id: number
  student_id: number | null
  created_at: string
  ticket: number
  amount: number
  full_name: string
  school_description: string
  generation: string | null
  scholar_level_name: string | null
  grade_group: string | null
}

interface DataResponse {
  content: BalanceRecharge[]
  totalElements: number
  page: number
  size: number
  totalPages: number
}

type OrderDirection = 'ASC' | 'DESC'

const DEFAULT_PAGE_SIZE = 10

interface BalanceRechargesTabProps {
  onNavigate: (path: string) => void
}

export function BalanceRechargesTab({ onNavigate }: BalanceRechargesTabProps) {
  const { token } = useAuth()
  const { locale, t } = useLanguage()

  const [rows, setRows] = useState<BalanceRecharge[]>([])
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
        key: 'user_id',
        label: 'ID de usuario',
        placeholder: 'Ej. 123',
        type: 'text',
      },
      {
        key: 'school_id',
        label: 'ID de escuela',
        placeholder: 'Ej. 456',
        type: 'text',
      },
      {
        key: 'created_at',
        label: 'Fecha (YYYY-MM-DD)',
        placeholder: 'Ej. 2025-10-10',
        type: 'text',
      },
    ],
    [],
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
    if (!token) return

    const controller = new AbortController()

    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const params = new URLSearchParams({
          lang: locale,
          offset: String(page * DEFAULT_PAGE_SIZE),
          limit: String(DEFAULT_PAGE_SIZE),
          export_all: 'false',
          order_by: orderBy,
          order_dir: orderDir,
        })

        if (appliedSearch) {
          params.set('full_name', appliedSearch)
        }

        const userId = String(appliedFilters.user_id ?? '').trim()
        if (userId) {
          params.set('user_id', userId)
        }

        const schoolId = String(appliedFilters.school_id ?? '').trim()
        if (schoolId) {
          params.set('school_id', schoolId)
        }

        const createdAt = String(appliedFilters.created_at ?? '').trim()
        if (createdAt) {
          params.set('created_at', createdAt)
        }

        const response = await fetch(`${API_BASE_URL}/reports/balance-recharges?${params.toString()}`, {
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
  }, [appliedFilters, appliedSearch, orderBy, orderDir, page, locale, t, token])

  const handleSearchSubmit = () => {
    setAppliedSearch(searchTerm)
    setPage(0)
  }

  const handleClearSearch = () => {
    setSearchTerm('')
    setAppliedSearch('')
    setPage(0)
  }

  const handleSort = (columnKey: keyof BalanceRecharge) => {
    if (orderBy === columnKey) {
      setOrderDir((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'))
    } else {
      setOrderBy(columnKey)
      setOrderDir('ASC')
    }
    setPage(0)
  }

  const columns: Array<DataTableColumn<BalanceRecharge>> = useMemo(
    () => [
      {
        key: 'balance_recharge_id',
        label: 'ID',
        sortable: true,
      },
      {
        key: 'full_name',
        label: 'Nombre',
        sortable: true,
        render: (row) =>
          row.student_id ? (
            <StudentTableCell
              name={row.full_name}
              gradeGroup={row.grade_group ?? undefined}
              scholarLevel={row.scholar_level_name ?? undefined}
              onClick={() => onNavigate(`/${locale}/students&Classes/students/${row.student_id}`)}
              nameButtonProps={{ 'aria-label': row.full_name }}
            />
          ) : (
            row.full_name
          ),
      },
      {
        key: 'school_description',
        label: 'Escuela',
        sortable: true,
      },
      {
        key: 'generation',
        label: 'Generación',
        sortable: true,
      },
      {
        key: 'amount',
        label: 'Monto',
        currency: 'MXN',
        sortable: true,
      },
      {
        key: 'created_at',
        label: 'Fecha',
        sortable: true,
        render: (row) => formatDate(row.created_at, locale, {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
      {
        key: 'ticket',
        label: 'Ticket',
        sortable: true,
      },
    ],
    [locale, onNavigate],
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
        columns={columns}
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
        onSort={(columnKey) => handleSort(columnKey as keyof BalanceRecharge)}
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
