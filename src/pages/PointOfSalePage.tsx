import { useEffect, useMemo, useRef, useState } from 'react'
import { Layout } from '../layout/Layout'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { API_BASE_URL } from '../config'
import UsersBalanceSearchDropdown, { type UsersBalanceSearchItem } from '../components/UsersBalanceSearchDropdown'
import SearchInput from '../components/ui/SearchInput'
import type { BreadcrumbItem } from '../components/Breadcrumb'
import './PointOfSalePage.css'
import { useModulePermissions } from '../hooks/useModulePermissions'
import { LoadingSkeleton } from '../components/LoadingSkeleton'
import { NoPermission } from '../components/NoPermission'

interface PointOfSalePageProps {
  onNavigate: (path: string) => void
}

interface MenuItem {
  menu_id: number
  school_id: number
  code: string
  name: string
  description: string
  price: number
  enabled: boolean
  menu_status: string
  image: string | null
}

interface MenuResponse {
  content: MenuItem[]
  totalElements: number
  page: number
  size: number
  totalPages: number
}

interface CartItem {
  menuId: number
  name: string
  price: number
  quantity: number
  image: string | null
}

const CART_STORAGE_KEY = 'pos-cart'

const formatCurrency = (value: number) => `$${value.toFixed(2)}`

const getInitials = (name?: string | null) => {
  if (!name) return 'U'
  const parts = name.trim().split(' ').filter(Boolean)
  if (!parts.length) return 'U'
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')
}

export function PointOfSalePage({ onNavigate }: PointOfSalePageProps) {
  const { token } = useAuth()
  const { locale, t } = useLanguage()
  const { permissions, loading: permissionsLoading, error: permissionsError, loaded: permissionsLoaded } = useModulePermissions('point-of-sale')
  const canCreate = permissions?.c ?? false
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<UsersBalanceSearchItem | null>(null)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [processing, setProcessing] = useState(false)
  const [processMessage, setProcessMessage] = useState<string | null>(null)
  const [menuImageUrls, setMenuImageUrls] = useState<Record<string, string>>({})
  const menuImageUrlsRef = useRef<Record<string, string>>({})

  useEffect(() => {
    menuImageUrlsRef.current = menuImageUrls
  }, [menuImageUrls])

  useEffect(() => {
    if (!token) return

    const controller = new AbortController()
    const loadImages = async () => {
      const imagesToLoad = new Set<string>()
      menuItems.forEach((item) => {
        if (item.image && !menuImageUrlsRef.current[item.image]) {
          imagesToLoad.add(item.image)
        }
      })
      cartItems.forEach((item) => {
        if (item.image && !menuImageUrlsRef.current[item.image]) {
          imagesToLoad.add(item.image)
        }
      })

      await Promise.all(
        Array.from(imagesToLoad).map(async (image) => {
          try {
            const response = await fetch(`${API_BASE_URL}/coffee-menu-image/${encodeURIComponent(image)}`, {
              headers: { Authorization: `Bearer ${token}` },
              signal: controller.signal,
            })

            if (!response.ok) return

            const blob = await response.blob()
            const objectUrl = URL.createObjectURL(blob)
            if (controller.signal.aborted) {
              URL.revokeObjectURL(objectUrl)
              return
            }
            setMenuImageUrls((prev) => ({ ...prev, [image]: objectUrl }))
          } catch (imageError) {
            if ((imageError as DOMException).name === 'AbortError') return
          }
        }),
      )
    }

    loadImages()
    return () => controller.abort()
  }, [cartItems, menuItems, token])

  useEffect(() => {
    return () => {
      Object.values(menuImageUrlsRef.current).forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem(CART_STORAGE_KEY)
    if (!stored) return
    try {
      const parsed = JSON.parse(stored) as CartItem[]
      if (Array.isArray(parsed)) {
        setCartItems(parsed)
      }
    } catch (storageError) {
      console.warn('Failed to parse cached cart', storageError)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems))
  }, [cartItems])

  useEffect(() => {
    if (!token) return

    const controller = new AbortController()
    const fetchMenu = async () => {
      try {
        setLoading(true)
        setError(null)
        const params = new URLSearchParams({
          page: '0',
          size: '30',
        })
        if (search.trim()) {
          params.set('search_criteria', search.trim())
        }
        const response = await fetch(`${API_BASE_URL}/coffee/menu?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('No se pudo cargar el catálogo de productos')
        }

        const data: MenuResponse = await response.json()
        setMenuItems(Array.isArray(data.content) ? data.content : [])
      } catch (fetchError) {
        if ((fetchError as DOMException).name === 'AbortError') return
        setError(fetchError instanceof Error ? fetchError.message : 'Error desconocido')
        setMenuItems([])
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchMenu()
    return () => controller.abort()
  }, [search, token])

  const breadcrumbItems: BreadcrumbItem[] = useMemo(
    () => [
      { label: 'Dashboard', onClick: () => onNavigate(`/${locale}`) },
      { label: 'Punto de venta' },
    ],
    [locale, onNavigate],
  )

  const totalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems],
  )

  const totalAmount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity * item.price, 0),
    [cartItems],
  )

  const userDetails = useMemo(() => {
    if (!selectedUser) return null
    const isStudent = selectedUser.role_name?.toLowerCase().includes('estudiante')
    const detailParts = isStudent
      ? [selectedUser.generation, selectedUser.grade_group, selectedUser.scholar_level_name].filter(Boolean)
      : [selectedUser.role_name].filter(Boolean)

    return {
      initials: getInitials(selectedUser.full_name),
      name: selectedUser.full_name,
      details: detailParts.join(' • '),
      balance: selectedUser.balance ?? 0,
    }
  }, [selectedUser])

  const addToCart = (item: MenuItem) => {
    setCartItems((prev) => {
      const existing = prev.find((cartItem) => cartItem.menuId === item.menu_id)
      if (existing) {
        return prev.map((cartItem) =>
          cartItem.menuId === item.menu_id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem,
        )
      }
      return [
        ...prev,
        {
          menuId: item.menu_id,
          name: item.name,
          price: item.price,
          quantity: 1,
          image: item.image,
        },
      ]
    })
  }

  const updateQuantity = (menuId: number, nextQuantity: number) => {
    setCartItems((prev) => {
      if (nextQuantity <= 0) {
        return prev.filter((item) => item.menuId !== menuId)
      }
      return prev.map((item) => (item.menuId === menuId ? { ...item, quantity: nextQuantity } : item))
    })
  }

  const handleCheckout = async () => {
    if (!selectedUser || cartItems.length === 0 || !token) return

    try {
      setProcessing(true)
      setProcessMessage(null)
      const payload = {
        userId: selectedUser.user_id,
        items: cartItems.map((item) => ({ menuId: item.menuId, quantity: item.quantity })),
      }

      const response = await fetch(`${API_BASE_URL}/coffee/process`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      let responseBody: { message?: string; success?: boolean } | null = null
      try {
        responseBody = (await response.json()) as { message?: string; success?: boolean }
      } catch (parseError) {
        responseBody = null
      }

      if (!response.ok || responseBody?.success === false) {
        throw new Error(responseBody?.message || 'No se pudo procesar la venta')
      }

      setCartItems([])
      setProcessMessage(responseBody?.message || 'Venta procesada correctamente.')
    } catch (processError) {
      setProcessMessage(processError instanceof Error ? processError.message : 'Error desconocido')
    } finally {
      setProcessing(false)
    }
  }
  
  if (permissionsLoading || !permissionsLoaded) {
    return (
      <Layout onNavigate={onNavigate} pageTitle="Punto de venta" breadcrumbItems={breadcrumbItems}>
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
    
  if (
    (permissionsLoaded && permissions && !permissions.r)
  ) {
    return (
      <Layout onNavigate={onNavigate} pageTitle="Punto de venta" breadcrumbItems={breadcrumbItems}>
        <NoPermission />
      </Layout>
    )
  }

  return (
    <Layout onNavigate={onNavigate} pageTitle="Punto de venta" breadcrumbItems={breadcrumbItems}>
      <div className="point-of-sale d-flex flex-column gap-4">
        <div className="row g-4">
          <div className="col-12 col-xl-8">
            <div className="card border-0 shadow-sm">
              <div className="card-body d-flex flex-column gap-4">
                <div className='d-flex justify-content-between'>
                  <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder="Buscar productos (Código o Nombre)..."
                    debounceMs={300}
                    className="pos-search-input w-100"
                    clearButtonAriaLabel="Limpiar búsqueda"
                  />
                  {canCreate ? (
                    <button
                      className="btn d-flex align-items-center gap-2 btn-print text-muted fw-medium text-nowrap"
                      type="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
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

                {loading ? <div className="text-muted">Cargando productos...</div> : null}
                {error ? <div className="alert alert-danger mb-0">{error}</div> : null}

                {!loading && !error && menuItems.length === 0 ? (
                  <div className="text-muted">No hay productos disponibles.</div>
                ) : null}

                <div className="pos-products-grid">
                  {menuItems.map((item) => {
                    const imageUrl = item.image ? menuImageUrls[item.image] : null
                    return (
                      <button
                        key={item.menu_id}
                        type="button"
                        className="pos-product-card"
                        onClick={() => addToCart(item)}
                      >
                        <div className="pos-product-image">
                          {imageUrl ? (
                            <img src={imageUrl} alt={item.name} />
                          ) : (
                            <div className="pos-product-placeholder">☕</div>
                          )}
                        </div>
                        <div className="pos-product-info">
                          <h6 className="mb-1">{item.name}</h6>
                          <p className="text-muted small mb-2">{item.description || 'Producto de cafetería'}</p>
                          <span className="fw-semibold">{formatCurrency(item.price)}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-xl-4">
            <div className="card border-0 shadow-sm">
              <div className="card-body d-flex flex-column gap-4">
                <div className="pos-user-search">
                  <UsersBalanceSearchDropdown
                    onSelect={(user) => setSelectedUser(user as UsersBalanceSearchItem)}
                    onClear={() => setSelectedUser(null)}
                    label="Buscar alumno"
                    placeholder="Buscar alumno..."
                    value={selectedUser ? [selectedUser] : []}
                  />
                </div>

                <div className="pos-user-card">
                  {userDetails ? (
                    <>
                      <div className="pos-user-header">
                        <div className="pos-user-avatar">{userDetails.initials}</div>
                        <div>
                          <h6 className="mb-1">{userDetails.name}</h6>
                          {userDetails.details ? <p className="text-muted small mb-0">{userDetails.details}</p> : null}
                        </div>
                      </div>
                      <div className="pos-user-balance">
                        <span className="text-muted">Saldo actual</span>
                        <span className="badge bg-success-subtle text-success-emphasis">
                          {formatCurrency(userDetails.balance)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-muted">Selecciona un usuario para ver su información.</div>
                  )}
                </div>

                <div className="pos-cart-header">
                  <div>
                    <p className="text-uppercase text-muted fw-semibold small mb-0">Orden actual</p>
                    <span className="text-muted small">{totalItems} items</span>
                  </div>
                  {cartItems.length ? (
                    <button type="button" className="btn btn-link btn-sm" onClick={() => setCartItems([])}>
                      Vaciar
                    </button>
                  ) : null}
                </div>

                <div className="pos-cart-list">
                  {cartItems.length === 0 ? (
                    <div className="text-muted">Agrega productos al carrito.</div>
                  ) : (
                    cartItems.map((item) => (
                      <div key={item.menuId} className="pos-cart-item">
                        <div className="pos-cart-item-icon">
                          {item.image && menuImageUrls[item.image] ? (
                            <img src={menuImageUrls[item.image]} alt={item.name} />
                          ) : (
                            <span>☕</span>
                          )}
                        </div>
                        <div className="pos-cart-item-info">
                          <p className="mb-1 fw-semibold">{item.name}</p>
                          <span className="text-muted small">{formatCurrency(item.price)}</span>
                        </div>
                        <div className="pos-cart-item-controls">
                          <button
                            type="button"
                            className="btn btn-light btn-sm"
                            onClick={() => updateQuantity(item.menuId, item.quantity - 1)}
                          >
                            -
                          </button>
                          <span className="fw-semibold">{item.quantity}</span>
                          <button
                            type="button"
                            className="btn btn-light btn-sm"
                            onClick={() => updateQuantity(item.menuId, item.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                        <span className="fw-semibold">{formatCurrency(item.quantity * item.price)}</span>
                      </div>
                    ))
                  )}
                </div>

                <div className="pos-total-card">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-semibold">Total a pagar</span>
                    <span className="pos-total-amount">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>

                {processMessage ? (
                  <div className="alert alert-info mb-0" role="alert">
                    {processMessage}
                  </div>
                ) : null}

                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary w-50"
                    onClick={() => setCartItems([])}
                    disabled={cartItems.length === 0}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary w-50"
                    onClick={handleCheckout}
                    disabled={!selectedUser || cartItems.length === 0 || processing}
                  >
                    {processing ? 'Procesando...' : `Cobrar ${formatCurrency(totalAmount)}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
