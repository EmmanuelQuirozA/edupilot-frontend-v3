import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useLanguage } from '../../../context/LanguageContext'
import { API_BASE_URL } from '../../../config'
import { DataTable, type DataTableColumn } from '../../../components/DataTable'
import SearchInput from '../../../components/ui/SearchInput';
import StudentTableCell from '../../../components/ui/StudentTableCell';

type OrderDirection = 'ASC' | 'DESC'

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

  const [groupSearchTerm, setSearchTerm] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  
  const [orderBy, setOrderBy] = useState('')
  const [orderDir, setOrderDir] = useState<OrderDirection>('ASC')

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
  }, [appliedSearch, orderBy, orderDir, Page, PageSize, locale, t, token])

  const handleSearchSubmit = () => {
    setAppliedSearch(groupSearchTerm)
    setPage(0)
  }

  const handleClearSearch = () => {
    setSearchTerm('')
    setAppliedSearch('')
    setPage(0)
  }

  const handleSort = (columnKey: keyof ResultsColumns) => {
    setPage(0)
    setOrderDir((prevDir) => (orderBy === columnKey ? (prevDir === 'ASC' ? 'DESC' : 'ASC') : 'ASC'))
    setOrderBy(columnKey)
  }

  const groupColumns: Array<DataTableColumn<ResultsColumns>> = useMemo(
    () => [
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
    ],
    [],
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
                value={groupSearchTerm}
                onChange={(val) => setSearchTerm(val)}
                onSubmit={handleSearchSubmit}
                onClear={handleClearSearch}
                placeholder={t("searchBy")}
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
            sortBy={orderBy}
            sortDirection={orderDir}
            onSort={(columnKey) => handleSort(columnKey as keyof ResultsColumns)}
          />
        </>
      </div>
    </>
  )
}
