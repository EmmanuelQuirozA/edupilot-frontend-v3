import { useMemo } from 'react'
import { DataTable, type DataTableColumn, type DataTablePagination } from '../../../components/DataTable'
import type { PaymentRequest } from '../types/Requests'
import { useLanguage } from '../../../context/LanguageContext'
import { formatDate } from '../../../utils/formatDate'

interface RequestsTableProps {
  rows: PaymentRequest[]
  isLoading?: boolean
  pagination?: DataTablePagination
  emptyMessage?: string
  sortBy?: string
  sortDirection?: 'ASC' | 'DESC'
  onSort?: (columnKey: string) => void
  onNavigate: (path: string) => void
}

export function RequestsTable({
  rows,
  isLoading,
  pagination,
  emptyMessage,
  sortBy,
  sortDirection,
  onSort,
  onNavigate,
}: RequestsTableProps) {
  const { locale, t } = useLanguage()
  const columns: Array<DataTableColumn<PaymentRequest>> = useMemo(
    () => [
      {
        key: 'id',
        label: 'id',
        sortable: true,
      },
      {
        key: 'concept',
        label: 'concept',
        sortable: true,
      },
      {
        key: 'status',
        label: 'status',
        sortable: true,
        render: (row) => (
          <small 
            className={'cell-chip px-4 text-nowrap ' + (row.paymentStatusId === 7 ? 'bg-success' : row.paymentStatusId === 8 ? 'bg-danger' : 'bg-warning')}
          > {row.status} </small>
        ),
      },
      {
        key: 'requestedAmount',
        label: 'amount',
        sortable: true,
        currency: 'MXN'
      },
      {
        key: 'requestDate',
        label: 'due_date',
        sortable: true,
        render: (row) => (
          formatDate(row?.requestDate, locale, {year: 'numeric', month: 'short', day: '2-digit'})
        )
      },
      {
        key: 'actions',
        label: t('tableActions'),
        sortable: false,
        render: (row) => (
          <button
            type="button"
            className="btn btn-link p-0"
            onClick={() => onNavigate(`/${locale}/finance/request/${row.id}`)}
          >
            {t('viewDetails')}
          </button>
        ),
      },
    ],
    [locale, onNavigate, t],
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
