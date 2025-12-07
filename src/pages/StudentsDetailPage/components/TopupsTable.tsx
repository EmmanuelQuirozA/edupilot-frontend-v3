import { useMemo } from 'react'
import { DataTable, type DataTableColumn, type DataTablePagination } from '../../../components/DataTable'
import type { Topup } from '../types/Topups'
import { useLanguage } from '../../../context/LanguageContext'
import { formatDate } from '../../../utils/formatDate'


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
  const { locale } = useLanguage()
  const columns: Array<DataTableColumn<Topup>> = useMemo(
    () => [
      {
        key: 'id',
        label: 'id',
        sortable: true,
      },
      {
        key: 'date',
        label: 'date',
        sortable: true,
        render: (row) => (
          formatDate(row?.date, locale, {year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
        )
      },
      { key: 'amount', label: 'amount', currency: 'MXN', sortable: true },
    ],
    [locale],
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
