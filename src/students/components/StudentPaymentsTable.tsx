import { DataTable, type DataTableColumn } from '../../components/DataTable'
import type { PaymentRow } from '../types'

interface StudentPaymentsTableProps {
  data: PaymentRow[]
  isLoading: boolean
}

export function StudentPaymentsTable({ data, isLoading }: StudentPaymentsTableProps) {
  const columns: Array<DataTableColumn<PaymentRow>> = [
    { key: 'reference', label: 'Reference', render: (row) => row.reference ?? '-' },
  ]

  return <DataTable columns={columns} data={data} isLoading={isLoading} />
}
