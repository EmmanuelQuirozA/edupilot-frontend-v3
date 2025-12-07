import { useMemo } from 'react'
import { DataTable, type DataTableColumn, type DataTablePagination } from '../../components/DataTable'
import type { PaymentRequest } from '../types/Requests'

interface RequestsTableProps {
  rows: PaymentRequest[]
  isLoading?: boolean
  pagination?: DataTablePagination
  emptyMessage?: string
  sortBy?: string
  sortDirection?: 'ASC' | 'DESC'
  onSort?: (columnKey: string) => void
  onViewDetail?: (request: PaymentRequest) => void
}

export function RequestsTable({
  rows,
  isLoading,
  pagination,
  emptyMessage,
  sortBy,
  sortDirection,
  onSort,
  onViewDetail,
}: RequestsTableProps) {
  const columns: Array<DataTableColumn<PaymentRequest>> = useMemo(
    () => [
      { key: 'concept', label: 'Concepto', sortable: true },
      { key: 'status', label: 'Estatus', sortable: true },
      { key: 'requestDate', label: 'Fecha de solicitud', sortable: true },
      { key: 'dueDate', label: 'Fecha límite', sortable: true },
      { key: 'requestedAmount', label: 'Monto solicitado', currency: rows[0]?.currency ?? 'MXN', sortable: true },
      {
        key: 'actions',
        label: 'Acciones',
        render: (request) => (
          <button
            type="button"
            className="btn btn-link btn-sm"
            onClick={() => onViewDetail?.(request)}
          >
            Ver detalle
          </button>
        ),
      },
    ],
    [onViewDetail, rows],
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
