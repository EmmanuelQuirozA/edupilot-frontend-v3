export interface Student {
  id?: number
  externalId?: string
  firstName?: string
  first_name?: string
  lastName?: string
  last_name_father?: string
  last_name_mother?: string
  email?: string
  phone?: string
  status?: string
  fullName?: string
  full_name?: string
  institutionName?: string
  registerId?: string
  register_id?: string
  user_id?: number
  avatarUrl?: string
}

export interface TuitionRow {
  id?: number
  description?: string
  amount?: number
  currency?: string
  status?: string
  dueDate?: string
}

export interface PaymentRow {
  id?: number
  reference?: string
  amount?: number
  currency?: string
  createdAt?: string
  status?: string
}

export interface RequestRow {
  id?: number
  reference?: string
  requester?: string
  amount?: number
  currency?: string
  createdAt?: string
  status?: string
}

export interface TopupRow {
  id?: number
  reference?: string
  amount?: number
  currency?: string
  createdAt?: string
  status?: string
}

export interface FormState {
  firstName: string
  lastName: string
  email: string
  phone?: string
  institutionName?: string
  status?: string
}
