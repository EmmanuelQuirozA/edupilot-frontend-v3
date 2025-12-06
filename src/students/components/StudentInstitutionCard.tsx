import type { Student } from '../types'

interface StudentInstitutionCardProps {
  student: Student | null
}

export function StudentInstitutionCard({ student }: StudentInstitutionCardProps) {
  return (
    <div className="card p-3">
      <div className="fw-semibold">Institution</div>
      <div className="text-muted">{student?.institutionName ?? 'N/A'}</div>
    </div>
  )
}
