import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

interface TabConfig {
  key: string
  label: string
  content: ReactNode
}

interface TabbedSectionProps {
  tabs: TabConfig[]
  activeKey?: string
  onTabChange?: (key: string) => void
}

export function TabbedSection({ tabs, activeKey: controlledActiveKey, onTabChange }: TabbedSectionProps) {
  const [activeKey, setActiveKey] = useState(() => controlledActiveKey ?? tabs[0]?.key ?? '')
  const currentKey = controlledActiveKey ?? activeKey

  useEffect(() => {
    if (controlledActiveKey !== undefined) {
      setActiveKey(controlledActiveKey)
    }
  }, [controlledActiveKey])

  const activeContent = useMemo(
    () => tabs.find((tab) => tab.key === currentKey)?.content ?? null,
    [currentKey, tabs],
  )

  return (
    <div className="card p-3">
      <div className="d-flex gap-2 mb-3 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`btn btn-sm ${tab.key === currentKey ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => {
              setActiveKey(tab.key)
              onTabChange?.(tab.key)
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{activeContent}</div>
    </div>
  )
}
