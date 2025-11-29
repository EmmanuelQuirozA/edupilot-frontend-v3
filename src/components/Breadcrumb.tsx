import './Breadcrumb.css'

export interface BreadcrumbItem {
  label: string
  onClick?: () => void
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  if (!items.length) return null

  return (
    <nav aria-label="Breadcrumb" className="breadcrumb-container">
      <ol className="breadcrumb mb-0">
        {items.map((item, index) => (
          <li key={item.label} className={`breadcrumb-item ${index === items.length - 1 ? 'active' : ''}`} aria-current={index === items.length - 1 ? 'page' : undefined}>
            {item.onClick && index !== items.length - 1 ? (
              <button type="button" className="btn btn-link p-0 breadcrumb-link" onClick={item.onClick}>
                {item.label}
              </button>
            ) : (
              <span>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
