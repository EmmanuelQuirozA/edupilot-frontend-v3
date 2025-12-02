export interface TuitionRow {
  student?: string
  generation?: string
  [key: string]: unknown
}

export interface PaymentRow {
  payment_id?: number
  student?: string
  student_full_name?: string
  pt_name?: string
  amount?: number
  [key: string]: unknown
}

export interface PaymentRequestRow {
  payment_request_id?: number
  student?: string
  student_full_name?: string
  pt_name?: string
  pr_amount?: number
  ps_pr_name?: string
  pr_pay_by?: string
  [key: string]: unknown
}

export interface PaymentRecurrenceRow {
  payment_request_scheduled_id?: number
  rule_name?: string
  pt_name?: string
  pot_name?: string
  applies_to?: string
  amount?: number
  next_execution_date?: string
  active?: boolean
  [key: string]: unknown
}
