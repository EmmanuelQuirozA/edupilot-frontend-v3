export interface Payment {
  payment_id: number
  pt_name: string
  payment_status_name: string
  payment_status_id?: number
  amount: number
  payment_date: string
}
