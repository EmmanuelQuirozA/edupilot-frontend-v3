import { useEffect, useMemo, useState } from 'react'
import { Layout } from '../layout/Layout'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { API_BASE_URL } from '../config'
import { DataTable, type DataTableColumn } from '../components/DataTable'
import type { BreadcrumbItem } from '../components/Breadcrumb'
import { LoadingSkeleton } from '../components/LoadingSkeleton'
import { formatDate } from '../utils/formatDate';

interface School {
  school_id: number
  related_school_id: number | null
  description: string
  commercial_name: string
  municipality: string | null
  state: string | null
  enabled: boolean
  school_status: string
  image: string | null
  plan_name: string
  renew_plan: Date | null
  is_parent_school: number
  ui_color: string | null
  count_students: number
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
        onClick: () => onNavigate(`/${locale}`),
      },
      { label: t('schoolsBreadcrumbLabel') },
    ],
    [locale, onNavigate, t],
  )

  const columns: Array<DataTableColumn<School>> = useMemo(
    () => [
      { 
        key: 'commercial_name', 
        label: t('schoolsNameColumn'),
        render: (row) => (
          <div className="d-flex flex-column">
            <span className='fw-bold text-black'>
              {row.commercial_name}
            </span>
            {row.municipality && row.state ? <small className='fw-normal'>
              ID: {row.school_id} • {row.municipality +', '+ row.state}
            </small> : null}
          </div>
        )
      },
      {
        key: 'plan_name',
        label: t('schoolsPlanColumn'),
        render: (row) => (
          <div className='d-flex flex-column'>
            <div>
              <small className='cell-chip px-4'
                style={{
                  borderStyle: 'solid',
                  borderWidth: '1px',
                  backgroundColor: (row.ui_color ? 'rgba('+row.ui_color+', 0.16)' : 'rgba(42, 33, 168, 0.16)'), 
                  color: (row.ui_color ? 'rgb('+row.ui_color+')' : 'rgb(42, 33, 168)'),
                  borderColor: (row.ui_color ? 'rgba('+row.ui_color+', 0.6)' : 'rgba(42, 33, 168, 0.6)')
                }}
              >
                {row.plan_name}
              </small>
            </div>
            {
              row.renew_plan ?
              (
                <small className='fw-light'>
                  {t('renew') + ' ' + formatDate(row.renew_plan, locale, {year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'})}
                </small>
              )
              :null
            }
          </div>
        ),
      },
      {
        key: 'count_students',
        label: t('students'),
        render: (row) => (
          <div className='d-flex align-items-center'>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="users" className="text-muted p-1 lucide lucide-users h-3 w-3 mr-1 text-gray-400"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><path d="M16 3.128a4 4 0 0 1 0 7.744"></path><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><circle cx="9" cy="7" r="4"></circle></svg>
            <span>
              {row.count_students}
            </span>
          </div>
        ),
      },
      {
        key: 'is_parent_school',
        label: t('schoolsTypeColumn'),
        render: (row) => (row.is_parent_school ? t('schoolsParentType') : t('schoolsChildType')),
      },
      { 
        key: 'school_status', 
        label: t('schoolsStatusColumn'),
        render: (row) => (
          <small 
            className={'cell-chip px-4 ' + (row.enabled ? ' bg-success' : 'bg-danger')}
          > {row.school_status} </small>
        ),
      },
      {
        key: 'view_details',
        label: t('tableActions'),
        render: (row) => (
          <button
            type="button"
            className="btn btn-link btn-sm"
            onClick={() => onNavigate(`/${locale}/schools/${row.school_id}`)}
          >
            {t('viewDetails')}
          </button>
        ),
      },
    ],
    [locale, onNavigate, t],
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
