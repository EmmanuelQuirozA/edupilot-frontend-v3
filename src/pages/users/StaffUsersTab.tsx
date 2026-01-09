import { useEffect, useMemo, useState } from 'react'
import { DataTable, type DataTableColumn } from '../../components/DataTable'
import { FilterSidebar } from '../../components/FilterSidebar'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { API_BASE_URL } from '../../config'

interface StaffUser {
  user_id: number
  username: string
  full_name: string
  role_name: string
  commercial_name: string
  user_status: string
}

interface StaffUsersResponse {
  content: StaffUser[]
  totalElements: number
  page: number
  size: number
  totalPages: number
}

interface SchoolOption {
  school_id: number
  description: string
}

interface RoleOption {
  role_id: number
  role_name: string
}

interface StaffFilters {
  schoolId: string
  roleId: string
  enabled: string
  fullName: string
}

const emptyFilters: StaffFilters = {
  schoolId: '',
  roleId: '',
  enabled: '',
  fullName: '',
}

const statusIsActive = (status: string) => {
  const normalized = status.toLowerCase()
  return normalized.includes('activo') || normalized.includes('active')
}

const buildCsvValue = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return ''
  const stringValue = String(value)
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

export function StaffUsersTab() {
  const { token } = useAuth()
  const { locale, t } = useLanguage()
  const [users, setUsers] = useState<StaffUser[]>([])
  const [page, setPage] = useState(0)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [schools, setSchools] = useState<SchoolOption[]>([])
  const [schoolsLoading, setSchoolsLoading] = useState(false)
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [rolesLoading, setRolesLoading] = useState(false)

  const [orderBy, setOrderBy] = useState('')
  const [orderDir, setOrderDir] = useState<'ASC' | 'DESC'>('ASC')
  const [isExporting, setIsExporting] = useState(false)

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [draftFilters, setDraftFilters] = useState<StaffFilters>(emptyFilters)
  const [appliedFilters, setAppliedFilters] = useState<StaffFilters>(emptyFilters)

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
    if (!token || !draftFilters.schoolId) {
      setRoles([])
      return
    }

    const controller = new AbortController()

    const fetchRoles = async () => {
      setRolesLoading(true)
      try {
        const params = new URLSearchParams({
          lang: locale,
          school_id: draftFilters.schoolId,
        })
        const response = await fetch(`${API_BASE_URL}/roles?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const data = (await response.json()) as RoleOption[]
        setRoles(data ?? [])
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          setRoles([])
        }
      } finally {
        setRolesLoading(false)
      }
    }

    fetchRoles()

    return () => controller.abort()
  }, [draftFilters.schoolId, locale, token])

  useEffect(() => {
    if (!token) return

    const controller = new AbortController()

    const fetchUsers = async () => {
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

        if (appliedFilters.roleId) {
          params.set('role_id', appliedFilters.roleId)
        }

        if (appliedFilters.fullName) {
          params.set('full_name', appliedFilters.fullName)
        }

        if (appliedFilters.enabled) {
          params.set('enabled', appliedFilters.enabled)
        }

        const response = await fetch(`${API_BASE_URL}/users?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const data = (await response.json()) as StaffUsersResponse
        setUsers(data.content ?? [])
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

    fetchUsers()

    return () => controller.abort()
  }, [appliedFilters, locale, orderBy, orderDir, page, pageSize, t, token])

  const handleSort = (columnKey: keyof StaffUser) => {
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

      if (appliedFilters.roleId) {
        params.set('role_id', appliedFilters.roleId)
      }

      if (appliedFilters.fullName) {
        params.set('full_name', appliedFilters.fullName)
      }

      if (appliedFilters.enabled) {
        params.set('enabled', appliedFilters.enabled)
      }

      const response = await fetch(`${API_BASE_URL}/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error('failed_request')
      }

      const data = (await response.json()) as StaffUsersResponse

      const headers = [
        t('id'),
        t('username'),
        t('name'),
        t('role'),
        t('schoolCommercialNameLabel'),
        t('status'),
      ]

      const rows = (data.content ?? []).map((user) => [
        user.user_id,
        user.username,
        user.full_name,
        user.role_name,
        user.commercial_name,
        user.user_status,
      ])

      const csvContent = [
        headers.map(buildCsvValue).join(','),
        ...rows.map((row) => row.map(buildCsvValue).join(',')),
      ].join('\n')

      const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `staff-${locale}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch (exportError) {
      setError(t('defaultError'))
    } finally {
      setIsExporting(false)
    }
  }

  const columns: Array<DataTableColumn<StaffUser>> = useMemo(
    () => [
      {
        key: 'full_name',
        label: t('name'),
        sortable: true,
        render: (user) => <span className="fw-semibold text-black">{user.full_name}</span>,
      },
      {
        key: 'username',
        label: t('username'),
        sortable: true,
      },
      {
        key: 'role_name',
        label: t('role'),
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
        render: (user) => (
          <span className={`badge ${statusIsActive(user.user_status) ? 'bg-success-subtle text-success' : 'bg-secondary'}`}>
            {user.user_status}
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
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={users}
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
        onSort={(columnKey) => handleSort(columnKey as keyof StaffUser)}
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
          <label htmlFor="staff-full-name">{t('name')}</label>
          <input
            id="staff-full-name"
            className="form-control"
            placeholder={t('searchByName')}
            value={draftFilters.fullName}
            onChange={(event) => setDraftFilters((prev) => ({ ...prev, fullName: event.target.value }))}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="staff-school-select">{t('selectSchoolLabel')}</label>
          <select
            id="staff-school-select"
            className="form-select"
            value={draftFilters.schoolId}
            onChange={(event) => {
              const value = event.target.value
              setDraftFilters((prev) => ({ ...prev, schoolId: value, roleId: '' }))
            }}
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
          <label htmlFor="staff-role-select">{t('selectRoleLabel')}</label>
          <select
            id="staff-role-select"
            className="form-select"
            value={draftFilters.roleId}
            onChange={(event) => setDraftFilters((prev) => ({ ...prev, roleId: event.target.value }))}
            disabled={rolesLoading || !draftFilters.schoolId}
          >
            <option value="">
              {rolesLoading
                ? t('tableLoading')
                : draftFilters.schoolId
                  ? t('selectRoleLabel')
                  : t('selectSchoolOption')}
            </option>
            {roles.map((role) => (
              <option key={role.role_id} value={String(role.role_id)}>
                {role.role_name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label htmlFor="staff-status-select">{t('status')}</label>
          <select
            id="staff-status-select"
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
