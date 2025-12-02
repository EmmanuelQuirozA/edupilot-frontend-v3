import type { ReactNode } from 'react'
import './FinanceTable.css'

export interface FinanceTableColumn<T> {
  key: string
  header: ReactNode
  render?: (row: T) => ReactNode
  align?: 'start' | 'center' | 'end'
}

interface FinanceTableProps<T> {
  columns: Array<FinanceTableColumn<T>>
  rows: T[]
  isLoading?: boolean
  error?: string | null
  emptyLabel?: string
}

export function FinanceTable<T>({ columns, rows, isLoading = false, error, emptyLabel }: FinanceTableProps<T>) {
  const hasRows = rows.length > 0

  return (
    <div className="finance-table card border-0 shadow-sm">
      <div className="table-responsive">
        <table className="table align-middle mb-0">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col" className={`finance-table__th text-${column.align ?? 'start'}`}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-4 text-muted">
                  Cargando información...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-4 text-danger">
                  {error}
                </td>
              </tr>
            ) : !hasRows ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-4 text-muted">
                  {emptyLabel ?? 'No hay registros disponibles'}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={index}>
                  {columns.map((column) => {
                    const value = column.render ? column.render(row) : (row as Record<string, ReactNode>)[column.key]
                    return (
                      <td key={column.key} className={`text-${column.align ?? 'start'} text-muted`}>
                        {value}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
