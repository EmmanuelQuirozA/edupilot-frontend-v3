/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useRef, useState } from 'react'
import { API_BASE_URL } from '../config'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import './StudentSearchDropdown.css'

export interface UsersBalanceSearchItem {
  user_id: number
  full_name: string
  role_name: string
  generation: string | null
  scholar_level_name: string | null
  grade_group: string | null
  balance: number
}

type UsersBalanceSearchValue =
  | UsersBalanceSearchItem
  | {
    user_id?: number | string
    id?: number | string
    full_name?: string
    name?: string
    grade_group?: string
    generation?: string
    scholar_level_name?: string
    balance?: number
    role_name?: string
  }

interface UsersBalanceSearchDropdownProps {
  onSelect: (user: UsersBalanceSearchValue) => void
  placeholder?: string
  label?: string
  lang?: string
  pageSize?: number
  value?: UsersBalanceSearchValue[]
  onClear?: () => void
}

interface UsersBalanceSearchResponse {
  content: UsersBalanceSearchItem[]
}

const buildUsersBalanceUrl = (query: string, lang: string, size: number) => {
  const params = new URLSearchParams()
  params.set('lang', lang)
  params.set('offset', '0')
  params.set('limit', String(size))
  params.set('export_all', 'false')

  if (query.trim()) {
    params.set('full_name', query.trim())
  }

  return `${API_BASE_URL}/users/balances?${params.toString()}`
}

const isStudentRole = (roleName?: string | null) => {
  if (!roleName) return false
  const normalizedRole = roleName.toLowerCase()
  return normalizedRole.includes('student') || normalizedRole.includes('estudiante')
}

export function UsersBalanceSearchDropdown({
  onSelect,
  placeholder = 'Buscar usuario por nombre',
  label = 'Buscar usuario o estudiante',
  lang,
  pageSize = 10,
  value = [],
  onClear,
}: UsersBalanceSearchDropdownProps) {
  const { token } = useAuth()
  const { t, locale } = useLanguage()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UsersBalanceSearchItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedName, setSelectedName] = useState('')
  const [userDetail, setUserDetail] = useState('')

  const fetchUrl = useMemo(
    () => buildUsersBalanceUrl(query, lang || locale || 'es', pageSize),
    [lang, locale, pageSize, query],
  )

  useEffect(() => {
    const [selected] = value ?? []
    if (selected) {
      const selectedItem = selected as UsersBalanceSearchItem
      const displayName = selectedItem.full_name || (selected as { name?: string }).name || ''
      const balanceText = `${t('balance')}: $${(selectedItem.balance ?? 0).toFixed(2)}`
      const detailParts = isStudentRole(selectedItem.role_name)
        ? [
            selectedItem.grade_group || (selected as { grade_group?: string }).grade_group,
            selectedItem.generation || (selected as { generation?: string }).generation,
            selectedItem.scholar_level_name || (selected as { scholar_level_name?: string }).scholar_level_name,
          ].filter(Boolean)
        : []

      setSelectedName(displayName)
      setUserDetail(detailParts.length ? detailParts.join(' • ') : balanceText)
    } else {
      setSelectedName('')
      setUserDetail('')
    }
  }, [t, value])

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
          throw new Error('No se pudo cargar el catálogo de usuarios')
        }
        const data: UsersBalanceSearchResponse = await response.json()
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

  const handleInputChange = (input: string) => {
    setQuery(input)
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    setDebounceTimer(
      setTimeout(() => {
        setIsOpen(true)
      }, 300),
    )
  }

  const renderResult = (user: UsersBalanceSearchItem) => {
    const student = isStudentRole(user.role_name)
    const detailParts = student
      ? [user.generation, user.grade_group, user.scholar_level_name].filter(Boolean)
      : [user.role_name].filter(Boolean)
    const balanceText = `${t('balance')}: $${(user.balance ?? 0).toFixed(2)}`

    return (
      <button
        key={user.user_id}
        type="button"
        className="student-search__option"
        onClick={() => {
          onSelect(user)
          setSelectedName(user.full_name)
          setUserDetail(
            student ? detailParts.join(' • ') : balanceText,
          )
          setIsOpen(false)
          setQuery('')
        }}
      >
        <div className="student-search__name d-flex justify-content-between align-items-center">
          <span>{user.full_name}</span>
          {user.role_name ? <span className="badge bg-light text-dark">{user.role_name}</span> : null}
        </div>
        <div className="student-search__meta">
          {detailParts.length ? <span>{detailParts.join(' • ')}</span> : null}
          <span>{balanceText}</span>
        </div>
      </button>
    )
  }

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
                setUserDetail('')
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
          <span className="small text-muted">{userDetail}</span>
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

export default UsersBalanceSearchDropdown
