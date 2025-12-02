import type { Dispatch, SetStateAction } from 'react'

export function handleExpiredToken(response: Response, logout: () => void) {
  if (response.status === 401 || response.status === 403) {
    logout()
  }
}

export function createUrlSearchParams(base: URLSearchParams, extra?: Record<string, string | number>) {
  const params = new URLSearchParams(base)

  if (extra) {
    Object.entries(extra).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.set(key, String(value))
      }
    })
  }

  return params
}

export const MONTH_KEY_REGEX = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i

export type Setter<T> = Dispatch<SetStateAction<T>>
