import { useCallback, useMemo } from 'react'
import { DataTable, type DataTableColumn } from '../../../components/DataTable'
import { createCurrencyFormatter } from '../../../utils/currencyFormatter'

const MONTH_KEY_REGEX = /^[A-Za-z]{3}-\d{2}$/

export interface TuitionRow {
  [monthKey: string]:
    | number
    | null
    | {
        totalAmount: number
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        payments: any[]
        paymentRequestId: number | null
        paymentMonth: string
      }
}

interface TuitionTableProps {
  data: TuitionRow[]
  isLoading: boolean
  locale: string
  t: (key: string) => string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onOpenMonthDetail: (row: TuitionRow, month: string, details: any) => void
}

export function TuitionTable({ data, isLoading, locale, t, onOpenMonthDetail }: TuitionTableProps) {
  const currencyFormatter = useMemo(() => createCurrencyFormatter(locale, 'MXN'), [locale])
  const formatCurrency = useCallback(
    (value: number | null | undefined) => currencyFormatter.format(value ?? 0),
    [currencyFormatter],
  )

  const monthKeys = useMemo(() => {
    const keys = new Set<string>()

    data.forEach((row) => {
      Object.keys(row ?? {}).forEach((key) => {
        if (MONTH_KEY_REGEX.test(key)) {
          keys.add(key)
        }
      })
    })

    return Array.from(keys)
  }, [data])

  const columns: Array<DataTableColumn<TuitionRow>> = useMemo(
    () =>
      monthKeys.map((monthKey) => ({
        key: monthKey,
        label: monthKey,
        render: (row) => {
          const value = row[monthKey]

          if (value == null) {
            return '—'
          }

          if (typeof value === 'object' && !Array.isArray(value)) {
            const details = value as {
              totalAmount: number
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              payments: any[]
              paymentRequestId: number | null
              paymentMonth: string
            }

            return (
              <button
                type="button"
                className="btn btn-link btn-sm"
                onClick={() => onOpenMonthDetail(row, monthKey, details)}
              >
                {details.totalAmount != null ? formatCurrency(details.totalAmount) : t('viewDetails')}
              </button>
            )
          }

          if (typeof value === 'number') {
            return formatCurrency(value)
          }

          return String(value)
        },
      })),
    [formatCurrency, monthKeys, onOpenMonthDetail, t],
  )

  return <DataTable columns={columns} data={data} isLoading={isLoading} />
}
