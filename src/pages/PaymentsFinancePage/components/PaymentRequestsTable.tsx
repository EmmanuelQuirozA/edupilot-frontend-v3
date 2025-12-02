import { useMemo, type ReactNode } from 'react'
import type { PaymentRequestRow } from '../types'
import { FinanceTable, type FinanceTableColumn } from './FinanceTable'

interface PaymentRequestsTableProps {
  rows: PaymentRequestRow[]
  isLoading?: boolean
  error?: string | null
  strings: {
    columns: {
      id: string
      student: string
      concept: string
      amount: string
      status: string
      dueDate: string
      actions: string
    }
    empty: string
  }
  onSort: (key: string) => void
  renderSortIndicator: (key: string) => ReactNode
}

export function PaymentRequestsTable({ rows, isLoading, error, strings, onSort, renderSortIndicator }: PaymentRequestsTableProps) {
  const columns = useMemo<FinanceTableColumn<PaymentRequestRow>[]>(
    () => {
      const sortableHeader = (label: string, key: string) => (
        <button type="button" className="finance-table__sortable" onClick={() => onSort(key)}>
          <span>{label}</span>
          {renderSortIndicator(key)}
        </button>
      )

      return [
        { key: 'payment_request_id', header: sortableHeader(strings.columns.id, 'payment_request_id') },
        { key: 'student', header: sortableHeader(strings.columns.student, 'student_full_name') },
        { key: 'pt_name', header: sortableHeader(strings.columns.concept, 'pt_name') },
        { key: 'pr_amount', header: sortableHeader(strings.columns.amount, 'pr_amount'), align: 'end' },
        { key: 'ps_pr_name', header: sortableHeader(strings.columns.status, 'ps_pr_name') },
        { key: 'pr_pay_by', header: sortableHeader(strings.columns.dueDate, 'pr_pay_by') },
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
