import { useMemo } from 'react'
import { DataTable, type DataTableColumn, type DataTablePagination } from '../../../components/DataTable'
import type { Payment } from '../types/Payments'

interface PaymentsTableProps {
  rows: Payment[]
  isLoading?: boolean
  pagination?: DataTablePagination
  emptyMessage?: string
  sortBy?: string
  sortDirection?: 'ASC' | 'DESC'
  onSort?: (columnKey: string) => void
  onViewDetail?: (payment: Payment) => void
}

export function PaymentsTable({
  rows,
  isLoading,
  pagination,
  emptyMessage,
  sortBy,
  sortDirection,
  onSort,
  onViewDetail,
}: PaymentsTableProps) {
  const columns: Array<DataTableColumn<Payment>> = useMemo(
    () => [
      { key: 'concept', label: 'Concepto', sortable: true },
      { key: 'status', label: 'Estatus', sortable: true },
      { key: 'method', label: 'Método' },
      { key: 'reference', label: 'Referencia' },
      { key: 'paymentDate', label: 'Fecha', sortable: true },
      { key: 'amount', label: 'Monto', currency: rows[0]?.currency ?? 'MXN', sortable: true },
      {
        key: 'actions',
        label: 'Acciones',
        render: (payment) => (
          <button
            type="button"
            className="btn btn-link btn-sm"
            onClick={() => onViewDetail?.(payment)}
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
