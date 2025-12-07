import { useMemo } from 'react'
import { DataTable, type DataTableColumn, type DataTablePagination } from '../../components/DataTable'
import type { Topup } from '../types/Topups'

interface TopupsTableProps {
  rows: Topup[]
  isLoading?: boolean
  pagination?: DataTablePagination
  emptyMessage?: string
  sortBy?: string
  sortDirection?: 'ASC' | 'DESC'
  onSort?: (columnKey: string) => void
}

export function TopupsTable({
  rows,
  isLoading,
  pagination,
  emptyMessage,
  sortBy,
  sortDirection,
  onSort,
}: TopupsTableProps) {
  const columns: Array<DataTableColumn<Topup>> = useMemo(
    () => [
      { key: 'status', label: 'Estatus', sortable: true },
      { key: 'method', label: 'Método', sortable: true },
      { key: 'reference', label: 'Referencia' },
      { key: 'date', label: 'Fecha', sortable: true },
      { key: 'amount', label: 'Monto', currency: rows[0]?.currency ?? 'MXN', sortable: true },
    ],
    [rows],
  )

  return (
    <DataTable
      columns={columns}
      data={rows}
      isLoading={isLoading}
      pagination={pagination}
      emptyMessage={emptyMessage}
      sortBy={sortBy}
      sortDirection={sortDirection}
      onSort={onSort}
    />
  )
}
