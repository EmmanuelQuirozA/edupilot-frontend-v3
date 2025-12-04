import { useMemo, type ReactNode } from 'react'
import type { PaymentRecurrenceRow } from '../types'

interface PaymentRecurrencesTableProps {
  rows: PaymentRecurrenceRow[]
  isLoading?: boolean
  error?: string | null
  strings: {
    columns: {
      id: string
      ruleName: string
      concept: string
      recurrenceType: string
      appliesTo: string
      amount: string
      nextExecutionDate: string
      active: string
      actions: string
    }
    empty: string
  }
  onSort: (key: string) => void
  renderSortIndicator: (key: string) => ReactNode
}

export function PaymentRecurrencesTable({ rows, isLoading, error, strings, onSort, renderSortIndicator }: PaymentRecurrencesTableProps) {
  const columns = useMemo<FinanceTableColumn<PaymentRecurrenceRow>[]>(
    () => {
      const sortableHeader = (label: string, key: string) => (
        <button type="button" className="finance-table__sortable" onClick={() => onSort(key)}>
          <span>{label}</span>
          {renderSortIndicator(key)}
        </button>
      )

      return [
        { key: 'payment_request_scheduled_id', header: sortableHeader(strings.columns.id, 'payment_request_scheduled_id') },
        { key: 'rule_name', header: sortableHeader(strings.columns.ruleName, 'rule_name') },
        { key: 'pt_name', header: sortableHeader(strings.columns.concept, 'pt_name') },
        { key: 'pot_name', header: sortableHeader(strings.columns.recurrenceType, 'pot_name') },
        { key: 'applies_to', header: sortableHeader(strings.columns.appliesTo, 'applies_to') },
        { key: 'amount', header: sortableHeader(strings.columns.amount, 'amount'), align: 'end' },
        { key: 'next_execution_date', header: sortableHeader(strings.columns.nextExecutionDate, 'next_execution_date') },
        { key: 'active', header: sortableHeader(strings.columns.active, 'active') },
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
    <div></div>
  )
}
