import { API_BASE_URL } from '../config'

export interface SchoolDetails {
  name?: string | null
  commercial_name?: string | null
  street?: string | null
  ext_number?: string | null
  int_number?: string | null
  suburb?: string | null
  locality?: string | null
  municipality?: string | null
  state?: string | null
  phone_number?: string | null
}

export const buildSchoolAddress = (details: SchoolDetails | null | undefined) => {
  if (!details) return ''
  const streetLine = [details.street, details.ext_number, details.int_number].filter(Boolean).join(' ')
  const localityLine = [details.suburb, details.locality, details.municipality, details.state].filter(Boolean).join(', ')
  return [streetLine, localityLine].filter(Boolean).join(' · ')
}

export const resolveSchoolName = (details: SchoolDetails | null | undefined, fallback?: string | null) => {
  if (!details) return fallback ?? '-'
  return details.commercial_name || details.name || fallback || '-'
}

export async function fetchSchoolDetails(params: {
  schoolId: number
  token: string
  lang: string
}): Promise<SchoolDetails | null> {
  const searchParams = new URLSearchParams({
    school_id: String(params.schoolId),
    lang: params.lang,
  })

  const response = await fetch(`${API_BASE_URL}/schools/details?${searchParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${params.token}`,
    },
  })

  if (!response.ok) {
    throw new Error('failed_request')
  }

  const payload = await response.json()
  return payload?.school_details ?? null
}
