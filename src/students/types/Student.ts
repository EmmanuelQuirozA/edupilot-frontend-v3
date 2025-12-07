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
