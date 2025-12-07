export interface FormState {
  firstName: string
  lastName: string
  email: string
  phone: string
  institutionId?: number | string
  groupId?: number | string
  paymentReference?: string
  status?: string

  // Detailed fields (snake_case) used in edition mode
  register_id?: string
  payment_reference?: string
  school_id?: number | string
  group_id?: number | string
  first_name: string
  last_name_father: string
  last_name_mother: string
  birth_date?: string
  phone_number?: string
  tax_id?: string
  personal_email?: string
  street?: string
  ext_number?: string
  int_number?: string
  suburb?: string
  locality?: string
  municipality?: string
  state?: string
  curp?: string
}
