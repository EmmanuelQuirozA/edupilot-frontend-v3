export interface PaymentRequest {
  id: number
  concept: string
  requestedAmount: number
  status: string
  ps_pr_name?: string
  paymentStatusId?: number
  requestDate: string
  dueDate?: string
  currency?: string
}
