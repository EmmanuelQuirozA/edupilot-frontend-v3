export interface Student {
  id: number
  userId?: number
  fullName: string
  firstName: string
  lastName: string
  email: string
  phone: string
  status: string
  institutionName?: string
  registerId?: string
  paymentReference?: string
  balance: number
  groupName?: string
  level?: string
  generation?: string
  avatarUrl?: string
  isActive: boolean
  user_enabled: boolean

  student_id: number
  group_id: number
  register_id: string
  payment_reference: string
  user_id: number
  school_id: number
  username: string
  role_name: string
  full_name: string
  address: string | undefined
  commercial_name: string
  business_name: string
  group_name: string | undefined
  grade_group: string
  grade: string
  group: string
  scholar_level_id: number
  scholar_level_name: string
  first_name: string
  last_name_father: string
  last_name_mother: string
  birth_date: string | undefined
  phone_number: string | undefined
  tax_id: string | undefined
  street: string | undefined
  ext_number: string | undefined
  int_number: string | undefined
  suburb: string | undefined
  locality: string | undefined
  municipality: string | undefined
  state: string | undefined
  personal_email: string | undefined
  role_enabled: boolean
  school_enabled: boolean
  group_enabled: boolean
  user_status: string
  role_status: string
  school_status: string
  group_status: string
  joining_date: string
  tuition: string
  default_tuition: string
}

export interface StudentSummary {
  balance: number
  registerId?: string
  paymentReference?: string
}

export interface CatalogOption {
  id: number | string
  label: string
}

export interface StudentCatalogs {
  schools: CatalogOption[]
  groups: CatalogOption[]
}
