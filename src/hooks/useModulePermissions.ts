import { useEffect, useState } from 'react'

import { API_BASE_URL } from '../config'
import { useAuth } from '../context/AuthContext'

export interface ModulePermission {
  moduleId?: number
  moduleName?: string
  moduleKey?: string
  moduleAccessControlId?: number
  schoolId?: number
  enabled?: boolean
  sortOrder?: number | null
  roleId?: number
  roleName?: string
  roleNameDisplay?: string
  createAllowed: boolean
  readAllowed: boolean
  updateAllowed: boolean
  deleteAllowed: boolean
}

interface UseModulePermissionsResult {
  permissions: ModulePermission | null
  loading: boolean
  error: string | null
  loaded: boolean
}

const DEFAULT_PERMISSIONS: ModulePermission = {
  createAllowed: false,
  readAllowed: false,
  updateAllowed: false,
  deleteAllowed: false,
}

export function useModulePermissions(moduleKey: string): UseModulePermissionsResult {
  const { token, hydrated } = useAuth()

  const [permissions, setPermissions] = useState<ModulePermission | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!token || !hydrated) return

    const controller = new AbortController()
    const fetchPermissions = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`${API_BASE_URL}/permissions/module?moduleKey=${moduleKey}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const json = await response.json()
        const permissionEntry = Array.isArray(json) && json.length > 0 ? json[0] : DEFAULT_PERMISSIONS
        setPermissions({ ...DEFAULT_PERMISSIONS, ...permissionEntry })
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          setError((fetchError as Error).message)
          setPermissions(DEFAULT_PERMISSIONS)
        }
      } finally {
        setLoaded(true)
        setLoading(false)
      }
    }

    fetchPermissions()

    return () => controller.abort()
  }, [hydrated, moduleKey, token])

  return { permissions, loading, error, loaded }
}
