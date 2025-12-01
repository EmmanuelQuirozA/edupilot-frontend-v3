import { useEffect, useMemo, useState } from 'react'
import { Layout } from '../layout/Layout'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { API_BASE_URL } from '../config'
import { LoadingSkeleton } from '../components/LoadingSkeleton'
import type { BreadcrumbItem } from '../components/Breadcrumb'
import { DataTable, type DataTableColumn } from '../components/DataTable'
import SearchInput from '../components/ui/SearchInput';
import Tabs from '../components/ui/Tabs';
import './StudentsPage.css'

interface Student {
  student_id: number
  register_id: string
  full_name: string
  payment_reference: string
  generation: string
  scholar_level_name: string
  grade_group: string
  user_status: string
  status: number
}

interface StudentsResponse {
  content: Student[]
  totalElements: number
  page: number
  size: number
  totalPages: number
}

interface StudentsPageProps {
  onNavigate: (path: string) => void
}

type OrderDirection = 'ASC' | 'DESC'

interface ClassGroup {
  class_id: number
  school_id: number
  generation: string
  grade_group: string
  scholar_level_name: string
  enabled: boolean
}

interface ClassesResponse {
  content: ClassGroup[]
  totalElements: number
  page: number
  size: number
  totalPages: number
}

export function StudentsPage({ onNavigate }: StudentsPageProps) {
  const { token, hydrated } = useAuth()
  const { locale, t } = useLanguage()

  const [students, setStudents] = useState<Student[]>([])
  const [page, setPage] = useState(0)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [orderBy, setOrderBy] = useState<keyof Student>('full_name')
  const [orderDir, setOrderDir] = useState<OrderDirection>('DESC')

  const [groups, setGroups] = useState<ClassGroup[]>([])
  const [groupsPage, setGroupsPage] = useState(0)
  const [groupsPageSize] = useState(10)
  const [groupsTotalPages, setGroupsTotalPages] = useState(0)
  const [groupsTotalElements, setGroupsTotalElements] = useState(0)
  const [isGroupsLoading, setIsGroupsLoading] = useState(false)
  const [groupSearchTerm, setGroupSearchTerm] = useState('')
  const [appliedGroupSearch, setAppliedGroupSearch] = useState('')
  const [groupsOrderBy, setGroupsOrderBy] = useState<keyof ClassGroup>('grade_group')
  const [groupsOrderDir, setGroupsOrderDir] = useState<OrderDirection>('ASC')

  const [activeTab, setActiveTab] = useState<'students' | 'groups'>('students');
  const tabs = [
    { key: 'students', label: 'Alumnos' },
    { key: 'groups', label: 'Grupos' }
  ];

  const columns: Array<DataTableColumn<Student>> = useMemo(
    () => [
      {
        key: 'full_name',
        label: 'Alumno',
        sortable: true,
        render: (student) => (
          <div className="d-flex align-items-center gap-3">
            <div className="avatar-circle">{student.full_name[0]}</div>
            <div className="d-flex flex-column">
              <span className="fw-semibold text-black">{student.full_name}</span>
              <small className="text-muted">Matrícula: {student.register_id}</small>
            </div>
          </div>
        ),
      },
      {
        key: 'generation',
        label: 'Generación',
        sortable: true,
        render: (student) => <span className="text-muted">{student.generation}</span>,
      },
      {
        key: 'grade_group',
        label: 'Grupo',
        sortable: true,
        render: (student) => (
          <div className="d-flex flex-column">
            <span className="fw-semibold text-black">{student.grade_group}</span>
            <small className="text-muted">{student.scholar_level_name}</small>
          </div>
        ),
      },
      {
        key: 'user_status',
        label: 'Estatus',
        sortable: true,
        render: (student) => (
          <span className={`badge ${student.status ? 'bg-success-subtle text-success' : 'bg-secondary'}`}>
            {student.user_status}
          </span>
        ),
      },
    ],
    [],
  )

  const breadcrumbItems: BreadcrumbItem[] = useMemo(
    () => [
      {
        label: t('portalTitle'),
        onClick: () => onNavigate(`/${locale}/dashboard`),
      },
      { label: 'Alumnos' },
    ],
    [locale, onNavigate, t],
  )

  useEffect(() => {
    if (!token) return

    const controller = new AbortController()

    const fetchStudents = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          lang: locale,
          offset: String(page * pageSize),
          limit: String(pageSize),
          export_all: 'false',
          full_name: appliedSearch,
          order_by: orderBy,
          order_dir: orderDir,
        })

        const response = await fetch(`${API_BASE_URL}/students?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const data = (await response.json()) as StudentsResponse
        setStudents(data.content ?? [])
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

    fetchStudents()

    return () => controller.abort()
  }, [appliedSearch, locale, orderBy, orderDir, page, pageSize, t, token])

  useEffect(() => {
    if (!token || activeTab !== 'groups') return

    const controller = new AbortController()

    const fetchClasses = async () => {
      try {
        setIsGroupsLoading(true)
        setError(null)

        const params = new URLSearchParams({
          offset: String(groupsPage * groupsPageSize),
          limit: String(groupsPageSize),
          order_by: groupsOrderBy,
          order_dir: groupsOrderDir,
          exportAll: 'false',
          lang: locale,
        })

        if (appliedGroupSearch) {
          params.set('grade_group', appliedGroupSearch)
        }

        const response = await fetch(`${API_BASE_URL}/classes?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const data = (await response.json()) as ClassesResponse
        setGroups(data.content ?? [])
        setGroupsTotalElements(data.totalElements ?? 0)
        setGroupsTotalPages(data.totalPages ?? 0)
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          setError(t('defaultError'))
        }
      } finally {
        setIsGroupsLoading(false)
      }
    }

    fetchClasses()

    return () => controller.abort()
  }, [activeTab, appliedGroupSearch, groupsOrderBy, groupsOrderDir, groupsPage, groupsPageSize, locale, t, token])

  const handleSearchSubmit = () => {
    setAppliedSearch(searchTerm)
    setPage(0)
  }

  const handleClearSearch = () => {
    setSearchTerm('')
    setAppliedSearch('')
    setPage(0)
  }

  const handleSort = (columnKey: keyof Student) => {
    setPage(0)
    setOrderDir((prevDir) => (orderBy === columnKey ? (prevDir === 'ASC' ? 'DESC' : 'ASC') : 'ASC'))
    setOrderBy(columnKey)
  }

  const handleGroupSearchSubmit = () => {
    setAppliedGroupSearch(groupSearchTerm)
    setGroupsPage(0)
  }

  const handleGroupSort = (columnKey: keyof ClassGroup) => {
    setGroupsPage(0)
    setGroupsOrderDir((prevDir) => (groupsOrderBy === columnKey ? (prevDir === 'ASC' ? 'DESC' : 'ASC') : 'ASC'))
    setGroupsOrderBy(columnKey)
  }

  const groupColumns: Array<DataTableColumn<ClassGroup>> = useMemo(
    () => [
      {
        key: 'grade_group',
        label: 'Grupo',
        sortable: true,
      },
      {
        key: 'generation',
        label: 'Generación',
        sortable: true,
      },
      {
        key: 'scholar_level_name',
        label: 'Nivel académico',
        sortable: true,
      },
      {
        key: 'school_id',
        label: 'Escuela',
        sortable: true,
        render: (group) => <span className="fw-semibold text-black">#{group.school_id}</span>,
      },
      {
        key: 'enabled',
        label: 'Estatus',
        sortable: true,
        render: (group) => (
          <span className={`badge ${group.enabled ? 'bg-success-subtle text-success' : 'bg-secondary'}`}>
            {group.enabled ? 'Activo' : 'Inactivo'}
          </span>
        ),
      },
    ],
    [],
  )

  if (!hydrated) {
    return (
      <Layout onNavigate={onNavigate} pageTitle={t('portalTitle')} breadcrumbItems={breadcrumbItems}>
        <LoadingSkeleton variant="table" rowCount={10} />
      </Layout>
    )
  }

  return (
    <Layout onNavigate={onNavigate} pageTitle="Alumnos" breadcrumbItems={breadcrumbItems}>
      <div className="students-page d-flex flex-column gap-3">
        {error ? (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        ) : null}

        <div className="students-page__header  border-0">
          <div className="card-body d-flex flex-column gap-3 flex-lg-row align-items-lg-center justify-content-lg-between">
            
            <Tabs
              tabs={tabs}
              activeKey={activeTab}
              onSelect={(key) => setActiveTab(key as 'students' | 'groups')}
            />

            <div className="d-flex align-items-center gap-3">
              <button type="button" className="btn btn-primary">Carga Masiva (CSV)</button>
              <button type="button" className="btn btn-outline-primary">Agregar alumno</button>
            </div>
          </div>
        </div>
        {activeTab === 'students' && (
          <>
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <div className="d-flex flex-column flex-md-row gap-3 align-items-md-center justify-content-between">

                  <div className="students-search position-relative flex-grow-1">
                    <input
                      className="form-control"
                      placeholder="Buscar alumno por nombre"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          handleSearchSubmit()
                        }
                      }}
                    />
                    {searchTerm ? (
                      <button type="button" className="students-search__clear" onClick={handleClearSearch} aria-label="Borrar filtro">
                        ×
                      </button>
                    ) : null}
                  </div>
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
            </div>

            <DataTable
              columns={columns}
              data={students}
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
              onSort={(columnKey) => handleSort(columnKey as keyof Student)}
            />
          </>
        )}
        {activeTab === 'groups' && (
          <>
            <div className="card shadow-sm border-0">
              <div className="card-body d-flex flex-column gap-3 flex-md-row align-items-md-center justify-content-between">
                <SearchInput
                  value={groupSearchTerm}
                  onChange={(event) => setGroupSearchTerm(event.target.value)}
                  onSubmit={handleGroupSearchSubmit}
                  placeholder="Buscar grupo por nombre"
                  className="flex-grow-1"
                  inputClassName="w-100"
                />
              </div>
            </div>

            <DataTable
              columns={groupColumns}
              data={groups}
              isLoading={isGroupsLoading}
              emptyMessage={t('tableNoData')}
              pagination={{
                page: groupsPage,
                size: groupsPageSize,
                totalPages: groupsTotalPages,
                totalElements: groupsTotalElements,
                onPageChange: (nextPage) =>
                  setGroupsPage(Math.max(0, Math.min(groupsTotalPages - 1, nextPage))),
              }}
              sortBy={groupsOrderBy}
              sortDirection={groupsOrderDir}
              onSort={(columnKey) => handleGroupSort(columnKey as keyof ClassGroup)}
            />
          </>
        )}
      </div>
    </Layout>
  )
}
