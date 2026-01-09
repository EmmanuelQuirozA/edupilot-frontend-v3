import { useEffect, useMemo, useState } from 'react'
import { DataTable, type DataTableColumn } from '../../components/DataTable'
import SearchInput from '../../components/ui/SearchInput'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { API_BASE_URL } from '../../config'

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
  const [teachers, setTeachers] = useState<TeacherUser[]>([])
  const [page, setPage] = useState(0)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [schools, setSchools] = useState<SchoolOption[]>([])
  const [schoolsLoading, setSchoolsLoading] = useState(false)
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | ''>('')
  const [enabledFilter, setEnabledFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const [searchTerm, setSearchTerm] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [orderBy, setOrderBy] = useState('')
  const [orderDir, setOrderDir] = useState<'ASC' | 'DESC'>('ASC')
  const [isExporting, setIsExporting] = useState(false)

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

        if (selectedSchoolId) {
          params.set('school_id', String(selectedSchoolId))
        }

        if (appliedSearch) {
          params.set('full_name', appliedSearch)
        }

        if (enabledFilter !== 'all') {
          params.set('enabled', enabledFilter === 'active' ? 'true' : 'false')
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
  }, [appliedSearch, enabledFilter, locale, orderBy, orderDir, page, pageSize, selectedSchoolId, t, token])

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

      if (selectedSchoolId) {
        params.set('school_id', String(selectedSchoolId))
      }

      if (appliedSearch) {
        params.set('full_name', appliedSearch)
      }

      if (enabledFilter !== 'all') {
        params.set('enabled', enabledFilter === 'active' ? 'true' : 'false')
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
              onChange={(value) => setSearchTerm(value)}
              onSubmit={handleSearchSubmit}
              onClear={handleClearSearch}
              placeholder={t('searchByName')}
              className="flex-grow-1"
              inputClassName="w-100"
            />
            <button type="button" className="users-filter-button">
              <svg viewBox="0 0 20 20" aria-hidden="true" className="users-filter-button__icon" focusable="false">
                <path d="M4 5.25C4 4.56 4.56 4 5.25 4h9a.75.75 0 0 1 .6 1.2L12 9.25v3.7a.75.75 0 0 1-.3.6l-2 1.5A.75.75 0 0 1 8.5 14V9.25L4.4 5.2A.75.75 0 0 1 4 4.5Z" />
              </svg>
              <span className="fw-semibold">{t('filters')}</span>
            </button>
          </div>

          <div className="d-flex flex-column gap-3 flex-lg-row align-items-lg-center">
            <div className="flex-grow-1">
              <label className="form-label small text-muted" htmlFor="teachers-school-select">
                {t('selectSchoolLabel')}
              </label>
              <select
                id="teachers-school-select"
                className="form-select"
                value={selectedSchoolId}
                onChange={(event) => {
                  const value = event.target.value
                  setSelectedSchoolId(value ? Number(value) : '')
                  setPage(0)
                }}
                disabled={schoolsLoading}
              >
                <option value="">{schoolsLoading ? t('tableLoading') : t('selectSchoolOption')}</option>
                {schools.map((school) => (
                  <option key={school.school_id} value={school.school_id}>
                    {school.description}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-grow-1">
              <label className="form-label small text-muted" htmlFor="teachers-status-select">
                {t('status')}
              </label>
              <select
                id="teachers-status-select"
                className="form-select"
                value={enabledFilter}
                onChange={(event) => {
                  setEnabledFilter(event.target.value as 'all' | 'active' | 'inactive')
                  setPage(0)
                }}
              >
                <option value="all">{t('selectPlaceholder')}</option>
                <option value="active">{t('active')}</option>
                <option value="inactive">{t('inactive')}</option>
              </select>
            </div>
            <div className="align-self-lg-end">
              <button
                type="button"
                className="btn d-flex align-items-center gap-2 btn-print text-muted fw-medium"
                onClick={handleExport}
                disabled={isExporting}
              >
                <i className="bi bi-download" aria-hidden="true" />
                {isExporting ? t('exporting') : t('exportCsv')}
              </button>
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
    </>
  )
}
