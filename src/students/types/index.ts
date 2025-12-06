export interface Student {
  id?: number
  externalId?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  status?: string
  institutionName?: string
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
