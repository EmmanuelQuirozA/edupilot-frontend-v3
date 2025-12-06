import { DataTable, type DataTableColumn } from '../../components/DataTable'
import type { TuitionRow } from '../types'

interface StudentTuitionTableProps {
  data: TuitionRow[]
  isLoading: boolean
}

export function StudentTuitionTable({ data, isLoading }: StudentTuitionTableProps) {
  const columns: Array<DataTableColumn<TuitionRow>> = [
    { key: 'description', label: 'Description', render: (row) => row.description ?? '-' },
  ]

  return <DataTable columns={columns} data={data} isLoading={isLoading} />
}
