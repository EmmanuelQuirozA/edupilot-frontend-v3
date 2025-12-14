import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
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

interface PlanModule {
  moduleName: string
  moduleId: number
  moduleKey: string
  moduleDescription: string | null
}

type PermissionKey = 'c' | 'r' | 'u' | 'd'

interface PermissionUpdateResponse {
  type?: 'success' | 'error'
  title?: string
  message?: string
  success?: boolean
}

interface RolesPermissionsPageProps {
  onNavigate: (path: string) => void
  embedded?: boolean
}

export function RolesPermissionsPage({ onNavigate, embedded = false }: RolesPermissionsPageProps) {
  const { token, hydrated } = useAuth()
  const { locale, t } = useLanguage()
  const {
    permissions,
    loading: permissionsLoading,
    loaded: permissionsLoaded,
    error: permissionsError,
  } = useModulePermissions('roles')

  const [schools, setSchools] = useState<School[]>([])
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null)
  const [schoolsLoading, setSchoolsLoading] = useState(false)

  const [roles, setRoles] = useState<Role[]>([])
  const [rolesLoading, setRolesLoading] = useState(false)
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)

  const [permissionRows, setPermissionRows] = useState<PermissionRow[]>([])
  const [permissionRowsLoading, setPermissionRowsLoading] = useState(false)
  const [updatingPermissionKey, setUpdatingPermissionKey] = useState<string | null>(null)
  const [planModules, setPlanModules] = useState<PlanModule[]>([])
  const [planModulesLoading, setPlanModulesLoading] = useState(false)
  const [showAddPermissionForm, setShowAddPermissionForm] = useState(false)
  const [selectedModuleId, setSelectedModuleId] = useState<number | ''>('')
  const [permissionCreate, setPermissionCreate] = useState(true)
  const [permissionRead, setPermissionRead] = useState(true)
  const [permissionUpdate, setPermissionUpdate] = useState(false)
  const [permissionDelete, setPermissionDelete] = useState(false)
  const [addPermissionLoading, setAddPermissionLoading] = useState(false)

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
    if (!token || !selectedSchoolId) return

    const controller = new AbortController()
    const fetchPlanModules = async () => {
      setPlanModulesLoading(true)
      setPlanModules([])
      try {
        const params = new URLSearchParams({
          lang: locale,
          school_id: String(selectedSchoolId),
        })
        const response = await fetch(`${API_BASE_URL}/catalog/plan-modules?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const json = (await response.json()) as Array<
          PlanModule & {
            module_id?: number
            module_name?: string
            module_key?: string
            module_description?: string | null
          }
        >

        const normalizedModules = json
          .map((module) => ({
            moduleId: module.moduleId ?? module.module_id,
            moduleName: module.moduleName ?? module.module_name ?? '',
            moduleKey: module.moduleKey ?? module.module_key ?? '',
            moduleDescription: module.moduleDescription ?? module.module_description ?? null,
          }))
          .filter((module): module is PlanModule => module.moduleId !== undefined)

        setPlanModules(normalizedModules)
      } catch (error) {
        if ((error as DOMException).name !== 'AbortError') {
          setPlanModules([])
        }
      } finally {
        setPlanModulesLoading(false)
      }
    }

    fetchPlanModules()
    return () => controller.abort()
  }, [locale, selectedSchoolId, token])

  const fetchPermissions = useCallback(
    async (options?: { signal?: AbortSignal }) => {
      if (!token || !selectedRoleId) return

      setPermissionRowsLoading(true)
      try {
        const response = await fetch(
          `${API_BASE_URL}/permissions/module-access?roleId=${selectedRoleId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: options?.signal,
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
    },
    [selectedRoleId, token],
  )

  useEffect(() => {
    if (!token || !selectedRoleId) return

    const controller = new AbortController()
    fetchPermissions({ signal: controller.signal })
    return () => controller.abort()
  }, [fetchPermissions, selectedRoleId, token])

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

  const availableModules = useMemo(
    () =>
      planModules.filter(
        (planModule) => !permissionRows.some((permission) => permission.module_id === planModule.moduleId),
      ),
    [permissionRows, planModules],
  )

  const resetAddPermissionForm = useCallback(() => {
    setSelectedModuleId('')
    setPermissionCreate(true)
    setPermissionRead(true)
    setPermissionUpdate(false)
    setPermissionDelete(false)
  }, [])

  useEffect(() => {
    resetAddPermissionForm()
    setShowAddPermissionForm(false)
  }, [resetAddPermissionForm, selectedRoleId])

  const handlePermissionToggle = async (permission: PermissionRow, key: PermissionKey) => {
    if (!token) return

    const nextValue = !permission[key]
    const confirmation = await Swal.fire({
      icon: 'question',
      title: t('updatePermissionTitle') || 'Actualizar permiso',
      text: t('updatePermissionConfirmation') || '¿Deseas actualizar el estado de este permiso?',
      showCancelButton: true,
      confirmButtonText: t('accept') || 'Aceptar',
      cancelButtonText: t('cancel') || 'Cancelar',
    })

    if (!confirmation.isConfirmed) return

    const permissionKey = `${permission.permission_id}-${key}`
    setUpdatingPermissionKey(permissionKey)

    try {
      const payload = {
        c: permission.c ? 1 : 0,
        r: permission.r ? 1 : 0,
        u: permission.u ? 1 : 0,
        d: permission.d ? 1 : 0,
        [key]: nextValue ? 1 : 0,
      }

      const response = await fetch(`${API_BASE_URL}/permissions/update?permissionId=${permission.permission_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('failed_request')
      }

      const json = (await response.json()) as PermissionUpdateResponse

      setPermissionRows((current) =>
        current.map((row) => (row.permission_id === permission.permission_id ? { ...row, [key]: nextValue } : row)),
      )

      await Swal.fire({
        icon: json.type ?? 'success',
        title: json.title ?? t('successTitle') ?? 'Permiso actualizado',
        text: json.message ?? t('successMessage') ?? 'El permiso se actualizó correctamente.',
      })
    } catch {
      Swal.fire({
        icon: 'error',
        title: t('defaultError') || 'Error',
        text: t('defaultError') || 'Ocurrió un error al actualizar el permiso.',
      })
    } finally {
      setUpdatingPermissionKey(null)
    }
  }

  const handleAddPermissionSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!token || !selectedRoleId || !selectedModuleId) return

    setAddPermissionLoading(true)
    try {
      const params = new URLSearchParams({ lang: locale })
      const payload = {
        role_id: selectedRoleId,
        module_id: selectedModuleId,
        c: permissionCreate ? 1 : 0,
        r: permissionRead ? 1 : 0,
        u: permissionUpdate ? 1 : 0,
        d: permissionDelete ? 1 : 0,
      }

      const response = await fetch(`${API_BASE_URL}/permissions/create?${params.toString()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('failed_request')
      }

      const json = (await response.json()) as PermissionUpdateResponse

      await Swal.fire({
        icon: json.type ?? 'success',
        title: json.title ?? t('successTitle') ?? 'Permiso creado',
        text: json.message ?? t('successMessage') ?? 'El permiso se creó correctamente.',
      })

      resetAddPermissionForm()
      setShowAddPermissionForm(false)
      await fetchPermissions()
    } catch {
      Swal.fire({
        icon: 'error',
        title: t('defaultError') || 'Error',
        text: t('defaultError') || 'Ocurrió un error al agregar el permiso.',
      })
    } finally {
      setAddPermissionLoading(false)
    }
  }

  const pageContent = (
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
                      {(['c', 'r', 'u', 'd'] as PermissionKey[]).map((key) => {
                        const switchId = `permission-${permission.permission_id}-${key}`
                        const isUpdating = updatingPermissionKey === `${permission.permission_id}-${key}`
                        return (
                          <td key={key} className="text-center">
                            <div className="form-check form-switch d-inline-flex align-items-center justify-content-center">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                role="switch"
                                id={switchId}
                                checked={permission[key]}
                                onChange={() => handlePermissionToggle(permission, key)}
                                disabled={permissionRowsLoading || isUpdating}
                              />
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {selectedRoleId ? (
            <div className="mt-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                  <h4 className="h6 mb-1">{t('addPermissionFormTitle')}</h4>
                  <p className="text-muted small mb-0">{t('addPermissionFormDescription')}</p>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowAddPermissionForm((current) => !current)}
                  disabled={planModulesLoading || addPermissionLoading}
                >
                  {t('addPermissionButton')}
                </button>
              </div>

              {showAddPermissionForm ? (
                <form className="border rounded-3 p-3 bg-light" onSubmit={handleAddPermissionSubmit}>
                  <div className="row g-3 align-items-center">
                    <div className="col-lg-4">
                      <label className="form-label fw-semibold" htmlFor="moduleSelect">
                        {t('selectModuleLabel')}
                      </label>
                      <select
                        id="moduleSelect"
                        className="form-select"
                        value={selectedModuleId}
                        onChange={(event) =>
                          setSelectedModuleId(event.target.value ? Number(event.target.value) : '')
                        }
                        disabled={planModulesLoading || addPermissionLoading || availableModules.length === 0}
                      >
                        <option value="">{planModulesLoading ? t('tableLoading') : t('selectPlaceholder')}</option>
                        {availableModules.map((module) => (
                          <option key={module.moduleId} value={module.moduleId}>
                            {module.moduleName}
                          </option>
                        ))}
                      </select>
                      {availableModules.length === 0 && !planModulesLoading ? (
                        <p className="text-muted text-warning small mt-2 mb-0">{t('noAvailableModules')}</p>
                      ) : null}
                    </div>

                    <div className="col-lg-8">
                      <label className="form-label fw-semibold d-block">{t('permissionsTableTitle')}</label>
                      <div className="d-flex flex-wrap gap-3">
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id="add-permission-create"
                            checked={permissionCreate}
                            onChange={(event) => setPermissionCreate(event.target.checked)}
                            disabled={addPermissionLoading}
                          />
                          <label className="form-check-label" htmlFor="add-permission-create">
                            {t('permissionCreate')}
                          </label>
                        </div>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id="add-permission-read"
                            checked={permissionRead}
                            onChange={(event) => setPermissionRead(event.target.checked)}
                            disabled={addPermissionLoading}
                          />
                          <label className="form-check-label" htmlFor="add-permission-read">
                            {t('permissionRead')}
                          </label>
                        </div>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id="add-permission-update"
                            checked={permissionUpdate}
                            onChange={(event) => setPermissionUpdate(event.target.checked)}
                            disabled={addPermissionLoading}
                          />
                          <label className="form-check-label" htmlFor="add-permission-update">
                            {t('permissionUpdate')}
                          </label>
                        </div>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            id="add-permission-delete"
                            checked={permissionDelete}
                            onChange={(event) => setPermissionDelete(event.target.checked)}
                            disabled={addPermissionLoading}
                          />
                          <label className="form-check-label" htmlFor="add-permission-delete">
                            {t('permissionDelete')}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex gap-2 mt-3">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        setShowAddPermissionForm(false)
                        resetAddPermissionForm()
                      }}
                      disabled={addPermissionLoading}
                    >
                      {t('cancel')}
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={addPermissionLoading || !selectedModuleId || availableModules.length === 0}
                    >
                      {addPermissionLoading ? t('tableLoading') : t('save')}
                    </button>
                  </div>
                </form>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )

  if (!hydrated || permissionsLoading || !permissionsLoaded) {
    const loader = <LoadingSkeleton variant="dashboard" cardCount={8} />
    return embedded ? (
      loader
    ) : (
      <Layout onNavigate={onNavigate} pageTitle={t('rolesPermissionsTitle')} breadcrumbItems={breadcrumbItems}>
        {loader}
      </Layout>
    )
  }

  if (permissionsError || !permissions?.r) {
    const noPermission = <NoPermission />
    return embedded ? (
      noPermission
    ) : (
      <Layout onNavigate={onNavigate} pageTitle={t('rolesPermissionsTitle')} breadcrumbItems={breadcrumbItems}>
        {noPermission}
      </Layout>
    )
  }

  if (embedded) {
    return pageContent
  }

  return (
    <Layout
      onNavigate={onNavigate}
      pageTitle={t('rolesPermissionsTitle')}
      breadcrumbItems={breadcrumbItems}
    >
      {pageContent}
    </Layout>
  )
}
