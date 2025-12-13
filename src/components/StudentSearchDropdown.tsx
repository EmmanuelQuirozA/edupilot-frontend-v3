import { useEffect, useMemo, useRef, useState } from 'react'
import { API_BASE_URL } from '../config'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
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

type StudentSearchValue =
  | StudentSearchItem
  | {
    student_id?: number | string
    id?: number | string
    full_name?: string
    name?: string
    register_id?: string
    payment_reference?: string
    grade_group?: string
    generation?: string
    scholar_level_name?: string
  }

  interface StudentSearchDropdownProps {
    onSelect: (student: StudentSearchValue) => void
  placeholder?: string
  label?: string
  lang?: string
  pageSize?: number
  value?: StudentSearchValue[]
  onClear?: () => void
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
  placeholder = 'Buscar alumno por nombre',
  label = 'Buscar alumno',
  lang = 'es',
  pageSize = 10,
  value = [],
  onClear,
}: StudentSearchDropdownProps) {
  const { token } = useAuth()
  const { t } = useLanguage()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<StudentSearchItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedName, setSelectedName] = useState('')
  const [stuendtDetail, setStuendtDetail] = useState('')

  useEffect(() => {
    const [selected] = value ?? []
    if (selected) {
      const selectedItem = selected as StudentSearchItem
      const displayName = selectedItem.full_name || (selected as { name?: string }).name || ''
      const register = selectedItem.register_id || (selected as { payment_reference?: string }).payment_reference || ''
      const detailParts = [
        register ? `${t('register')}: ${register}` : '',
        selectedItem.grade_group || (selected as { grade_group?: string }).grade_group,
        selectedItem.generation || (selected as { generation?: string }).generation,
        selectedItem.scholar_level_name || (selected as { scholar_level_name?: string }).scholar_level_name,
      ].filter(Boolean)

      setSelectedName(displayName)
      setStuendtDetail(detailParts.join(' • '))
    } else {
      setSelectedName('')
      setStuendtDetail('')
    }
  }, [t, value])

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

  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus()
    }
  }, [isOpen])

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
        setSelectedName(student.full_name)
        setStuendtDetail(
          `${t('register')}: ${student.register_id} • ${student.grade_group} • ${student.generation} • ${student.scholar_level_name}`,
        )
        setIsOpen(false)
        setQuery('')
      }}
    >
      <div className="student-search__name">{student.full_name}</div>
      <div className="student-search__meta">
        <span>
          {t('register')}: {student.payment_reference || student.register_id}
        </span>
        <span>
          {student.generation} • {student.grade_group} • {student.scholar_level_name}
        </span>
      </div>
    </button>
  )

  return (
    <div className="student-search" ref={dropdownRef}>
      <label className="form-label d-flex flex-column gap-1 w-100">
        <div className="d-flex justify-content-between align-items-center">
          <span className="text-muted small">{label}</span>
          {selectedName && onClear ? (
            <button
              type="button"
              className="btn btn-link btn-sm p-0"
              onClick={() => {
                onClear()
                setSelectedName('')
                setStuendtDetail('')
              }}
            >
              {t('clear')}
            </button>
          ) : null}
        </div>
        <button
          type="button"
          className={`student-search__trigger form-control text-start ${
            isOpen ? 'student-search__trigger--open' : ''
          }`}
          onClick={() =>
            setIsOpen((prev) => {
              const next = !prev
              if (next) {
                setQuery('')
              }
              return next
            })
          }
        >
          <span className={`student-search__trigger-text ${!selectedName ? 'text-muted' : ''}`}>
            {selectedName || placeholder || t('searchStudentByName')}
          </span>
        </button>
        <div className="d-flex align-items-center justify-content-between mt-2">
          <span className="small text-muted">{stuendtDetail}</span>
        </div>
      </label>

      {isOpen && (
        <div className="student-search__dropdown">
          <div className="student-search__search-bar">
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              className="form-control"
              placeholder={placeholder || t('searchStudentByName')}
              onChange={(e) => handleInputChange(e.target.value)}
            />
          </div>
          {loading && <div className="student-search__message">{t('searching') || 'Buscando...'}</div>}
          {error && <div className="student-search__message text-danger">{error}</div>}
          {!loading && !error && results.length === 0 && (
            <div className="student-search__message">{t('noResultsAvailable')}</div>
          )}
          {!loading && !error && results.map(renderResult)}
        </div>
      )}
    </div>
  )
}

export default StudentSearchDropdown
