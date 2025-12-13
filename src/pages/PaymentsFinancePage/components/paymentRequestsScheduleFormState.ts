export type PaymentRequestScheduleFormState = {
  rule_name_es: string
  rule_name_en: string
  payment_concept_id: string | number
  amount: string | number
  fee_type: '$' | '%'
  late_fee: string | number
  late_fee_frequency: string | number
  period_of_time_id: string | number
  interval_count: string | number
  start_date: string
  end_date: string
  comments: string
  next_execution_date: string
  school_id: string
  group_id: string
  student_id: string
}

const getToday = () => new Date().toISOString().split('T')[0]

export const createInitialPaymentRequestScheduleFormState = (): PaymentRequestScheduleFormState => ({
  rule_name_es: '',
  rule_name_en: '',
  payment_concept_id: '',
  amount: '',
  fee_type: '$',
  late_fee: '',
  late_fee_frequency: '',
  period_of_time_id: 4,
  interval_count: 1,
  start_date: '',
  end_date: '',
  comments: '',
  next_execution_date: getToday(),
  school_id: '',
  group_id: '',
  student_id: '',
})
