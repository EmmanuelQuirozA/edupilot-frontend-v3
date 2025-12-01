import { useMemo, useState } from 'react'
import { Layout } from '../layout/Layout'
import { useLanguage } from '../context/LanguageContext'
import { FilterSidebar } from '../components/FilterSidebar'
import { StudentsGrid, type StudentCardItem } from '../components/StudentsGrid'
import './DashboardTeacherPage.css'

interface DashboardTeacherPageProps {
  onNavigate: (path: string) => void
}

const STUDENTS: StudentCardItem[] = [
  {
    id: 1,
    name: 'Efraín Ortega',
    grade: '3° Primaria',
    group: 'Grupo A / Matemáticas',
    email: 'efrain.ortega@colegio.edu',
    phone: '+52 55 1234 5678',
    status: 'Becado',
    guardian: 'Mónica Ortega',
    attendance: '95% asistencia',
  },
  {
    id: 2,
    name: 'Karla Hernández',
    grade: '3° Primaria',
    group: 'Grupo B / Ciencias',
    email: 'karla.hdz@colegio.edu',
    phone: '+52 55 8765 4321',
    status: 'Activo',
    guardian: 'Miguel Hernández',
    attendance: '98% asistencia',
  },
  {
    id: 3,
    name: 'Ramiro Silva',
    grade: '2° Primaria',
    group: 'Grupo A / Historia',
    email: 'ramiro.silva@colegio.edu',
    phone: '+52 81 2233 4455',
    status: 'Pendiente',
    guardian: 'Beatriz Silva',
    attendance: '88% asistencia',
  },
  {
    id: 4,
    name: 'Daniela Flores',
    grade: '2° Primaria',
    group: 'Grupo B / Arte',
    email: 'daniela.flores@colegio.edu',
    phone: '+52 33 4455 6677',
    status: 'Activo',
    guardian: 'Claudia Flores',
    attendance: '100% asistencia',
  },
]

export function DashboardTeacherPage({ onNavigate }: DashboardTeacherPageProps) {
  const { t } = useLanguage()
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [gradeFilter, setGradeFilter] = useState<string>('todos')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredStudents = useMemo(() => {
    return STUDENTS.filter((student) => {
      const matchesStatus = statusFilter === 'todos' || student.status.toLowerCase() === statusFilter
      const matchesGrade = gradeFilter === 'todos' || student.grade === gradeFilter
      const normalizedSearch = searchTerm.trim().toLowerCase()
      const matchesSearch =
        normalizedSearch.length === 0 ||
        student.name.toLowerCase().includes(normalizedSearch) ||
        student.group.toLowerCase().includes(normalizedSearch)

      return matchesStatus && matchesGrade && matchesSearch
    })
  }, [gradeFilter, searchTerm, statusFilter])

  const clearFilters = () => {
    setStatusFilter('todos')
    setGradeFilter('todos')
    setSearchTerm('')
  }

  const applyFilters = () => {
    setIsFilterOpen(false)
  }

  return (
    <Layout onNavigate={onNavigate} pageTitle={t('portalTitle')}>
      <div className="dashboard-teacher__hero">
        <div>
          <p className="text-uppercase text-muted mb-1">Panel de profesores</p>
          <h2 className="fw-bold mb-2">{t('welcome')}</h2>
          <p className="text-muted mb-0">Administra clases, asistencia y comunica novedades a tus estudiantes.</p>
        </div>
        <div className="dashboard-teacher__actions">
          <button className="btn btn-outline-primary" onClick={() => onNavigate('/')}>Home</button>
          <button className="btn btn-primary" onClick={() => setIsFilterOpen(true)}>
            Abrir filtros
          </button>
        </div>
      </div>

      <div className={isFilterOpen ? 'dashboard-teacher__content is-blurred' : 'dashboard-teacher__content'}>
        <div className="dashboard-teacher__header">
          <div>
            <p className="text-uppercase text-muted mb-1">Alumnos activos</p>
            <h3 className="fw-bold mb-0">Listado de alumnos</h3>
          </div>
          <div className="dashboard-teacher__summary">
            <span className="summary-pill">Total: {filteredStudents.length}</span>
            {statusFilter !== 'todos' && <span className="summary-pill">Estado: {statusFilter}</span>}
            {gradeFilter !== 'todos' && <span className="summary-pill">Grado: {gradeFilter}</span>}
          </div>
        </div>

        <StudentsGrid students={filteredStudents} onNavigate={onNavigate} />
      </div>

      <FilterSidebar
        title="Filtrar alumnos"
        subtitle="Aplica criterios para encontrar alumnos específicos"
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onClear={clearFilters}
        onApply={applyFilters}
      >
        <div className="mb-3">
          <label htmlFor="search">Buscar alumno</label>
          <input
            id="search"
            className="form-control"
            placeholder="Nombre o grupo"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="status">Estado</label>
          <select
            id="status"
            className="form-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="activo">Activo</option>
            <option value="pendiente">Pendiente</option>
            <option value="becado">Becado</option>
          </select>
        </div>

        <div className="mb-3">
          <label htmlFor="grade">Grado</label>
          <select
            id="grade"
            className="form-select"
            value={gradeFilter}
            onChange={(event) => setGradeFilter(event.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="3° Primaria">3° Primaria</option>
            <option value="2° Primaria">2° Primaria</option>
          </select>
        </div>
      </FilterSidebar>
    </Layout>
  )
}
