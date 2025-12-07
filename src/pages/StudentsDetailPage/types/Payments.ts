export interface Payment {
  id: number
  concept: string
  amount: number
  status: string
  method: string
  reference: string
  paymentDate: string
  currency?: string
  receiptUrl?: string
}
