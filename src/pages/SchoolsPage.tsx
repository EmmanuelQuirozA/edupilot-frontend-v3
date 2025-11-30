import { useEffect, useMemo, useState } from 'react'
import { Layout } from '../layout/Layout'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { API_BASE_URL } from '../config'
import { DataTable, type DataTableColumn } from '../components/DataTable'
import type { BreadcrumbItem } from '../components/Breadcrumb'
import { LoadingSkeleton } from '../components/LoadingSkeleton'

interface School {
  school_id: number
  related_school_id: number | null
  description: string
  commercial_name: string
  enabled: boolean
  school_status: string
  image: string | null
  plan_name: string
  is_parent_school: number
}

interface SchoolsResponse {
  content: School[]
  totalElements: number
  page: number
  size: number
  totalPages: number
}

interface SchoolsPageProps {
  onNavigate: (path: string) => void
}

export function SchoolsPage({ onNavigate }: SchoolsPageProps) {
  const { token, hydrated } = useAuth()
  const { locale, t } = useLanguage()

  const [schools, setSchools] = useState<School[]>([])
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const breadcrumbItems: BreadcrumbItem[] = useMemo(
    () => [
      {
        label: t('portalTitle'),
        onClick: () => onNavigate(`/${locale}/dashboard`),
      },
      { label: t('schoolsBreadcrumbLabel') },
    ],
    [locale, onNavigate, t],
  )

  const columns: Array<DataTableColumn<School>> = useMemo(
    () => [
      { key: 'school_id', label: t('schoolsIdColumn') },
      { key: 'commercial_name', label: t('schoolsNameColumn') },
      { key: 'plan_name', label: t('schoolsPlanColumn') },
      { key: 'school_status', label: t('schoolsStatusColumn') },
      {
        key: 'is_parent_school',
        label: t('schoolsTypeColumn'),
        render: (row) => (row.is_parent_school ? t('schoolsParentType') : t('schoolsChildType')),
      },
      {
        key: 'view_details',
        label: t('tableActions'),
        render: () => (
          <button type="button" className="btn btn-link btn-sm">
            {t('tableViewDetails')}
          </button>
        ),
      },
    ],
    [t],
  )

  useEffect(() => {
    if (!token) return

    const controller = new AbortController()
    const fetchSchools = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          lang: locale,
          offset: String(page * pageSize),
          limit: String(pageSize),
        })

        const response = await fetch(`${API_BASE_URL}/schools/paged?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const data = (await response.json()) as SchoolsResponse
        setSchools(data.content ?? [])
        setTotalElements(data.totalElements ?? 0)
        setTotalPages(data.totalPages ?? 0)
        setPage(data.page ?? page)
        setPageSize(data.size ?? pageSize)
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          setError(t('defaultError'))
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchSchools()

    return () => controller.abort()
  }, [locale, page, pageSize, t, token])

  if (!hydrated) {
    return (
      <Layout onNavigate={onNavigate} pageTitle={t('schoolsTitle')} breadcrumbItems={breadcrumbItems}>
        <LoadingSkeleton variant="table" rowCount={10} />
      </Layout>
    )
  }

  return (
    <Layout onNavigate={onNavigate} pageTitle={t('schoolsTitle')} breadcrumbItems={breadcrumbItems}>
      <div className="d-flex flex-column gap-3">

        {error ? (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        ) : null}

        <div className="d-flex justify-content-end">
          <button className="ui-btn" type="button"><span className="ui-button__label">Agregar escuela</span></button>
        </div>

        <DataTable
          columns={columns}
          data={schools}
          isLoading={isLoading}
          pagination={{
            page,
            size: pageSize,
            totalPages,
            totalElements,
            onPageChange: (nextPage) => setPage(Math.max(0, nextPage)),
            onPageSizeChange: (nextSize) => {
              setPageSize(nextSize)
              setPage(0)
            },
          }}
        />
      </div>
    </Layout>
  )
}
