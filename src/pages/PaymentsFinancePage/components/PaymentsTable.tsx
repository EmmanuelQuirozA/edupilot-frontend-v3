import { useMemo, type ReactNode } from 'react'
import type { PaymentRow } from '../types'
import { FinanceTable, type FinanceTableColumn } from './FinanceTable'

interface PaymentsTableProps {
  rows: PaymentRow[]
  isLoading?: boolean
  error?: string | null
  strings: {
    columns: { id: string; student: string; concept: string; amount: string; actions: string }
    empty: string
  }
  onSort: (key: string) => void
  renderSortIndicator: (key: string) => ReactNode
}

export function PaymentsTable({ rows, isLoading, error, strings, onSort, renderSortIndicator }: PaymentsTableProps) {
  const columns = useMemo<FinanceTableColumn<PaymentRow>[]>(
    () => {
      const sortableHeader = (label: string, key: string) => (
        <button type="button" className="finance-table__sortable" onClick={() => onSort(key)}>
          <span>{label}</span>
          {renderSortIndicator(key)}
        </button>
      )

      return [
        { key: 'payment_id', header: sortableHeader(strings.columns.id, 'payment_id') },
        { key: 'student', header: sortableHeader(strings.columns.student, 'student_full_name') },
        { key: 'pt_name', header: sortableHeader(strings.columns.concept, 'pt_name') },
        { key: 'amount', header: sortableHeader(strings.columns.amount, 'amount'), align: 'end' },
        { key: 'actions', header: strings.columns.actions, align: 'end' },
      ]
    },
    [onSort, renderSortIndicator, strings.columns],
  )

  const decoratedRows = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        actions: <span className="badge bg-light text-dark">--</span>,
      })),
    [rows],
  )

  return (
    <FinanceTable
      columns={columns}
      rows={decoratedRows}
      isLoading={isLoading}
      error={error}
      emptyLabel={strings.empty}
    />
  )
}
