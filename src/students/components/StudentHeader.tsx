import type { Student } from '../types'

interface StudentHeaderProps {
  student: Student | null
  isLoading: boolean
}

export function StudentHeader({ student, isLoading }: StudentHeaderProps) {
  if (isLoading) {
    return <div className="card p-3">Loading student...</div>
  }

  return (
    <div className="card p-3">
      <div className="d-flex align-items-center gap-2">
        <div className="fw-bold">{student ? `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim() || 'Student' : 'Student'}</div>
      </div>
    </div>
  )
}
