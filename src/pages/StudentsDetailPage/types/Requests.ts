export interface PaymentRequest {
  id: number
  concept: string
  requestedAmount: number
  status: string
  requestDate: string
  dueDate?: string
  currency?: string
}
