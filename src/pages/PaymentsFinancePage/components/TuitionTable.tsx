import { useMemo } from 'react'
import type { TuitionRow } from '../types'
import { MONTH_KEY_REGEX } from '../utils'
import { FinanceTable, type FinanceTableColumn } from './FinanceTable'

interface TuitionTableProps {
  rows: TuitionRow[]
  isLoading?: boolean
  error?: string | null
  columnLabels: { student: string; generation: string }
  emptyLabel?: string
}

export function TuitionTable({ rows, isLoading, error, columnLabels, emptyLabel }: TuitionTableProps) {
  const displayedColumns = useMemo<FinanceTableColumn<TuitionRow>[]>(
    () => [
      { key: 'student', header: columnLabels.student },
      { key: 'generation', header: columnLabels.generation },
    ],
    [columnLabels.generation, columnLabels.student],
  )

  const monthColumns = useMemo(() => {
    const columns: string[] = []

    for (const row of rows) {
      if (!row || typeof row !== 'object') {
        continue
      }

      for (const key of Object.keys(row)) {
        if (!MONTH_KEY_REGEX.test(key)) {
          continue
        }

        if (!columns.includes(key)) {
          columns.push(key)
        }
      }
    }

    return columns
  }, [rows])

  const columns = useMemo<FinanceTableColumn<TuitionRow>[]>(
    () => [
      ...displayedColumns,
      ...monthColumns.map((key) => ({ key, header: key })),
    ],
    [displayedColumns, monthColumns],
  )

  return <FinanceTable columns={columns} rows={rows} isLoading={isLoading} error={error} emptyLabel={emptyLabel} />
}
