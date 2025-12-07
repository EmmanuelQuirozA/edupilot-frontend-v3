export interface Payment {
  id: number
  concept: string
  status: string
  paymentStatusId?: number
  amount: number
  paymentDate: string
}
