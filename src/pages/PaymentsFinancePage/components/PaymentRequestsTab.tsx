import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useLanguage } from '../../../context/LanguageContext'
import { API_BASE_URL } from '../../../config'
import { DataTable, type DataTableColumn } from '../../../components/DataTable'
import SearchInput from '../../../components/ui/SearchInput';
import StudentTableCell from '../../../components/ui/StudentTableCell';
import Tabs from '../../../components/ui/Tabs'
import { formatDate } from '../../../utils/formatDate';
import { FilterSidebar, type FilterField, type FilterValues } from '../../../components/FilterSidebar'
import StudentSearchDropdown from '../../../components/StudentSearchDropdown'

type OrderDirection = 'ASC' | 'DESC'

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

interface ScheduledPaymentRow {
  payment_request_scheduled_id: number
  rule_name: string
  pt_name: string
  pot_name: string
  applies_to: string
  amount: number
  next_execution_date: string
  active: boolean
}

interface ScheduledDataResponse {
  content: ScheduledPaymentRow[]
  totalElements: number
  page: number
  size: number
  totalPages: number
}

interface DataResponse {
  content: ResultsColumns[]
  totalElements: number
  page: number
  size: number
  totalPages: number
}

interface PaymentRequestsTabProps {
  onNavigate: (path: string) => void
}

export function PaymentRequestsTab({ onNavigate }: PaymentRequestsTabProps) {
  const { token } = useAuth()
  const { locale, t } = useLanguage()

  const [activeTab, setActiveTab] = useState<'history' | 'scheduled'>('history')

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
  const [schoolOptions, setSchoolOptions] = useState<FilterField['options']>([])
  const [groupOptions, setGroupOptions] = useState<FilterField['options']>([])
  const [appliedFilters, setAppliedFilters] = useState<FilterValues>({})

  const [scheduledRows, setScheduledRows] = useState<ScheduledPaymentRow[]>([])
  const [scheduledPage, setScheduledPage] = useState(0)
  const [scheduledPageSize] = useState(10)
  const [scheduledTotalPages, setScheduledTotalPages] = useState(0)
  const [scheduledTotalElements, setScheduledTotalElements] = useState(0)
  const [scheduledIsLoading, setScheduledIsLoading] = useState(false)
  const [scheduledExporting, setScheduledExporting] = useState(false)
  const [scheduledFiltersOpen, setScheduledFiltersOpen] = useState(false)
  const [scheduledFilters, setScheduledFilters] = useState<FilterValues>({})
  const [appliedScheduledFilters, setAppliedScheduledFilters] = useState<FilterValues>({})
  const [scheduledSearchTerm, setScheduledSearchTerm] = useState('')
  const [scheduledAppliedSearch, setScheduledAppliedSearch] = useState('')
  const [scheduledFilterStudent, setScheduledFilterStudent] = useState<{ id: string; name: string } | null>(null)
  const [appliedScheduledStudent, setAppliedScheduledStudent] = useState<{ id: string; name: string } | null>(null)

  const paymentRequestTabs = useMemo(
    () => [
      { key: 'history', label: t('historyTab') },
      { key: 'scheduled', label: t('scheduledTab') },
    ],
    [t],
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

  const scheduledActiveFiltersCount = useMemo(
    () =>
      Object.values(appliedScheduledFilters).reduce((count, value) => {
        if (value === undefined || value === null) return count

        if (typeof value === 'string') {
          return value.trim() ? count + 1 : count
        }

        if (typeof value === 'boolean') {
          return value ? count + 1 : count
        }

        return count
      }, 0),
    [appliedScheduledFilters],
  )
  
  const [OrderBy, setOrderBy] = useState('')
  const [OrderDir, setOrderDir] = useState<OrderDirection>('ASC')

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

  useEffect(() => {
    if (!token) return

    const controller = new AbortController()

    const fetchSchools = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/schools/list?lang=${locale}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const data = (await response.json()) as Array<{ school_id?: number | string; commercial_name?: string }>
        setSchoolOptions(
          data.map((item) => ({
            value: String(item.school_id ?? ''),
            label: item.commercial_name ?? '',
          })),
        )
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          console.error('Unable to fetch schools list', fetchError)
        }
      }
    }

    fetchSchools()

    return () => controller.abort()
  }, [locale, token])

  useEffect(() => {
    if (!token) return

    const controller = new AbortController()

    const fetchGroups = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/groups/catalog?lang=${locale}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const data = (await response.json()) as Array<{ group_id?: number | string; grade_group?: string }>
        setGroupOptions(
          data.map((item) => ({
            value: String(item.group_id ?? ''),
            label: item.grade_group ?? '',
          })),
        )
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          console.error('Unable to fetch groups catalog', fetchError)
        }
      }
    }

    fetchGroups()

    return () => controller.abort()
  }, [locale, token])

  // fetch data
  useEffect(() => {
    if (!token || activeTab !== 'history') return

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
  }, [appliedFilters, appliedSearch, OrderBy, OrderDir, Page, PageSize, activeTab, locale, t, token])

  useEffect(() => {
    if (!token || activeTab !== 'scheduled') return

    const controller = new AbortController()

    const fetchScheduled = async () => {
      try {
        setScheduledIsLoading(true)
        setError(null)

        const params = new URLSearchParams({
          lang: locale,
          offset: String(scheduledPage * scheduledPageSize),
          limit: String(scheduledPageSize),
          export_all: 'false',
        })

        if (scheduledAppliedSearch.trim()) {
          params.set('global_search', scheduledAppliedSearch.trim())
        }

        const ruleName = String(appliedScheduledFilters.rule_name ?? '').trim()
        if (ruleName) {
          params.set('rule_name', ruleName)
        }

        const schoolId = String(appliedScheduledFilters.school_id ?? '').trim()
        if (schoolId) {
          params.set('school_id', schoolId)
        }

        const groupId = String(appliedScheduledFilters.group_id ?? '').trim()
        if (groupId) {
          params.set('group_id', groupId)
        }

        const studentId = String(appliedScheduledFilters.student_id ?? '').trim()
        if (studentId) {
          params.set('student_id', studentId)
        }

        const dueStart = String(appliedScheduledFilters.due_start ?? '').trim()
        if (dueStart) {
          params.set('due_start', dueStart)
        }

        const dueEnd = String(appliedScheduledFilters.due_end ?? '').trim()
        if (dueEnd) {
          params.set('due_end', dueEnd)
        }

        if (appliedScheduledFilters.active === true) {
          params.set('active', 'true')
        }

        const response = await fetch(`${API_BASE_URL}/reports/payment-request-schedule?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const data = (await response.json()) as ScheduledDataResponse
        setScheduledRows(data.content ?? [])
        setScheduledTotalElements(data.totalElements ?? 0)
        setScheduledTotalPages(data.totalPages ?? 0)
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          setError(t('defaultError'))
        }
      } finally {
        setScheduledIsLoading(false)
      }
    }

    fetchScheduled()

    return () => controller.abort()
  }, [activeTab, appliedScheduledFilters, locale, scheduledAppliedSearch, scheduledPage, scheduledPageSize, t, token])

  const handleSearchSubmit = () => {
    setAppliedSearch(searchTerm)
    setPage(0)
  }

  const handleClearSearch = () => {
    setSearchTerm('')
    setAppliedSearch('')
    setPage(0)
  }

  const handleScheduledSearchSubmit = () => {
    setScheduledAppliedSearch(scheduledSearchTerm)
    setScheduledPage(0)
  }

  const handleScheduledClearSearch = () => {
    setScheduledSearchTerm('')
    setScheduledAppliedSearch('')
    setScheduledPage(0)
  }

  const handleSort = (columnKey: keyof ResultsColumns) => {
    setPage(0)
    setOrderDir((prevDir) => (OrderBy === columnKey ? (prevDir === 'ASC' ? 'DESC' : 'ASC') : 'ASC'))
    setOrderBy(columnKey)
  }

  const groupColumns: Array<DataTableColumn<ResultsColumns>> = useMemo(
    () => [
      {
        key: 'payment_request_id',
        label: 'id',
        sortable: true,
      },
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
        key: 'ps_pr_name',
        label: 'status',
        sortable: true,
        render: (row) => (
          <small 
            className={'cell-chip px-4 text-nowrap ' + (row.payment_status_id === 7 ? 'bg-success' : row.payment_status_id === 8 ? 'bg-danger' : 'bg-warning')}
          > {row.ps_pr_name} </small>
        ),
      },
      {
        key: 'pr_amount',
        label: 'amount',
        sortable: true,
        currency: 'MXN'
      },
      {
        key: 'pr_pay_by',
        label: 'due_date',
        sortable: true,
        render: (content) => (
          formatDate(content?.pr_pay_by, locale, {year: 'numeric', month: 'short', day: '2-digit'})
        )
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

  const scheduledColumns: Array<DataTableColumn<ScheduledPaymentRow>> = useMemo(
    () => [
      {
        key: 'payment_request_scheduled_id',
        label: 'ID',
        sortable: true,
      },
      {
        key: 'rule_name',
        label: 'Regla',
        sortable: true,
      },
      {
        key: 'pt_name',
        label: 'Tipo de pago',
        sortable: true,
      },
      {
        key: 'pot_name',
        label: 'Periodicidad',
        sortable: true,
      },
      {
        key: 'applies_to',
        label: 'Aplica a',
        sortable: true,
      },
      {
        key: 'amount',
        label: 'Monto',
        sortable: true,
        currency: 'MXN',
      },
      {
        key: 'next_execution_date',
        label: 'Próxima ejecución',
        sortable: true,
        render: (row) => formatDate(row.next_execution_date, locale, { year: 'numeric', month: 'short', day: '2-digit' }),
      },
      {
        key: 'active',
        label: 'Activo',
        sortable: true,
        render: (row) => (row.active ? 'Sí' : 'No'),
      },
    ],
    [locale],
  )

  const handleScheduledExport = async () => {
    if (!token) return

    const params = new URLSearchParams({
      lang: locale,
      offset: '0',
      limit: String(scheduledPageSize),
      export_all: 'true',
    })

    if (scheduledAppliedSearch.trim()) {
      params.set('global_search', scheduledAppliedSearch.trim())
    }

    const ruleName = String(appliedScheduledFilters.rule_name ?? '').trim()
    if (ruleName) {
      params.set('rule_name', ruleName)
    }

    const schoolId = String(appliedScheduledFilters.school_id ?? '').trim()
    if (schoolId) {
      params.set('school_id', schoolId)
    }

    const groupId = String(appliedScheduledFilters.group_id ?? '').trim()
    if (groupId) {
      params.set('group_id', groupId)
    }

    const studentId = String(appliedScheduledFilters.student_id ?? '').trim()
    if (studentId) {
      params.set('student_id', studentId)
    }

    const dueStart = String(appliedScheduledFilters.due_start ?? '').trim()
    if (dueStart) {
      params.set('due_start', dueStart)
    }

    const dueEnd = String(appliedScheduledFilters.due_end ?? '').trim()
    if (dueEnd) {
      params.set('due_end', dueEnd)
    }

    if (appliedScheduledFilters.active === true) {
      params.set('active', 'true')
    }

    try {
      setScheduledExporting(true)
      const response = await fetch(`${API_BASE_URL}/reports/payment-request-schedule?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('failed_request')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'payment-request-schedule.csv'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (exportError) {
      setError(t('defaultError'))
      console.error('Unable to export scheduled payment requests', exportError)
    } finally {
      setScheduledExporting(false)
    }
  }

  return (
    <>
      <div className="students-page d-flex flex-column gap-3">
        {error ? (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        ) : null}

        <div className="card shadow-sm border-0">
          <div className="card-body d-flex flex-column gap-3">
            <Tabs
              tabs={paymentRequestTabs}
              activeKey={activeTab}
              onSelect={(key) => setActiveTab(key as 'history' | 'scheduled')}
            />
          </div>
        </div>

        {activeTab === 'history' ? (
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
        ) : (
          <div className="card shadow-sm border-0">
            <div className="card-body d-flex flex-column gap-3">
              <div className="d-flex flex-column gap-3 flex-md-row align-items-md-center justify-content-between">
                <div className="d-flex flex-column flex-md-row gap-3 flex-grow-1">
                  <SearchInput
                    value={scheduledSearchTerm}
                    onChange={(val) => setScheduledSearchTerm(val)}
                    onSubmit={handleScheduledSearchSubmit}
                    onClear={handleScheduledClearSearch}
                    placeholder="Buscar programadas"
                    className="flex-grow-1"
                    inputClassName="w-100"
                  />

                  <button
                    type="button"
                    className="students-filter-button"
                    onClick={() => {
                      setScheduledFilters(appliedScheduledFilters)
                      setScheduledFilterStudent(appliedScheduledStudent)
                      setScheduledFiltersOpen(true)
                    }}
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
                    {scheduledActiveFiltersCount > 0 ? (
                      <span className="badge bg-primary rounded-pill ms-2">
                        {scheduledActiveFiltersCount}
                      </span>
                    ) : null}
                  </button>
                </div>

                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={handleScheduledExport}
                  disabled={scheduledExporting}
                >
                  {scheduledExporting ? 'Exportando...' : 'Exportar CSV'}
                </button>
              </div>

              <DataTable
                columns={scheduledColumns}
                data={scheduledRows}
                isLoading={scheduledIsLoading}
                emptyMessage={t('tableNoData')}
                pagination={{
                  page: scheduledPage,
                  size: scheduledPageSize,
                  totalPages: scheduledTotalPages,
                  totalElements: scheduledTotalElements,
                  onPageChange: (nextPage) =>
                    setScheduledPage(Math.max(0, Math.min(scheduledTotalPages - 1, nextPage))),
                }}
                sortBy={''}
                sortDirection={'ASC'}
              />

              <FilterSidebar
                title="Filtrar programadas"
                subtitle="Aplica filtros para refinar reportes programados"
                isOpen={scheduledFiltersOpen}
                onClose={() => setScheduledFiltersOpen(false)}
                onClear={() => {
                  setScheduledFilters({})
                  setAppliedScheduledFilters({})
                  setScheduledFilterStudent(null)
                  setAppliedScheduledStudent(null)
                  setScheduledPage(0)
                  setScheduledFiltersOpen(false)
                }}
                onApply={() => {
                  setAppliedScheduledFilters(scheduledFilters)
                  setAppliedScheduledStudent(scheduledFilterStudent)
                  setScheduledPage(0)
                  setScheduledFiltersOpen(false)
                }}
              >
                <div className="d-flex flex-column gap-3">
                  <div className="filter-sidebar__field">
                    <label htmlFor="rule_name">Regla</label>
                    <input
                      id="rule_name"
                      className="form-control"
                      placeholder="Ej. Colegiatura"
                      type="text"
                      value={(scheduledFilters.rule_name as string) ?? ''}
                      onChange={(event) =>
                        setScheduledFilters((prev) => ({ ...prev, rule_name: event.target.value }))
                      }
                    />
                  </div>

                  <div className="filter-sidebar__field">
                    <label htmlFor="school_id">Escuela</label>
                    <select
                      id="school_id"
                      className="form-select"
                      value={(scheduledFilters.school_id as string) ?? ''}
                      onChange={(event) =>
                        setScheduledFilters((prev) => ({ ...prev, school_id: event.target.value }))
                      }
                    >
                      <option value="">Selecciona una escuela</option>
                      {schoolOptions?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-sidebar__field">
                    <label htmlFor="group_id">Grupo</label>
                    <select
                      id="group_id"
                      className="form-select"
                      value={(scheduledFilters.group_id as string) ?? ''}
                      onChange={(event) =>
                        setScheduledFilters((prev) => ({ ...prev, group_id: event.target.value }))
                      }
                    >
                      <option value="">Selecciona un grupo</option>
                      {groupOptions?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-sidebar__field">
                    <StudentSearchDropdown
                      label="Alumno"
                      placeholder="Buscar alumno por nombre"
                      lang={locale}
                      onSelect={(student) => {
                        setScheduledFilters((prev) => ({ ...prev, student_id: String(student.student_id) }))
                        setScheduledFilterStudent({ id: String(student.student_id), name: student.full_name })
                      }}
                    />
                    {scheduledFilterStudent ? (
                      <div className="d-flex align-items-center justify-content-between mt-2">
                        <span className="small text-muted">Seleccionado: {scheduledFilterStudent.name}</span>
                        <button
                          type="button"
                          className="btn btn-link btn-sm text-decoration-none"
                          onClick={() => {
                            setScheduledFilterStudent(null)
                            setScheduledFilters((prev) => ({ ...prev, student_id: '' }))
                          }}
                        >
                          Quitar
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className="filter-sidebar__field">
                    <label htmlFor="due_start">Fecha inicio</label>
                    <input
                      id="due_start"
                      className="form-control"
                      placeholder="YYYY-MM-DD"
                      type="date"
                      value={(scheduledFilters.due_start as string) ?? ''}
                      onChange={(event) =>
                        setScheduledFilters((prev) => ({ ...prev, due_start: event.target.value }))
                      }
                    />
                  </div>

                  <div className="filter-sidebar__field">
                    <label htmlFor="due_end">Fecha fin</label>
                    <input
                      id="due_end"
                      className="form-control"
                      placeholder="YYYY-MM-DD"
                      type="date"
                      value={(scheduledFilters.due_end as string) ?? ''}
                      onChange={(event) => setScheduledFilters((prev) => ({ ...prev, due_end: event.target.value }))}
                    />
                  </div>

                  <label className="filter-sidebar__checkbox">
                    <input
                      type="checkbox"
                      checked={Boolean(scheduledFilters.active)}
                      onChange={(event) =>
                        setScheduledFilters((prev) => ({ ...prev, active: event.target.checked }))
                      }
                    />
                    <div>
                      <span className="filter-sidebar__checkbox-label">Solo activas</span>
                    </div>
                  </label>
                </div>
              </FilterSidebar>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
