export interface TuitionRow {
  id: number
  concept: string
  monthlyAmounts: Record<string, number>
  total?: number
  status?: string
  dueDate?: string
  currency?: string
}
