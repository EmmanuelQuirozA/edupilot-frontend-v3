import type { ReactNode } from 'react'

export interface FinanceTableColumn<T> {
  key: keyof T | string
  header: ReactNode
  align?: 'start' | 'center' | 'end'
}

interface FinanceTableProps<T> {
  columns: FinanceTableColumn<T>[]
  rows: Array<T & Record<string, unknown>>
  isLoading?: boolean
  error?: string | null
  emptyLabel?: string
}

export function FinanceTable<T>({ columns, rows, isLoading = false, error, emptyLabel }: FinanceTableProps<T>) {
  if (error) {
    return <div className="alert alert-danger">{error}</div>
  }

  return (
    <div className="table-responsive">
      <table className="table align-middle mb-0">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={String(column.key)} className="text-muted small text-uppercase fw-semibold">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="text-center text-muted py-3">
                ...
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center text-muted py-3">
                {emptyLabel ?? '--'}
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column) => (
                  <td
                    key={`${String(column.key)}-${rowIndex}`}
                    className={column.align === 'end' ? 'text-end' : column.align === 'center' ? 'text-center' : ''}
                  >
                    {row[column.key as string] as ReactNode}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
