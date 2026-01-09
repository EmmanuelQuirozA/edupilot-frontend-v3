import { useEffect, useMemo, useState } from 'react'
import { DataTable, type DataTableColumn } from '../../components/DataTable'
import { FilterSidebar } from '../../components/FilterSidebar'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { API_BASE_URL } from '../../config'
import { useModulePermissions } from '../../hooks/useModulePermissions'
import { NoPermission } from '../../components/NoPermission'
import { LoadingSkeleton } from '../../components/LoadingSkeleton'
import SearchInput from '../../components/ui/SearchInput'

interface TeacherUser {
  user_id: number
  username: string
  full_name: string
  commercial_name: string
  user_status: string
  enabled: boolean
}

interface TeachersResponse {
  content: TeacherUser[]
  totalElements: number
  page: number
  size: number
  totalPages: number
}

interface SchoolOption {
  school_id: number
  description: string
}

interface TeacherFilters {
  schoolId: string
  enabled: string
  fullName: string
}

const emptyFilters: TeacherFilters = {
  schoolId: '',
  enabled: '',
  fullName: '',
}

const buildCsvValue = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return ''
  const stringValue = String(value)
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

export function ProfessorsUsersTab() {
  const { token } = useAuth()
  const { locale, t } = useLanguage()
  const { permissions, loading: permissionsLoading, error: permissionsError, loaded: permissionsLoaded } = useModulePermissions('teachers')
  const canCreate = permissions?.c ?? false
  const [teachers, setTeachers] = useState<TeacherUser[]>([])
  const [page, setPage] = useState(0)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [schools, setSchools] = useState<SchoolOption[]>([])
  const [schoolsLoading, setSchoolsLoading] = useState(false)

  const [orderBy, setOrderBy] = useState('')
  const [orderDir, setOrderDir] = useState<'ASC' | 'DESC'>('ASC')
  const [isExporting, setIsExporting] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [draftFilters, setDraftFilters] = useState<TeacherFilters>(emptyFilters)
  const [appliedFilters, setAppliedFilters] = useState<TeacherFilters>(emptyFilters)

  useEffect(() => {
    if (!token) return

    const controller = new AbortController()

    const fetchSchools = async () => {
      setSchoolsLoading(true)
      try {
        const response = await fetch(`${API_BASE_URL}/schools/list`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const data = (await response.json()) as SchoolOption[]
        setSchools(data ?? [])
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          setSchools([])
        }
      } finally {
        setSchoolsLoading(false)
      }
    }

    fetchSchools()

    return () => controller.abort()
  }, [token])

  useEffect(() => {
    if (!filtersOpen) return
    setDraftFilters(appliedFilters)
  }, [appliedFilters, filtersOpen])

  useEffect(() => {
    if (!token) return

    const controller = new AbortController()

    const fetchTeachers = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          lang: locale,
          offset: String(page * pageSize),
          limit: String(pageSize),
          export_all: 'false',
          order_by: orderBy,
          order_dir: orderDir,
        })

        if (appliedFilters.schoolId) {
          params.set('school_id', appliedFilters.schoolId)
        }

        if (appliedFilters.fullName) {
          params.set('full_name', appliedFilters.fullName)
        }

        if (appliedFilters.enabled) {
          params.set('enabled', appliedFilters.enabled)
        }

        if (appliedSearch) {
          params.set('full_name', appliedSearch)
        }

        const response = await fetch(`${API_BASE_URL}/teachers?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const data = (await response.json()) as TeachersResponse
        setTeachers(data.content ?? [])
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

    fetchTeachers()

    return () => controller.abort()
  }, [appliedSearch, appliedFilters, locale, orderBy, orderDir, page, pageSize, t, token])

  const handleSearchSubmit = () => {
    setAppliedSearch(searchTerm)
    setPage(0)
  }

  const handleClearSearch = () => {
    setSearchTerm('')
    setAppliedSearch('')
    setPage(0)
  }

  const handleSort = (columnKey: keyof TeacherUser) => {
    setPage(0)
    setOrderDir((prevDir) => (orderBy === columnKey ? (prevDir === 'ASC' ? 'DESC' : 'ASC') : 'ASC'))
    setOrderBy(columnKey)
  }

  const handleExport = async () => {
    if (!token) return

    setIsExporting(true)

    try {
      const params = new URLSearchParams({
        lang: locale,
        offset: '0',
        limit: String(pageSize),
        export_all: 'true',
        order_by: orderBy,
        order_dir: orderDir,
      })

      if (appliedFilters.schoolId) {
        params.set('school_id', appliedFilters.schoolId)
      }

      if (appliedFilters.fullName) {
        params.set('full_name', appliedFilters.fullName)
      }

      if (appliedFilters.enabled) {
        params.set('enabled', appliedFilters.enabled)
      }

      const response = await fetch(`${API_BASE_URL}/teachers?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error('failed_request')
      }

      const data = (await response.json()) as TeachersResponse

      const headers = [
        t('id'),
        t('username'),
        t('name'),
        t('schoolCommercialNameLabel'),
        t('status'),
      ]

      const rows = (data.content ?? []).map((teacher) => [
        teacher.user_id,
        teacher.username,
        teacher.full_name,
        teacher.commercial_name,
        teacher.user_status,
      ])

      const csvContent = [
        headers.map(buildCsvValue).join(','),
        ...rows.map((row) => row.map(buildCsvValue).join(',')),
      ].join('\n')

      const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `teachers-${locale}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch (exportError) {
      setError(t('defaultError'))
    } finally {
      setIsExporting(false)
    }
  }

  const columns: Array<DataTableColumn<TeacherUser>> = useMemo(
    () => [
      {
        key: 'full_name',
        label: t('name'),
        sortable: true,
        render: (teacher) => <span className="fw-semibold text-black">{teacher.full_name}</span>,
      },
      {
        key: 'username',
        label: t('username'),
        sortable: true,
      },
      {
        key: 'commercial_name',
        label: t('schoolCommercialNameLabel'),
        sortable: true,
      },
      {
        key: 'user_status',
        label: t('status'),
        sortable: true,
        render: (teacher) => (
          <span className={`badge ${teacher.enabled ? 'bg-success-subtle text-success' : 'bg-secondary'}`}>
            {teacher.user_status}
          </span>
        ),
      },
    ],
    [t],
  )

  if (permissionsLoading || !permissionsLoaded) {
    return (
      <>
        <LoadingSkeleton variant="table" rowCount={10} />
      </>
    )
  }

  if (permissionsError) {
    return (
      <>
        <div className="alert alert-danger" role="alert">
          {t('defaultError')}
        </div>
      </>
    )
  }
    
  if (
    (permissionsLoaded && permissions && !permissions.r)
  ) {
    return (
        <NoPermission />
    )
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
          <div className="d-flex flex-column gap-3 flex-md-row align-items-md-center">
            <SearchInput
              value={searchTerm}
              onChange={(val) => setSearchTerm(val)}
              onSubmit={handleSearchSubmit}
              onClear={handleClearSearch}
              placeholder={t("searchTeacherByName")}
              className="flex-grow-1"
              inputClassName="w-100"
            />
            <button type="button" className="users-filter-button" onClick={() => setFiltersOpen(true)}>
              <svg viewBox="0 0 20 20" aria-hidden="true" className="users-filter-button__icon" focusable="false">
                <path d="M4 5.25C4 4.56 4.56 4 5.25 4h9a.75.75 0 0 1 .6 1.2L12 9.25v3.7a.75.75 0 0 1-.3.6l-2 1.5A.75.75 0 0 1 8.5 14V9.25L4.4 5.2A.75.75 0 0 1 4 4.5Z" />
              </svg>
              <span className="fw-semibold">{t('filters')}</span>
            </button>
            <button
              type="button"
              className="btn d-flex align-items-center gap-2 btn-print text-muted fw-medium"
              onClick={handleExport}
              disabled={isExporting}
            >
              <i className="bi bi-download" aria-hidden="true" />
              {isExporting ? t('exporting') : t('exportCsv')}
            </button>
            <div className="d-flex align-items-center gap-2">
              {canCreate ? (
                <button
                  className="btn d-flex align-items-center gap-2 btn-print text-muted fw-medium"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span aria-hidden="true">
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
                  <span className="fw-semibold">{t('createTeacher')}</span>
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={teachers}
        isLoading={isLoading}
        emptyMessage={t('tableNoData')}
        pagination={{
          page,
          size: pageSize,
          totalPages,
          totalElements,
          onPageChange: (nextPage) => setPage(Math.max(0, Math.min(totalPages - 1, nextPage))),
        }}
        sortBy={orderBy}
        sortDirection={orderDir}
        onSort={(columnKey) => handleSort(columnKey as keyof TeacherUser)}
      />

      <FilterSidebar
        title={t('filters')}
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onClear={() => {
          setDraftFilters(emptyFilters)
          setAppliedFilters(emptyFilters)
          setPage(0)
          setFiltersOpen(false)
        }}
        onApply={() => {
          setAppliedFilters(draftFilters)
          setPage(0)
          setFiltersOpen(false)
        }}
      >
        <div className="mb-3">
          <label htmlFor="teachers-full-name">{t('name')}</label>
          <input
            id="teachers-full-name"
            className="form-control"
            placeholder={t('searchByName')}
            value={draftFilters.fullName}
            onChange={(event) => setDraftFilters((prev) => ({ ...prev, fullName: event.target.value }))}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="teachers-school-select">{t('selectSchoolLabel')}</label>
          <select
            id="teachers-school-select"
            className="form-select"
            value={draftFilters.schoolId}
            onChange={(event) => setDraftFilters((prev) => ({ ...prev, schoolId: event.target.value }))}
            disabled={schoolsLoading}
          >
            <option value="">{schoolsLoading ? t('tableLoading') : t('selectSchoolOption')}</option>
            {schools.map((school) => (
              <option key={school.school_id} value={String(school.school_id)}>
                {school.description}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label htmlFor="teachers-status-select">{t('status')}</label>
          <select
            id="teachers-status-select"
            className="form-select"
            value={draftFilters.enabled}
            onChange={(event) => setDraftFilters((prev) => ({ ...prev, enabled: event.target.value }))}
          >
            <option value="">{t('selectPlaceholder')}</option>
            <option value="true">{t('active')}</option>
            <option value="false">{t('inactive')}</option>
          </select>
        </div>
      </FilterSidebar>
    </>
  )
}
