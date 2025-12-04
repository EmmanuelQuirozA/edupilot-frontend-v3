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

export function PaymentRecurrencesTable({ rows, strings }: PaymentRecurrencesTableProps) {
  const decoratedRows = useMemo(
    () => rows.map((row) => ({ ...row, actions: <span className="badge bg-light text-dark">--</span> })),
    [rows],
  )

  return (
    <div className="table-responsive">
      <table className="table align-middle">
        <thead className="table-light">
          <tr>
            <th scope="col">{strings.columns.id}</th>
            <th scope="col">{strings.columns.ruleName}</th>
            <th scope="col">{strings.columns.concept}</th>
            <th scope="col">{strings.columns.recurrenceType}</th>
            <th scope="col">{strings.columns.appliesTo}</th>
            <th scope="col" className="text-end">{strings.columns.amount}</th>
            <th scope="col">{strings.columns.nextExecutionDate}</th>
            <th scope="col">{strings.columns.active}</th>
            <th scope="col" className="text-end">{strings.columns.actions}</th>
          </tr>
        </thead>
        <tbody>
          {decoratedRows.length === 0 ? (
            <tr>
              <td colSpan={9} className="text-center text-muted py-4">
                {strings.empty}
              </td>
            </tr>
          ) : (
            decoratedRows.map((row) => (
              <tr key={row.payment_request_scheduled_id}>
                <td>{row.payment_request_scheduled_id}</td>
                <td>{row.rule_name}</td>
                <td>{row.pt_name}</td>
                <td>{row.pot_name}</td>
                <td>{row.applies_to}</td>
                <td className="text-end">{row.amount}</td>
                <td>{row.next_execution_date}</td>
                <td>{row.active ? 'Sí' : 'No'}</td>
                <td className="text-end">{row.actions}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
