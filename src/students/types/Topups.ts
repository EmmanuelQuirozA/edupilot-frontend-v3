export interface Topup {
  id: number
  amount: number
  method: string
  reference: string
  status: string
  date: string
  currency?: string
}
