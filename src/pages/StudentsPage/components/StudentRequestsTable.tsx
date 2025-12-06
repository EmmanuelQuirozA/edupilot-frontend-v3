import { DataTable, type DataTableColumn } from '../../../components/DataTable'
import type { RequestRow } from '../types'

interface StudentRequestsTableProps {
  data: RequestRow[]
  isLoading: boolean
}

export function StudentRequestsTable({ data, isLoading }: StudentRequestsTableProps) {
  const columns: Array<DataTableColumn<RequestRow>> = [
    { key: 'reference', label: 'Reference', render: (row) => row.reference ?? '-' },
  ]

  return <DataTable columns={columns} data={data} isLoading={isLoading} />
}
