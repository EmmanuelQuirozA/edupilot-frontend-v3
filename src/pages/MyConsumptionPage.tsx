import { useEffect, useMemo, useState } from 'react'
import { Layout } from '../layout/Layout'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { API_BASE_URL } from '../config'
import { DataTable, type DataTableColumn } from '../components/DataTable'
import SearchInput from '../components/ui/SearchInput'
import { formatDate } from '../utils/formatDate'

interface MyConsumptionPageProps {
  onNavigate: (path: string) => void
}

interface CoffeeConsumption {
  coffee_sale_id: number
  sale: number
  user_id: number
  student_id: number | null
  full_name: string
  item_name: string
  created_at: string
  quantity: number
  unit_price: number
  total: number
}

interface ConsumptionResponse {
  content: CoffeeConsumption[]
  totalElements: number
  page: number
  size: number
  totalPages: number
}

const DEFAULT_PAGE_SIZE = 10

export function MyConsumptionPage({ onNavigate }: MyConsumptionPageProps) {
  const { token } = useAuth()
  const { locale, t } = useLanguage()

  const [rows, setRows] = useState<CoffeeConsumption[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')

  useEffect(() => {
    if (!token) return

    const controller = new AbortController()

    const fetchConsumption = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const params = new URLSearchParams({
          lang: locale,
          offset: String(page * DEFAULT_PAGE_SIZE),
          limit: String(DEFAULT_PAGE_SIZE),
          export_all: 'false',
        })

        if (appliedSearch.trim()) {
          params.set('item_name', appliedSearch.trim())
        }

        const response = await fetch(`${API_BASE_URL}/coffee/my-consumption?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const data = (await response.json()) as ConsumptionResponse
        setRows(data.content ?? [])
        setTotalElements(data.totalElements ?? 0)
        setTotalPages(data.totalPages ?? 0)
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          setError(t('defaultError'))
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    fetchConsumption()

    return () => controller.abort()
  }, [appliedSearch, locale, page, t, token])

  const handleSearchSubmit = () => {
    setAppliedSearch(searchTerm)
    setPage(0)
  }

  const handleSearchClear = () => {
    setSearchTerm('')
    setAppliedSearch('')
    setPage(0)
  }

  const columns: Array<DataTableColumn<CoffeeConsumption>> = useMemo(
    () => [
      {
        key: 'coffee_sale_id',
        label: 'ID',
      },
      {
        key: 'item_name',
        label: 'Producto',
      },
      {
        key: 'quantity',
        label: 'Cantidad',
      },
      {
        key: 'unit_price',
        label: 'Precio unitario',
        currency: 'MXN',
      },
      {
        key: 'total',
        label: 'Total',
        currency: 'MXN',
      },
      {
        key: 'created_at',
        label: 'Fecha',
        render: (row) => formatDate(row.created_at, locale, {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    ],
    [locale],
  )

  return (
    <Layout onNavigate={onNavigate} pageTitle="Mi consumo">
      <div className="d-flex flex-column gap-3">
        {error ? (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        ) : null}

        <div className="card shadow-sm border-0">
          <div className="card-body d-flex flex-column gap-3 flex-md-row align-items-md-center justify-content-between">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              onSubmit={handleSearchSubmit}
              onClear={handleSearchClear}
              placeholder="Buscar producto"
              className="flex-grow-1"
              inputClassName="w-100"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={rows}
          isLoading={isLoading}
          emptyMessage={t('tableNoData')}
          pagination={{
            page,
            size: DEFAULT_PAGE_SIZE,
            totalPages,
            totalElements,
            onPageChange: (nextPage) => setPage(Math.max(0, Math.min(totalPages - 1, nextPage))),
          }}
        />
      </div>
    </Layout>
  )
}
