import { useEffect, useMemo, useState } from 'react'
import { API_BASE_URL } from '../../../config'
import { DataTable, type DataTableColumn } from '../../../components/DataTable'
import { FilterSidebar, type FilterField, type FilterValues } from '../../../components/FilterSidebar'
import SearchInput from '../../../components/ui/SearchInput'
import StudentSearchDropdown from '../../../components/StudentSearchDropdown'
import { useAuth } from '../../../context/AuthContext'
import { useLanguage } from '../../../context/LanguageContext'
import { formatDate } from '../../../utils/formatDate'

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

interface PaymentRequestsScheduledProps {
  onNavigate: (path: string) => void
  schoolOptions: FilterField['options']
  groupOptions: FilterField['options']
  active: boolean
  tabs: Array<{ key: string; label: string }>
  onTabChange: (key: 'history' | 'scheduled') => void
}

const DEFAULT_PAGE_SIZE = 10

export function PaymentRequestsScheduled({
  onNavigate,
  schoolOptions,
  groupOptions,
  active,
}: PaymentRequestsScheduledProps) {
  const { token } = useAuth()
  const { locale, t } = useLanguage()

  const [scheduledRows, setScheduledRows] = useState<ScheduledPaymentRow[]>([])
  const [scheduledPage, setScheduledPage] = useState(0)
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
  const [error, setError] = useState<string | null>(null)

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

  useEffect(() => {
    if (!token || !active) return

    const controller = new AbortController()

    const fetchScheduled = async () => {
      try {
        setScheduledIsLoading(true)
        setError(null)

        const params = new URLSearchParams({
          lang: locale,
          offset: String(scheduledPage * DEFAULT_PAGE_SIZE),
          limit: String(DEFAULT_PAGE_SIZE),
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
  }, [active, appliedScheduledFilters, locale, scheduledAppliedSearch, scheduledPage, t, token])

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
      {
        key: 'actions',
        label: t('tableActions'),
        sortable: false,
        render: (row) => (
          <button
            type="button"
            className="btn btn-link p-0"
            onClick={() => onNavigate(`/${locale}/finance/request/scheduled/${row.payment_request_scheduled_id}`)}
          >
            {t('viewDetails')}
          </button>
        ),
      },
    ],
    [locale, onNavigate, t],
  )

  const handleScheduledExport = async () => {
    if (!token) return

    const params = new URLSearchParams({
      lang: locale,
      offset: '0',
      limit: String(DEFAULT_PAGE_SIZE),
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

  const handleScheduledSearchSubmit = () => {
    setScheduledAppliedSearch(scheduledSearchTerm)
    setScheduledPage(0)
  }

  const handleScheduledClearSearch = () => {
    setScheduledSearchTerm('')
    setScheduledAppliedSearch('')
    setScheduledPage(0)
  }

  return (
    <>
      {error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : null}

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
                <svg viewBox="0 0 20 20" aria-hidden="true" className="students-filter-button__icon" focusable="false">
                  <path d="M4 5.25C4 4.56 4.56 4 5.25 4h9a.75.75 0 0 1 .6 1.2L12 9.25v3.7a.75.75 0 0 1-.3.6l-2 1.5A.75.75 0 0 1 8.5 14V9.25L4.4 5.2A.75.75 0 0 1 4 4.5Z" />
                </svg>
                <span className="fw-semibold">Filtros</span>
                {scheduledActiveFiltersCount > 0 ? (
                  <span className="badge bg-primary rounded-pill ms-2">{scheduledActiveFiltersCount}</span>
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
        </div>
      </div>
      <DataTable
        columns={scheduledColumns}
        data={scheduledRows}
        isLoading={scheduledIsLoading}
        emptyMessage={t('tableNoData')}
        pagination={{
          page: scheduledPage,
          size: DEFAULT_PAGE_SIZE,
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
              onChange={(event) => setScheduledFilters((prev) => ({ ...prev, rule_name: event.target.value }))}
            />
          </div>

          <div className="filter-sidebar__field">
            <label htmlFor="school_id">Escuela</label>
            <select
              id="school_id"
              className="form-select"
              value={(scheduledFilters.school_id as string) ?? ''}
              onChange={(event) => setScheduledFilters((prev) => ({ ...prev, school_id: event.target.value }))}
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
              onChange={(event) => setScheduledFilters((prev) => ({ ...prev, group_id: event.target.value }))}
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
              onChange={(event) => setScheduledFilters((prev) => ({ ...prev, due_start: event.target.value }))}
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
              onChange={(event) => setScheduledFilters((prev) => ({ ...prev, active: event.target.checked }))}
            />
            <div>
              <span className="filter-sidebar__checkbox-label">Solo activas</span>
            </div>
          </label>
        </div>
      </FilterSidebar>
    </>
  )
}
