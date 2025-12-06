import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'

interface TabConfig {
  key: string
  label: string
  content: ReactNode
}

interface TabbedSectionProps {
  tabs: TabConfig[]
}

export function TabbedSection({ tabs }: TabbedSectionProps) {
  const [activeKey, setActiveKey] = useState(() => tabs[0]?.key ?? '')

  const activeContent = useMemo(
    () => tabs.find((tab) => tab.key === activeKey)?.content ?? null,
    [activeKey, tabs],
  )

  return (
    <div className="card p-3">
      <div className="d-flex gap-2 mb-3 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`btn btn-sm ${tab.key === activeKey ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveKey(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{activeContent}</div>
    </div>
  )
}
