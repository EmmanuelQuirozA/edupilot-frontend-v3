import { useCallback, useMemo } from 'react'
import { DataTable, type DataTableColumn, type DataTablePagination } from '../../components/DataTable'
import { createCurrencyFormatter } from '../../utils/currencyFormatter'
import { formatDate } from '../../utils/formatDate'

export interface StudentPayment {
  payment_id: number
  pt_name: string
  amount: number
  payment_status_name: string
  payment_created_at: string
}

export interface PaymentsTableProps {
  data: StudentPayment[]
  isLoading: boolean
  locale: string
  t: (key: string) => string
  onViewPayment: (paymentId: number) => void
  pagination?: DataTablePagination
}

export function PaymentsTable({ data, isLoading, locale, t, onViewPayment, pagination }: PaymentsTableProps) {
  const currencyFormatter = useMemo(() => createCurrencyFormatter(locale, 'MXN'), [locale])
  const formatCurrency = useCallback(
    (value: number | null | undefined) => currencyFormatter.format(value ?? 0),
    [currencyFormatter],
  )

  const columns: Array<DataTableColumn<StudentPayment>> = useMemo(
    () => [
      {
        key: 'payment_id',
        label: t('paymentIdLabel'),
      },
      {
        key: 'pt_name',
        label: t('paymentConceptLabel'),
      },
      {
        key: 'amount',
        label: t('paymentAmountLabel'),
        render: (row) => formatCurrency(row.amount),
      },
      {
        key: 'payment_status_name',
        label: t('paymentStatusLabel'),
      },
      {
        key: 'payment_created_at',
        label: t('paymentDateLabel'),
        render: (row) => formatDate(row.payment_created_at, locale),
      },
      {
        key: 'actions',
        label: t('tableActions'),
        sortable: false,
        render: (row) => (
          <button
            type="button"
            className="btn btn-link btn-sm"
            onClick={() => onViewPayment(row.payment_id)}
          >
            {t('viewDetails')}
          </button>
        ),
      },
    ],
    [formatCurrency, locale, onViewPayment, t],
  )

  return <DataTable columns={columns} data={data} isLoading={isLoading} pagination={pagination} />
}
