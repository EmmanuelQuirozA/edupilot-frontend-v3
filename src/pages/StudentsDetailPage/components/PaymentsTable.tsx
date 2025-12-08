import { useMemo } from 'react'
import { DataTable, type DataTableColumn, type DataTablePagination } from '../../../components/DataTable'
import type { Payment } from '../types/Payments'
import { useLanguage } from '../../../context/LanguageContext'
import { formatDate } from '../../../utils/formatDate'

interface PaymentsTableProps {
  rows: Payment[]
  isLoading?: boolean
  pagination?: DataTablePagination
  emptyMessage?: string
  sortBy?: string
  sortDirection?: 'ASC' | 'DESC'
  onSort?: (columnKey: string) => void
  onNavigate: (path: string) => void
}

export function PaymentsTable({
  rows,
  isLoading,
  pagination,
  emptyMessage,
  sortBy,
  sortDirection,
  onSort,
  onNavigate,
}: PaymentsTableProps) {
  const { locale, t } = useLanguage()
  const columns: Array<DataTableColumn<Payment>> = useMemo(
    () => [
      {
        key: 'payment_id',
        label: 'id',
        sortable: true,
      },
      { key: 'pt_name', label: 'Concepto', sortable: true },
      {
        key: 'payment_status_id',
        label: 'status',
        sortable: true,
        render: (row) => (
          <small 
            className={'cell-chip px-4 text-nowrap ' + (row.payment_status_id === 3 ? 'bg-success' : row.payment_status_id === 1 ? 'bg-warning' : 'bg-danger')}
          > {row.payment_status_name} </small>
        ),
      },
      {
        key: 'payment_date',
        label: 'paymentDate',
        sortable: true,
        render: (row) => (
          formatDate(row?.payment_date, locale, {year: 'numeric', month: 'short', day: '2-digit'})
        )
      },
      { key: 'amount', label: 'Monto', currency: 'MXN', sortable: true },
      {
        key: 'actions',
        label: t('tableActions'),
        sortable: false,
        render: (row) => (
          <button
            type="button"
            className="btn btn-link p-0"
            onClick={() => onNavigate(`/${locale}/finance/payments/${row.payment_id}`)}
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
