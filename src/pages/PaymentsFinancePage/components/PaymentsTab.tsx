import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useLanguage } from '../../../context/LanguageContext'
import { API_BASE_URL } from '../../../config'
import { DataTable, type DataTableColumn } from '../../../components/DataTable'
import SearchInput from '../../../components/ui/SearchInput';
import StudentTableCell from '../../../components/ui/StudentTableCell';
import { FilterSidebar, type FilterField, type FilterValues } from '../../../components/FilterSidebar'
import ManualPaymentModal from './ManualPaymentModal'

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

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState<FilterValues>({})
  const [isCreatePaymentOpen, setIsCreatePaymentOpen] = useState(false)
  const [refreshCounter, setRefreshCounter] = useState(0)

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

  const [OrderBy, setOrderBy] = useState('')
  const [OrderDir, setOrderDir] = useState<OrderDirection>('ASC')

  const filterFields: FilterField[] = useMemo(
    () => [
      {
        key: 'payment_id',
        label: 'ID de pago',
        placeholder: 'Ej. 123',
        type: 'text',
      },
      {
        key: 'payment_request_id',
        label: 'ID de solicitud de pago',
        placeholder: 'Ej. 456',
        type: 'text',
      },
      {
        key: 'student_full_name',
        label: 'Nombre del estudiante',
        placeholder: 'Ej. Emma',
        type: 'text',
      },
      {
        key: 'payment_reference',
        label: 'Referencia de pago',
        placeholder: 'Ej. 1376',
        type: 'text',
      },
      {
        key: 'generation',
        label: 'Generación',
        placeholder: 'Ej. 2023',
        type: 'text',
      },
      {
        key: 'grade_group',
        label: 'Grupo',
        placeholder: 'Ej. 4A',
        type: 'text',
      },
      {
        key: 'pt_name',
        label: 'Método de pago',
        placeholder: 'Ej. cole',
        type: 'text',
      },
      {
        key: 'scholar_level_name',
        label: 'Nivel escolar',
        placeholder: 'Ej. Primaria',
        type: 'text',
      },
      {
        key: 'payment_month',
        label: 'Mes de pago',
        placeholder: 'Selecciona un mes',
        type: 'month',
      },
    ],
    [],
  )

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

        const paymentId = String(appliedFilters.payment_id ?? '').trim()
        if (paymentId) {
          params.set('payment_id', paymentId)
        }

        const paymentRequestId = String(appliedFilters.payment_request_id ?? '').trim()
        if (paymentRequestId) {
          params.set('payment_request_id', paymentRequestId)
        }

        const filterStudentName = String(appliedFilters.student_full_name ?? '').trim()
        if (appliedSearch) {
          params.set('student_full_name', appliedSearch)
        } else if (filterStudentName) {
          params.set('student_full_name', filterStudentName)
        }

        const paymentReference = String(appliedFilters.payment_reference ?? '').trim()
        if (paymentReference) {
          params.set('payment_reference', paymentReference)
        }

        const generation = String(appliedFilters.generation ?? '').trim()
        if (generation) {
          params.set('generation', generation)
        }

        const gradeGroup = String(appliedFilters.grade_group ?? '').trim()
        if (gradeGroup) {
          params.set('grade_group', gradeGroup)
        }

        const paymentType = String(appliedFilters.pt_name ?? '').trim()
        if (paymentType) {
          params.set('pt_name', paymentType)
        }

        const scholarLevel = String(appliedFilters.scholar_level_name ?? '').trim()
        if (scholarLevel) {
          params.set('scholar_level_name', scholarLevel)
        }

        const paymentMonth = String(appliedFilters.payment_month ?? '').trim()
        if (paymentMonth) {
          params.set('payment_month', `${paymentMonth}-01`)
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
  }, [appliedFilters, appliedSearch, OrderBy, OrderDir, Page, PageSize, locale, t, token, refreshCounter])

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
              <div className="d-flex align-items-center gap-2">
                <button
                  className="btn d-flex align-items-center"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  onClick={() => setIsCreatePaymentOpen(true)}
                >
                  <span className="payment-requests__create-icon" aria-hidden="true">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 5v14M5 12h14"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span className="fw-semibold">{t('createPayment')}</span>
                </button>
                <button
                  type="button"
                  className="students-filter-button"
                  onClick={() => setFiltersOpen(true)}
                >
                  <svg
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                    className="students-filter-button__icon"
                    focusable="false"
                  >
                    <path d="M4 5.25C4 4.56 4.56 4 5.25 4h9a.75.75 0 0 1 .6 1.2L12 9.25v3.7a.75.75 0 0 1-.3.6l-2 1.5A.75.75 0 0 1 8.5 14V9.25L4.4 5.2A.75.75 0 0 1 4 4.5Z" />
                  </svg>
                  <span className="fw-semibold">Filtros</span>
                  {activeFiltersCount > 0 ? (
                    <span className="badge bg-primary rounded-pill ms-2">
                      {activeFiltersCount}
                    </span>
                  ) : null}
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
            sortBy={OrderBy}
            sortDirection={OrderDir}
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
        <ManualPaymentModal
          isOpen={isCreatePaymentOpen}
          onClose={() => setIsCreatePaymentOpen(false)}
          lang="es"
          onSuccess={() => {
            setIsCreatePaymentOpen(false)
            setRefreshCounter((prev) => prev + 1)
          }}
        />
      </div>
    </>
  )
}
