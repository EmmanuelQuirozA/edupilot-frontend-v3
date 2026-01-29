import { useEffect, useMemo, useRef, useState } from 'react'
import { API_BASE_URL } from '../config'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import type { StudentSearchItem } from './StudentSearchDropdown'
import './StudentSearchInput.css'

interface StudentSearchInputProps {
  onNavigate: (path: string) => void
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

export function StudentSearchInput({ onNavigate, pageSize = 10 }: StudentSearchInputProps) {
  const { token } = useAuth()
  const { t, locale } = useLanguage()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<StudentSearchItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const trimmedQuery = query.trim()
  const fetchUrl = useMemo(
    () => buildStudentsUrl(trimmedQuery, locale, pageSize),
    [locale, pageSize, trimmedQuery],
  )

  useEffect(() => {
    if (!isOpen || !token || !trimmedQuery) {
      setResults([])
      setLoading(false)
      setError(null)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError(null)
    
    const timer = setTimeout(() => {

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
    }, 300)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [fetchUrl, isOpen, token, trimmedQuery])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectStudent = (student: StudentSearchItem) => {
    onNavigate(`/${locale}/students&Classes/students/${student.student_id}`)
    setQuery('')
    setIsOpen(false)
  }

  return (
    <div className="header-search" ref={containerRef}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16a6.471 6.471 0 0 0 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5Zm-6 0A4.5 4.5 0 1 1 14 9.5 4.505 4.505 0 0 1 9.5 14Z"
          fill="currentColor"
        ></path>
      </svg>
      <div className="header-student-search">
        <input
          className="form-control header-search-input header-student-search__input"
          placeholder={t('searchStudentByName')}
          type="search"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value)
            setIsOpen(true)
          }}
        />
        {isOpen && trimmedQuery && (
          <div className="header-student-search__dropdown">
            {loading && (
              <div className="header-student-search__message">{t('searching') || 'Buscando...'}</div>
            )}
            {error && <div className="header-student-search__message text-danger">{error}</div>}
            {!loading && !error && results.length === 0 && (
              <div className="header-student-search__message">{t('noResultsAvailable')}</div>
            )}
            {!loading &&
              !error &&
              results.map((student) => (
                <button
                  key={student.student_id}
                  type="button"
                  className="header-student-search__option"
                  onClick={() => handleSelectStudent(student)}
                >
                  <div className="header-student-search__name">{student.full_name}</div>
                  <div className="header-student-search__meta">
                    <span>
                      {t('register')}: {student.payment_reference || student.register_id}
                    </span>
                    <span>
                      {student.generation} • {student.grade_group} • {student.scholar_level_name}
                    </span>
                  </div>
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default StudentSearchInput
