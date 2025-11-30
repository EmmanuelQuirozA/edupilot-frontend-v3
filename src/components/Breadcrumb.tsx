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
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        {items.map((item, index) => {
          const label = item?.label ?? '';
          const isCurrent = index === items.length - 1;
          const key = `${label}-${index}`;

          if (isCurrent || typeof item.onClick !== 'function') {
            return (
              <li key={key} className={isCurrent ? 'is-current' : undefined} aria-current={isCurrent ? 'page' : undefined}>
                <span>{label}</span>
              </li>
            );
          }

          return (
            <li key={key}>
              <button type="button" onClick={item.onClick}>
                {label}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  )
}
