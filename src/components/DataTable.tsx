import { useMemo, type ReactNode } from 'react'
import { useLanguage } from '../context/LanguageContext'
import './DataTable.css'

export interface DataTableColumn<T> {
  key: string
  label: string
  render?: (row: T) => ReactNode
}

export interface DataTablePagination {
  page: number
  size: number
  totalPages: number
  totalElements: number
  onPageChange?: (nextPage: number) => void
  onPageSizeChange?: (nextSize: number) => void
}

interface DataTableProps<T> {
  columns: Array<DataTableColumn<T>>
  data: T[]
  isLoading?: boolean
  pagination?: DataTablePagination
  emptyMessage?: string
}

export function DataTable<T>({ columns, data, isLoading = false, pagination, emptyMessage }: DataTableProps<T>) {
  const { t } = useLanguage()

  const pageIndex = pagination?.page ?? 0
  const totalPages = pagination?.totalPages ?? 0
  const totalElements = pagination?.totalElements ?? data.length
  const pageSize = pagination?.size ?? data.length

  const rows = useMemo(() => data, [data])

  return (
    <div className="datatable card shadow-sm border-0">
      <div className="d-flex justify-content-between align-items-center p-3">
        <div className="small text-muted">
          <strong>{t('tableResults')}</strong>: {totalElements} • <strong>{t('tablePageLabel')}</strong> {pageIndex + 1} {t('tablePageOf')}{' '}
          {totalPages} • <strong>{t('tablePageSize')}</strong>: {pageSize}
        </div>
        {pagination?.onPageSizeChange ? (
          <div className="d-flex align-items-center gap-2">
            <label htmlFor="datatable-page-size" className="form-label m-0 small">
              {t('tableRowsPerPage')}
            </label>
            <select
              id="datatable-page-size"
              className="form-select form-select-sm"
              value={pageSize}
              onChange={(event) => pagination.onPageSizeChange?.(Number(event.target.value))}
            >
              {[5, 10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      <div className="table-responsive">
        <table className="table align-middle mb-0">
          <thead className="table-light">
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-4 text-muted">
                  {t('tableLoading')}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-4 text-muted">
                  {emptyMessage ?? t('tableNoData')}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={index}>
                  {columns.map((column) => (
                    <td key={column.key}>{column.render ? column.render(row) : ((row as Record<string, unknown>)[column.key] as ReactNode)}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination ? (
        <div className="d-flex justify-content-between align-items-center p-3 border-top">
          <div className="small text-muted">
            {t('tablePageLabel')} {pageIndex + 1} {t('tablePageOf')} {totalPages}
          </div>
          <div className="btn-group" role="group" aria-label="Pagination controls">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              disabled={pageIndex <= 0}
              onClick={() => pagination.onPageChange?.(pageIndex - 1)}
            >
              {t('tablePrev')}
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              disabled={pageIndex >= totalPages - 1 || totalPages === 0}
              onClick={() => pagination.onPageChange?.(pageIndex + 1)}
            >
              {t('tableNext')}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
