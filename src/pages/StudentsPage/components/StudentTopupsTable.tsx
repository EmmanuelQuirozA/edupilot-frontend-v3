import { DataTable, type DataTableColumn } from '../../../components/DataTable'
import type { TopupRow } from '../types'

interface StudentTopupsTableProps {
  data: TopupRow[]
  isLoading: boolean
}

export function StudentTopupsTable({ data, isLoading }: StudentTopupsTableProps) {
  const columns: Array<DataTableColumn<TopupRow>> = [
    { key: 'reference', label: 'Reference', render: (row) => row.reference ?? '-' },
  ]

  return <DataTable columns={columns} data={data} isLoading={isLoading} />
}
