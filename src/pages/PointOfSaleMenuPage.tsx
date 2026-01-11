import { useEffect, useMemo, useState } from 'react'
import { Layout } from '../layout/Layout'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { API_BASE_URL } from '../config'
import type { BreadcrumbItem } from '../components/Breadcrumb'
import { DataTable, type DataTableColumn } from '../components/DataTable'
import SearchInput from '../components/ui/SearchInput'
import { LoadingSkeleton } from '../components/LoadingSkeleton'
import { NoPermission } from '../components/NoPermission'
import { useModulePermissions } from '../hooks/useModulePermissions'
import { ProductCreateModal } from '../components/point-of-sale/ProductCreateModal'
import { ProductUpdateModal } from '../components/point-of-sale/ProductUpdateModal'
import type { MenuItem } from '../components/point-of-sale/types'
import './PointOfSaleMenuPage.css'

interface PointOfSaleMenuPageProps {
  onNavigate: (path: string) => void
}

interface MenuResponse {
  content: MenuItem[]
  totalElements: number
  page: number
  size: number
  totalPages: number
}

export function PointOfSaleMenuPage({ onNavigate }: PointOfSaleMenuPageProps) {
  const { token } = useAuth()
  const { locale, t } = useLanguage()
  const { permissions, loading: permissionsLoading, error: permissionsError, loaded: permissionsLoaded } = useModulePermissions('point-of-sale')
  const canCreate = permissions?.c ?? false
  const canUpdate = permissions?.u ?? false

  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [menuPage, setMenuPage] = useState(0)
  const [menuPageSize] = useState(10)
  const [menuTotalPages, setMenuTotalPages] = useState(0)
  const [menuTotalElements, setMenuTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!token) return

    const controller = new AbortController()
    const fetchMenu = async () => {
      try {
        setLoading(true)
        setError(null)
        const params = new URLSearchParams({
          page: String(menuPage),
          size: String(menuPageSize),
        })

        if (appliedSearch.trim()) {
          params.set('search_criteria', appliedSearch.trim())
        }

        const response = await fetch(`${API_BASE_URL}/coffee/menu?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(t('posCatalogLoadError'))
        }

        const data: MenuResponse = await response.json()
        setMenuItems(Array.isArray(data.content) ? data.content : [])
        setMenuTotalPages(data.totalPages ?? 0)
        setMenuTotalElements(data.totalElements ?? 0)
      } catch (fetchError) {
        if ((fetchError as DOMException).name === 'AbortError') return
        setError(fetchError instanceof Error ? fetchError.message : t('posUnknownError'))
        setMenuItems([])
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchMenu()
    return () => controller.abort()
  }, [appliedSearch, menuPage, menuPageSize, refreshKey, t, token])

  const breadcrumbItems: BreadcrumbItem[] = useMemo(
    () => [
      { label: t('portalTitle'), onClick: () => onNavigate(`/${locale}`) },
      { label: t('posTitle'), onClick: () => onNavigate(`/${locale}/point-of-sale`) },
      { label: t('posFullMenuTitle') },
    ],
    [locale, onNavigate, t],
  )

  const menuColumns: Array<DataTableColumn<MenuItem>> = useMemo(
    () => [
      { key: 'code', label: t('posCodeLabel') },
      { key: 'name', label: t('posNameEsLabel') },
      { key: 'description', label: t('posDescriptionEsLabel') },
      { key: 'price', label: t('posPriceLabel'), currency: 'MXN' },
      {
        key: 'enabled',
        label: t('posEnabledLabel'),
        render: (row) => (row.enabled ? t('active') : t('inactive')),
      },
      {
        key: 'actions',
        label: t('tableActions'),
        render: (row) =>
          canUpdate ? (
            <button
              type="button"
              className="btn btn-link p-0 pos-menu-action"
              aria-label={`${t('posUpdateProductTitle')} ${row.name}`}
              onClick={() => {
                setSelectedItem(row)
                setIsUpdateModalOpen(true)
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 20h4l10.5-10.5a2.828 2.828 0 1 0-4-4L4 16v4z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : null,
      },
    ],
    [canUpdate, t],
  )

  const handleSearchSubmit = () => {
    setAppliedSearch(searchTerm)
    setMenuPage(0)
  }

  const handleSearchClear = () => {
    setSearchTerm('')
    setAppliedSearch('')
    setMenuPage(0)
  }

  const handleMenuRefresh = () => {
    setMenuPage(0)
    setRefreshKey((prev) => prev + 1)
  }

  if (permissionsLoading || !permissionsLoaded) {
    return (
      <Layout onNavigate={onNavigate} pageTitle={t('posFullMenuTitle')} breadcrumbItems={breadcrumbItems}>
        <LoadingSkeleton variant="dashboard" rowCount={10} />
      </Layout>
    )
  }

  if (permissionsError) {
    return (
      <>
        <div className="alert alert-danger" role="alert">
          {t('defaultError')}
        </div>
      </>
    )
  }

  if (permissionsLoaded && permissions && !permissions.r) {
    return (
      <Layout onNavigate={onNavigate} pageTitle={t('posFullMenuTitle')} breadcrumbItems={breadcrumbItems}>
        <NoPermission />
      </Layout>
    )
  }

  return (
    <Layout onNavigate={onNavigate} pageTitle={t('posFullMenuTitle')} breadcrumbItems={breadcrumbItems}>
      <div className="pos-menu-page d-flex flex-column gap-3">
        <div className="card border-0 shadow-sm">
          <div className="card-body d-flex flex-column gap-3 flex-md-row align-items-md-center justify-content-between">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              onSubmit={handleSearchSubmit}
              onClear={handleSearchClear}
              placeholder={t('posSearchProductsPlaceholder')}
              className="flex-grow-1"
              inputClassName="w-100"
            />
            {canCreate ? (
              <button
                className="btn d-flex align-items-center gap-2 btn-print text-muted fw-medium text-nowrap"
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <span aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 5v14M5 12h14"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="fw-semibold">{t('createProduct')}</span>
              </button>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        ) : null}

        <DataTable
          columns={menuColumns}
          data={menuItems}
          isLoading={loading}
          emptyMessage={t('posNoProducts')}
          pagination={{
            page: menuPage,
            size: menuPageSize,
            totalPages: menuTotalPages,
            totalElements: menuTotalElements,
            onPageChange: (nextPage) => setMenuPage(Math.max(0, Math.min(menuTotalPages - 1, nextPage))),
          }}
          getRowClassName={(row) => (row.enabled ? undefined : 'pos-menu-row--disabled')}
        />
      </div>

      <ProductCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleMenuRefresh}
      />
      <ProductUpdateModal
        isOpen={isUpdateModalOpen}
        item={selectedItem}
        onClose={() => {
          setIsUpdateModalOpen(false)
          setSelectedItem(null)
        }}
        onUpdated={handleMenuRefresh}
      />
    </Layout>
  )
}
