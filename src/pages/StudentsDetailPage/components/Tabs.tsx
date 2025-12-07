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
      <div className="d-flex  gap-4 my-2 border-b border-gray-200">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`tab-pill p-2 fw-light ${activeKey === item.key ? 'active' : ''}`}
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
