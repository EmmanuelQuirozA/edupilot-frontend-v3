import { useEffect, useMemo, useState } from 'react'
import { Layout } from '../layout/Layout'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { API_BASE_URL } from '../config'
import type { BreadcrumbItem } from '../components/Breadcrumb'
import { LoadingSkeleton } from '../components/LoadingSkeleton'
import { useModulePermissions } from '../hooks/useModulePermissions'
import { NoPermission } from '../components/NoPermission'

interface School {
  school_id: number
  description: string
}

interface Role {
  role_id: number
  role_name: string
  role_description: string | null
  enabled: boolean
}

interface PermissionRow {
  permission_id: number
  module_id: number
  module_name: string
  module_key: string
  sort_order: number | null
  c: boolean
  r: boolean
  u: boolean
  d: boolean
}

interface RolesPermissionsPageProps {
  onNavigate: (path: string) => void
}

export function RolesPermissionsPage({ onNavigate }: RolesPermissionsPageProps) {
  const { token, hydrated } = useAuth()
  const { locale, t } = useLanguage()
  const {
    permissions,
    loading: permissionsLoading,
    loaded: permissionsLoaded,
    error: permissionsError,
  } = useModulePermissions('users')

  const [schools, setSchools] = useState<School[]>([])
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null)
  const [schoolsLoading, setSchoolsLoading] = useState(false)

  const [roles, setRoles] = useState<Role[]>([])
  const [rolesLoading, setRolesLoading] = useState(false)
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)

  const [permissionRows, setPermissionRows] = useState<PermissionRow[]>([])
  const [permissionRowsLoading, setPermissionRowsLoading] = useState(false)

  const breadcrumbItems: BreadcrumbItem[] = useMemo(
    () => [
      {
        label: t('portalTitle'),
        onClick: () => onNavigate(`/${locale}`),
      },
      { label: t('rolesPermissionsTitle') },
    ],
    [locale, onNavigate, t],
  )

  useEffect(() => {
    if (!token) return

    const controller = new AbortController()

    const fetchSchools = async () => {
      setSchoolsLoading(true)
      try {
        const response = await fetch(`${API_BASE_URL}/schools/list`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const json = (await response.json()) as School[]
        setSchools(json)
      } catch (error) {
        if ((error as DOMException).name !== 'AbortError') {
          setSchools([])
        }
      } finally {
        setSchoolsLoading(false)
      }
    }

    fetchSchools()

    return () => controller.abort()
  }, [token])

  useEffect(() => {
    if (!token || !selectedSchoolId) return

    const controller = new AbortController()
    const fetchRoles = async () => {
      setRolesLoading(true)
      setSelectedRoleId(null)
      setPermissionRows([])
      try {
        const params = new URLSearchParams({
          lang: locale,
          school_id: String(selectedSchoolId),
        })
        const response = await fetch(`${API_BASE_URL}/roles?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const json = (await response.json()) as Role[]
        setRoles(json)
      } catch (error) {
        if ((error as DOMException).name !== 'AbortError') {
          setRoles([])
        }
      } finally {
        setRolesLoading(false)
      }
    }

    fetchRoles()
    return () => controller.abort()
  }, [locale, selectedSchoolId, token])

  useEffect(() => {
    if (!token || !selectedRoleId) return

    const controller = new AbortController()
    const fetchPermissions = async () => {
      setPermissionRowsLoading(true)
      try {
        const response = await fetch(
          `${API_BASE_URL}/permissions/module-access?roleId=${selectedRoleId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          },
        )

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const json = (await response.json()) as PermissionRow[]
        setPermissionRows(json)
      } catch (error) {
        if ((error as DOMException).name !== 'AbortError') {
          setPermissionRows([])
        }
      } finally {
        setPermissionRowsLoading(false)
      }
    }

    fetchPermissions()
    return () => controller.abort()
  }, [selectedRoleId, token])

  const sortedPermissions = useMemo(
    () =>
      [...permissionRows].sort((a, b) => {
        const orderA = a.sort_order ?? Number.MAX_SAFE_INTEGER
        const orderB = b.sort_order ?? Number.MAX_SAFE_INTEGER
        if (orderA !== orderB) return orderA - orderB
        return a.module_name.localeCompare(b.module_name)
      }),
    [permissionRows],
  )

  if (!hydrated || permissionsLoading || !permissionsLoaded) {
    return (
      <Layout onNavigate={onNavigate} pageTitle={t('rolesPermissionsTitle')} breadcrumbItems={breadcrumbItems}>
        <LoadingSkeleton variant="dashboard" cardCount={8} />
      </Layout>
    )
  }

  if (permissionsError || !permissions?.readAllowed) {
    return (
      <Layout onNavigate={onNavigate} pageTitle={t('rolesPermissionsTitle')} breadcrumbItems={breadcrumbItems}>
        <NoPermission onNavigate={onNavigate} />
      </Layout>
    )
  }

  return (
    <Layout
      onNavigate={onNavigate}
      pageTitle={t('rolesPermissionsTitle')}
      breadcrumbItems={breadcrumbItems}
    >
      <div className="d-flex flex-column gap-4">
        <div className="card shadow-sm">
          <div className="card-body">
            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
              <div>
                <h2 className="h4 mb-1">{t('rolesPermissionsTitle')}</h2>
                <p className="text-muted mb-0">{t('rolesPermissionsSubtitle')}</p>
              </div>
              <div className="text-muted small">
                {t('rolesPermissionsHelper')}
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-lg-6">
                <label className="form-label fw-semibold" htmlFor="schoolSelect">
                  {t('selectSchoolLabel')}
                </label>
                <select
                  id="schoolSelect"
                  className="form-select"
                  value={selectedSchoolId ?? ''}
                  onChange={(event) => setSelectedSchoolId(event.target.value ? Number(event.target.value) : null)}
                  disabled={schoolsLoading}
                >
                  <option value="">{schoolsLoading ? t('tableLoading') : t('selectPlaceholder')}</option>
                  {schools.map((school) => (
                    <option key={school.school_id} value={school.school_id}>
                      {school.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-lg-6">
                <label className="form-label fw-semibold" htmlFor="roleSelect">
                  {t('selectRoleLabel')}
                </label>
                <select
                  id="roleSelect"
                  className="form-select"
                  value={selectedRoleId ?? ''}
                  onChange={(event) => setSelectedRoleId(event.target.value ? Number(event.target.value) : null)}
                  disabled={!selectedSchoolId || rolesLoading}
                >
                  <option value="">{rolesLoading ? t('tableLoading') : t('selectPlaceholder')}</option>
                  {roles.map((role) => (
                    <option key={role.role_id} value={role.role_id}>
                      {role.role_name}
                    </option>
                  ))}
                </select>
                {selectedRoleId && (
                  <p className="text-muted small mt-2 mb-0">
                    {roles.find((role) => role.role_id === selectedRoleId)?.role_description || t('noDescription')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h3 className="h5 mb-1">{t('permissionsTableTitle')}</h3>
                <p className="text-muted mb-0">{t('permissionsTableSubtitle')}</p>
              </div>
              {permissionRowsLoading ? (
                <span className="badge bg-secondary">{t('tableLoading')}</span>
              ) : null}
            </div>

            {!selectedRoleId ? (
              <p className="text-muted mb-0">{t('selectRolePrompt')}</p>
            ) : null}

            {selectedRoleId && !permissionRowsLoading && sortedPermissions.length === 0 ? (
              <p className="text-muted mb-0">{t('tableNoData')}</p>
            ) : null}

            {selectedRoleId && sortedPermissions.length > 0 ? (
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th scope="col">{t('moduleColumn')}</th>
                      <th scope="col" className="text-center">{t('permissionCreate')}</th>
                      <th scope="col" className="text-center">{t('permissionRead')}</th>
                      <th scope="col" className="text-center">{t('permissionUpdate')}</th>
                      <th scope="col" className="text-center">{t('permissionDelete')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPermissions.map((permission) => (
                      <tr key={permission.permission_id}>
                        <th scope="row" className="fw-semibold">
                          <div className="d-flex flex-column">
                            <span>{permission.module_name}</span>
                            <small className="text-muted">{permission.module_key}</small>
                          </div>
                        </th>
                        {[permission.c, permission.r, permission.u, permission.d].map((value, index) => (
                          <td key={index} className="text-center">
                            <span className={`badge ${value ? 'bg-success' : 'bg-secondary'} px-3`}>
                              {value ? t('permissionAllowed') : t('permissionDenied')}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Layout>
  )
}
