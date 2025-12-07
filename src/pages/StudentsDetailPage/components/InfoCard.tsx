import type { ReactNode } from 'react'

interface InfoCardProps {
  title?: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export function InfoCard({ 
  title,
  subtitle,
  actions,
  children,
  className 
}: InfoCardProps) {
  return (
    <div className={`card shadow-sm border-0 ${className ?? ''}`.trim()}>
      {(title || subtitle || actions) ? (
        <div className="card-header bg-white border-0 d-flex flex-wrap align-items-start justify-content-between gap-2">
          <div>
            {title ? <h6 className="mb-1 text-uppercase fw-semibold text-muted">{title}</h6> : null}
            {subtitle ? <p className="mb-0 text-muted small">{subtitle}</p> : null}
          </div>
          {actions ? <div className="ms-auto d-flex align-items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className="card-body">{children}</div>
    </div>
  )
}
