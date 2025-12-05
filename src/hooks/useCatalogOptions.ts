import { useCallback, useEffect, useMemo, useState } from 'react'
import { API_BASE_URL } from '../config'

export interface CatalogOption {
  id: number
  name: string
  description?: string | null
}

interface UseCatalogOptionsResult {
  options: CatalogOption[]
  loading: boolean
  error: string | null
  refresh: () => void
}

const buildUrl = (endpoint: string, lang: string) => {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  const searchParams = new URLSearchParams({ lang })

  return `${API_BASE_URL}/${normalizedEndpoint}?${searchParams.toString()}`
}

export const useCatalogOptions = (
  endpoint: string,
  lang: string,
  initialOptions: CatalogOption[] = [],
): UseCatalogOptionsResult => {
  const [options, setOptions] = useState<CatalogOption[]>(initialOptions)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const url = useMemo(() => buildUrl(endpoint, lang), [endpoint, lang])

  const refresh = useCallback(() => {
    setReloadToken((value) => value + 1)
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    const fetchOptions = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(url, { signal: controller.signal })

        if (!response.ok) {
          throw new Error('Failed to load catalog options')
        }

        const data: CatalogOption[] = await response.json()
        setOptions(Array.isArray(data) ? data : [])
      } catch (err) {
        if (controller.signal.aborted) return

        setError(err instanceof Error ? err.message : 'Unknown error')
        setOptions([])
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchOptions()

    return () => controller.abort()
  }, [reloadToken, url])

  return { options, loading, error, refresh }
}

export default useCatalogOptions
