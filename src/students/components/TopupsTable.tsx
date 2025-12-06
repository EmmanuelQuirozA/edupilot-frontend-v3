import { useCallback, useMemo } from 'react'
import { DataTable, type DataTableColumn, type DataTablePagination } from '../../components/DataTable'
import { createCurrencyFormatter } from '../../utils/currencyFormatter'
import { formatDate } from '../../utils/formatDate'

export interface StudentTopup {
  balance_recharge_id: number
  amount: number
  created_at: string
}

export interface TopupsTableProps {
  data: StudentTopup[]
  isLoading: boolean
  locale: string
  t: (key: string) => string
  pagination?: DataTablePagination
}

export function TopupsTable({ data, isLoading, locale, t, pagination }: TopupsTableProps) {
  const currencyFormatter = useMemo(() => createCurrencyFormatter(locale, 'MXN'), [locale])
  const formatCurrency = useCallback(
    (value: number | null | undefined) => currencyFormatter.format(value ?? 0),
    [currencyFormatter],
  )

  const columns: Array<DataTableColumn<StudentTopup>> = useMemo(
    () => [
      {
        key: 'balance_recharge_id',
        label: t('topupIdLabel'),
      },
      {
        key: 'amount',
        label: t('topupAmountLabel'),
        render: (row) => formatCurrency(row.amount),
      },
      {
        key: 'created_at',
        label: t('topupDateLabel'),
        render: (row) => formatDate(row.created_at, locale),
      },
    ],
    [formatCurrency, locale, t],
  )

  return <DataTable columns={columns} data={data} isLoading={isLoading} pagination={pagination} />
}
