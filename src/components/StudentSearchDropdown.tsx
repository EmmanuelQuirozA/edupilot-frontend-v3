import { useEffect, useMemo, useRef, useState } from 'react'
import { API_BASE_URL } from '../config'
import { useAuth } from '../context/AuthContext'
import './StudentSearchDropdown.css'

export interface StudentSearchItem {
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

interface StudentSearchDropdownProps {
  onSelect: (student: StudentSearchItem) => void
  placeholder?: string
  label?: string
  lang?: string
  pageSize?: number
}

interface StudentSearchResponse {
  content: StudentSearchItem[]
}

const buildStudentsUrl = (query: string, lang: string, size: number) => {
  const params = new URLSearchParams()
  params.set('lang', lang)
  params.set('offset', '0')
  params.set('limit', String(size))
  params.set('export_all', 'false')

  if (query.trim()) {
    params.set('full_name', query.trim())
  }

  return `${API_BASE_URL}/students?${params.toString()}`
}

export function StudentSearchDropdown({
  onSelect,
  placeholder = 'Buscar por nombre',
  label = 'Buscar alumno',
  lang = 'es',
  pageSize = 10,
}: StudentSearchDropdownProps) {
  const { token } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<StudentSearchItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  const fetchUrl = useMemo(
    () => buildStudentsUrl(query, lang, pageSize),
    [lang, pageSize, query],
  )

  useEffect(() => {
    if (!isOpen || !token) return

    const controller = new AbortController()
    setLoading(true)
    setError(null)

    fetch(fetchUrl, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('No se pudo cargar el catálogo de alumnos')
        }
        const data: StudentSearchResponse = await response.json()
        setResults(Array.isArray(data.content) ? data.content : [])
      })
      .catch((fetchError) => {
        if (controller.signal.aborted) return
        setError(fetchError instanceof Error ? fetchError.message : 'Error desconocido')
        setResults([])
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })

    return () => controller.abort()
  }, [fetchUrl, isOpen, token])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (value: string) => {
    setQuery(value)
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    setDebounceTimer(
      setTimeout(() => {
        setIsOpen(true)
      }, 300),
    )
  }

  const renderResult = (student: StudentSearchItem) => (
    <button
      key={student.student_id}
      type="button"
      className="student-search__option"
      onClick={() => {
        onSelect(student)
        setIsOpen(false)
      }}
    >
      <div className="student-search__name">{student.full_name}</div>
      <div className="student-search__meta">
        <span>Matrícula: {student.payment_reference}</span>
        <span>
          {student.generation} • {student.grade_group} • {student.scholar_level_name}
        </span>
      </div>
    </button>
  )

  return (
    <div className="student-search" ref={dropdownRef}>
      <label className="form-label d-flex flex-column gap-1 w-100">
        <span className="text-muted small">{label}</span>
        <input
          type="text"
          value={query}
          className="form-control"
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => handleInputChange(e.target.value)}
        />
      </label>

      {isOpen && (
        <div className="student-search__dropdown">
          {loading && <div className="student-search__message">Buscando...</div>}
          {error && <div className="student-search__message text-danger">{error}</div>}
          {!loading && !error && results.length === 0 && (
            <div className="student-search__message">Sin resultados</div>
          )}
          {!loading && !error && results.map(renderResult)}
        </div>
      )}
    </div>
  )
}

export default StudentSearchDropdown
