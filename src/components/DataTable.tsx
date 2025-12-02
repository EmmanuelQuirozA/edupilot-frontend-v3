import { useMemo, type ReactNode } from 'react'
import { useLanguage } from '../context/LanguageContext'
import './DataTable.css'

export interface DataTableColumn<T> {
  key: string
  label: string
  render?: (row: T) => ReactNode
  sortable?: boolean
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
  sortBy?: string
  sortDirection?: 'ASC' | 'DESC'
  onSort?: (columnKey: string) => void
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  pagination,
  emptyMessage,
  sortBy,
  sortDirection,
  onSort,
}: DataTableProps<T>) {
  const { t } = useLanguage()

  const pageIndex = pagination?.page ?? 0
  const totalPages = pagination?.totalPages ?? 0
  const totalElements = pagination?.totalElements ?? 0;

  const rows = useMemo(() => data, [data])

  return (
    <div className="datatable card shadow-sm border-0">
      {/* <div className="d-flex justify-content-between align-items-center p-3">
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
      </div> */}


      <div className="table-responsive">
        <table className="table align-middle mb-0">
          <thead>
            <tr>
              {columns.map((column) => {
                const isSortable = Boolean(onSort && column.sortable)
                const isActive = sortBy === column.key
                const sortIconClassName = [
                  'table__sort-icon',
                  'datatable__sort-icon',
                  isActive ? `table__sort-icon--${sortDirection === 'ASC' ? 'asc' : 'desc'}` : '',
                ]
                  .filter(Boolean)
                  .join(' ')

                return (
                  <th key={column.key} scope="col" className="table-column-name">
                    {isSortable ? (
                      <button
                        type="button"
                        className="datatable__sort btn btn-link p-0 d-inline-flex align-items-center gap-2"
                        onClick={() => onSort?.(column.key)}
                      >
                        <span className="fw-semibold text-uppercase small text-muted">{column.label}</span>
                        <svg
                          viewBox="0 0 12 12"
                          aria-hidden="true"
                          className={sortIconClassName}
                          focusable="false"
                        >
                          <path d="M6 2l3 4H3l3-4Z" />
                          <path d="M6 10l3-4H3l3 4Z" />
                        </svg>
                      </button>
                    ) : (
                      <span className="fw-semibold text-uppercase small text-muted">{column.label}</span>
                    )}
                  </th>
                )
              })}
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
                    <td className='text-muted' key={column.key}>{column.render ? column.render(row) : ((row as Record<string, unknown>)[column.key] as ReactNode)}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination ? (

        <div className="d-flex justify-content-between align-items-center px-3 pt-3 border-top">
          <div className="small text-muted">
            {totalElements} {t('results')} 
          </div>
          <div className="btn-group" role="group" aria-label="Pagination controls">
            <nav className='Table pagination'>
              <ul className='pagination justify-content-lg-end mb-0'>
                <li className={`page-item ${pageIndex <= 0 ? 'disabled' : ''}`}>
                  <button type="button" className="page-link" disabled={pageIndex <= 0} onClick={() => pagination.onPageChange?.(pageIndex - 1)}>
                    ←
                  </button>
                </li>
                <li className='page-item'>
                  <span className='page-link'>{pageIndex + 1} {'/'} {totalPages} </span>
                </li>
                <li className={`page-item ${(pageIndex >= totalPages - 1 || totalPages === 0) ? 'disabled' : ''}`}>
                  <button type="button" className="page-link" disabled={pageIndex >= totalPages - 1 || totalPages === 0} onClick={() => pagination.onPageChange?.(pageIndex + 1)}>
                    →
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  )
}
