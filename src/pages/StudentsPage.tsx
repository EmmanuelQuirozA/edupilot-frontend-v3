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
import StudentTableCell from '../components/ui/StudentTableCell';
import './StudentsPage.css'
import { useModulePermissions } from '../hooks/useModulePermissions'
import { NoPermission } from '../components/NoPermission'

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
  const { permissions: studentsPermissions, loading: studentsPermissionsLoading, error: studentsPermissionsError, loaded: studentsPermissionsLoaded } = useModulePermissions('students')
  const { permissions: groupsPermissions, loading: groupsPermissionsLoading, error: groupsPermissionsError, loaded: groupsPermissionsLoaded } = useModulePermissions('classes')

  // Students
  const [students, setStudents] = useState<Student[]>([])
  const [studentsPage, setStudentsPage] = useState(0)
  const [studentsPageSize] = useState(10)
  const [studentsTotalPages, setStudentsTotalPages] = useState(0)
  const [studentsTotalElements, setStudentsTotalElements] = useState(0)
  const [isStudentsLoading, setIsStudentsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [studentSearchTerm, setStudentSearchTerm] = useState('')
  const [appliedStudentSearch, setAppliedSearch] = useState('')
  
  const [orderBy, setOrderBy] = useState('')
  const [orderDir, setOrderDir] = useState<OrderDirection>('ASC')

  // Groups
  const [groups, setGroups] = useState<ClassGroup[]>([])
  const [groupsPage, setGroupsPage] = useState(0)
  const [groupsPageSize] = useState(10)
  const [groupsTotalPages, setGroupsTotalPages] = useState(0)
  const [groupsTotalElements, setGroupsTotalElements] = useState(0)
  const [isGroupsLoading, setIsGroupsLoading] = useState(false)

  const [groupSearchTerm, setGroupSearchTerm] = useState('')
  const [appliedGroupSearch, setAppliedGroupSearch] = useState('')
  
  const [groupsOrderBy, setGroupsOrderBy] = useState('')
  const [groupsOrderDir, setGroupsOrderDir] = useState<OrderDirection>('ASC')

  // Tabs
  const [activeTab, setActiveTab] = useState<'students' | 'groups'>('students');
  const tabs = [
    { key: 'students', label: t('students') },
    { key: 'groups', label: t('classes') }
  ];

  const breadcrumbItems: BreadcrumbItem[] = useMemo(
    () => [
      {
        label: t('portalTitle'),
        onClick: () => onNavigate(`/${locale}`),
      },
      { label: t('studentsGroups') },
    ],
    [locale, onNavigate, t],
  )

  // Students
  useEffect(() => {
    if (!token) return

    const controller = new AbortController()

    const fetchStudents = async () => {
      setIsStudentsLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          lang: locale,
          offset: String(studentsPage * studentsPageSize),
          limit: String(studentsPageSize),
          export_all: 'false',
          order_by: orderBy,
          order_dir: orderDir,
        })

        if (appliedStudentSearch) {
          params.set('full_name', appliedStudentSearch)
        }

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
        setStudentsTotalElements(data.totalElements ?? 0)
        setStudentsTotalPages(data.totalPages ?? 0)
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          setError(t('defaultError'))
        }
      } finally {
        setIsStudentsLoading(false)
      }
    }

    fetchStudents()

    return () => controller.abort()
  }, [appliedStudentSearch, locale, orderBy, orderDir, studentsPage, studentsPageSize, t, token])

  const handleStudentSearchSubmit = () => {
    setAppliedSearch(studentSearchTerm)
    setStudentsPage(0)
  }

  const handleStudentClearSearch = () => {
    setStudentSearchTerm('')
    setAppliedSearch('')
    setStudentsPage(0)
  }

  const handleStudentSort = (columnKey: keyof Student) => {
    setStudentsPage(0)
    setOrderDir((prevDir) => (orderBy === columnKey ? (prevDir === 'ASC' ? 'DESC' : 'ASC') : 'ASC'))
    setOrderBy(columnKey)
  }

  const studentsColumns: Array<DataTableColumn<Student>> = useMemo(
    () => [
      {
        key: 'full_name',
        label: 'Alumno',
        sortable: true,
        render: (student) => (
          <StudentTableCell
            name={student.full_name}
            fallbackName={t('tableStrings.studentFallback')}
            gradeGroup={student.grade_group}
            scholarLevel={student.scholar_level_name}
            enrollment={student.register_id}
            onClick={() => onNavigate(`/${locale}/students/${student.student_id}`)}
            nameButtonProps={{ 'aria-label': student.full_name }}
          />
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
    [locale, onNavigate, t],
  )
  
  // Groups
  useEffect(() => {
    if (!token || activeTab !== 'groups') return

    const controller = new AbortController()

    const fetchClasses = async () => {
      try {
        setIsGroupsLoading(true)
        setError(null)

        const params = new URLSearchParams({
          lang: locale,
          offset: String(groupsPage * groupsPageSize),
          limit: String(groupsPageSize),
          exportAll: 'false',
          order_by: groupsOrderBy,
          order_dir: groupsOrderDir,
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

  const handleGroupSearchSubmit = () => {
    setAppliedGroupSearch(groupSearchTerm)
    setGroupsPage(0)
  }

  const handleGroupClearSearch = () => {
    setGroupSearchTerm('')
    setAppliedGroupSearch('')
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
  
  if (studentsPermissionsLoading || !studentsPermissionsLoaded || groupsPermissionsLoading || !groupsPermissionsLoaded) {
    return (
      <>
        <LoadingSkeleton variant="table" rowCount={10} />
      </>
    )
  }

  if (studentsPermissionsError || groupsPermissionsError) {
    return (
      <>
        <div className="alert alert-danger" role="alert">
          {t('defaultError')}
        </div>
      </>
    )
  }
    
  if (
    (studentsPermissionsLoaded && studentsPermissions && !studentsPermissions.r)
    &&
    (groupsPermissionsLoaded && groupsPermissions && !groupsPermissions.r)
  ) {
    return (
      <Layout onNavigate={onNavigate} pageTitle={t('portalTitle')} breadcrumbItems={breadcrumbItems}>
        <NoPermission />
      </Layout>
    )
  }

  if (!hydrated) {
    return (
      <Layout onNavigate={onNavigate} pageTitle={t('portalTitle')} breadcrumbItems={breadcrumbItems}>
        <LoadingSkeleton variant="table" rowCount={10} />
      </Layout>
    )
  }

  return (
    <Layout onNavigate={onNavigate} pageTitle={t('studentsGroups')} breadcrumbItems={breadcrumbItems}>
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
          </div>
        </div>
        {activeTab === 'students' && (
          <>
            <div className="card shadow-sm border-0">
              <div className="card-body d-flex flex-column gap-3 flex-md-row align-items-md-center justify-content-between">
                <SearchInput
                  value={studentSearchTerm}
                  onChange={(val) => setStudentSearchTerm(val)}
                  onSubmit={handleStudentSearchSubmit}
                  onClear={handleStudentClearSearch}
                  placeholder={t("searchStudentByName")}
                  className="flex-grow-1"
                  inputClassName="w-100"
                />
                <button type="button" className="students-filter-button">
                  <svg viewBox="0 0 20 20" aria-hidden="true" className="students-filter-button__icon" focusable="false">
                    <path d="M4 5.25C4 4.56 4.56 4 5.25 4h9a.75.75 0 0 1 .6 1.2L12 9.25v3.7a.75.75 0 0 1-.3.6l-2 1.5A.75.75 0 0 1 8.5 14V9.25L4.4 5.2A.75.75 0 0 1 4 4.5Z" />
                  </svg>
                  <span className="fw-semibold">Filtros</span>
                </button>
                <div className="d-flex align-items-center gap-3">
                  <button type="button" className="btn btn-primary">Carga Masiva (CSV)</button>
                  <button type="button" className="btn btn-outline-primary">Agregar alumno</button>
                </div>
              </div>
            </div>

            <DataTable
              columns={studentsColumns}
              data={students}
              isLoading={isStudentsLoading}
              emptyMessage={t('tableNoData')}
              pagination={{
                page: studentsPage,
                size: studentsPageSize,
                totalPages: studentsTotalPages,
                totalElements: studentsTotalElements,
                onPageChange: (nextPage) => setStudentsPage(Math.max(0, Math.min(studentsTotalPages - 1, nextPage))),
              }}
              sortBy={orderBy}
              sortDirection={orderDir}
              onSort={(columnKey) => handleStudentSort(columnKey as keyof Student)}
            />
          </>
        )}
        {activeTab === 'groups' && (
          <>
            <div className="card shadow-sm border-0">
              <div className="card-body d-flex flex-column gap-3 flex-md-row align-items-md-center justify-content-between">
                <SearchInput
                  value={groupSearchTerm}
                  onChange={(val) => setGroupSearchTerm(val)}
                  onSubmit={handleGroupSearchSubmit}
                  onClear={handleGroupClearSearch}
                  placeholder={t("searchByGroup")}
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
