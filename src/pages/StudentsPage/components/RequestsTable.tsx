import { useCallback, useMemo } from 'react'
import { DataTable, type DataTableColumn, type DataTablePagination } from '../../../components/DataTable'
import { createCurrencyFormatter } from '../../../utils/currencyFormatter'
import { formatDate } from '../../../utils/formatDate'

export interface StudentPaymentRequest {
  payment_request_id: number
  pt_name: string
  pr_amount: number
  ps_pr_name: string
  pr_pay_by: string
  pr_created_at: string
}

export interface RequestsTableProps {
  data: StudentPaymentRequest[]
  isLoading: boolean
  locale: string
  t: (key: string) => string
  onViewRequest: (requestId: number) => void
  pagination?: DataTablePagination
}

export function RequestsTable({ data, isLoading, locale, t, onViewRequest, pagination }: RequestsTableProps) {
  const currencyFormatter = useMemo(() => createCurrencyFormatter(locale, 'MXN'), [locale])
  const formatCurrency = useCallback(
    (value: number | null | undefined) => currencyFormatter.format(value ?? 0),
    [currencyFormatter],
  )

  const columns: Array<DataTableColumn<StudentPaymentRequest>> = useMemo(
    () => [
      {
        key: 'payment_request_id',
        label: t('paymentRequestIdLabel'),
      },
      {
        key: 'pt_name',
        label: t('paymentRequestConceptLabel'),
      },
      {
        key: 'pr_amount',
        label: t('paymentRequestAmountLabel'),
        render: (row) => formatCurrency(row.pr_amount),
      },
      {
        key: 'ps_pr_name',
        label: t('paymentRequestStatusLabel'),
      },
      {
        key: 'pr_pay_by',
        label: t('paymentRequestDueDateLabel'),
        render: (row) => formatDate(row.pr_pay_by, locale),
      },
      {
        key: 'pr_created_at',
        label: t('paymentRequestCreatedAtLabel'),
        render: (row) => formatDate(row.pr_created_at, locale),
      },
      {
        key: 'actions',
        label: t('tableActions'),
        sortable: false,
        render: (row) => (
          <button
            type="button"
            className="btn btn-link btn-sm"
            onClick={() => onViewRequest(row.payment_request_id)}
          >
            {t('viewDetails')}
          </button>
        ),
      },
    ],
    [formatCurrency, locale, onViewRequest, t],
  )

  return <DataTable columns={columns} data={data} isLoading={isLoading} pagination={pagination} />
}
