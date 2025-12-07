import type { ReactNode } from 'react'

export interface TabItem {
  key: string
  label: string
  content: ReactNode
}

interface TabsProps {
  items: TabItem[]
  activeKey: string
  onChange: (key: string) => void
}

export function Tabs({ items, activeKey, onChange }: TabsProps) {
  return (
    <div className="d-flex flex-column gap-3">
      <div className="d-flex gap-2 flex-wrap">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`btn ${activeKey === item.key ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => onChange(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div>{items.find((item) => item.key === activeKey)?.content}</div>
    </div>
  )
}
