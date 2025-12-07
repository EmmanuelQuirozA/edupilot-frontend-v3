import { useMemo } from 'react'
import { DataTable, type DataTableColumn, type DataTablePagination } from '../../components/DataTable'
import type { TuitionRow } from '../types/Tuition'

interface TuitionTableProps {
  rows: TuitionRow[]
  isLoading?: boolean
  pagination?: DataTablePagination
  emptyMessage?: string
  sortBy?: string
  sortDirection?: 'ASC' | 'DESC'
  onSort?: (columnKey: string) => void
  onViewDetail?: (row: TuitionRow) => void
}

export function TuitionTable({
  rows,
  isLoading,
  pagination,
  emptyMessage,
  sortBy,
  sortDirection,
  onSort,
  onViewDetail,
}: TuitionTableProps) {
  const monthColumns = useMemo(() => {
    const monthSet = new Set<string>()
    rows.forEach((row) => {
      Object.keys(row.monthlyAmounts).forEach((month) => monthSet.add(month))
    })
    return Array.from(monthSet)
  }, [rows])

  const columns: Array<DataTableColumn<TuitionRow>> = useMemo(() => {
    const baseColumns: Array<DataTableColumn<TuitionRow>> = [
      { key: 'concept', label: 'Concepto', sortable: true },
      { key: 'status', label: 'Estatus' },
    ]

    const dynamicColumns: Array<DataTableColumn<TuitionRow>> = monthColumns.map((month) => ({
      key: month,
      label: month,
      sortable: true,
      render: (row) => row.monthlyAmounts[month] ?? '-',
    }))

    const tailColumns: Array<DataTableColumn<TuitionRow>> = [
      {
        key: 'total',
        label: 'Total',
        sortable: true,
        currency: rows[0]?.currency ?? 'MXN',
      },
      {
        key: 'actions',
        label: 'Acciones',
        render: (row) => (
          <button type="button" className="btn btn-link btn-sm" onClick={() => onViewDetail?.(row)}>
            Ver detalle
          </button>
        ),
      },
    ]

    return [...baseColumns, ...dynamicColumns, ...tailColumns]
  }, [monthColumns, onViewDetail, rows])

  const mappedRows = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        status: row.status ?? 'Pendiente',
      })),
    [rows],
  )

  return (
    <DataTable
      columns={columns}
      data={mappedRows}
      isLoading={isLoading}
      emptyMessage={emptyMessage}
      pagination={pagination}
      sortBy={sortBy}
      sortDirection={sortDirection}
      onSort={onSort}
    />
  )
}
