import type { Student } from '../types'

interface StudentContactCardProps {
  student: Student | null
}

export function StudentContactCard({ student }: StudentContactCardProps) {
  return (
    <div className="card p-3">
      <div className="fw-semibold">Contact</div>
      <div className="text-muted">{student?.email ?? 'contact@example.com'}</div>
    </div>
  )
}
