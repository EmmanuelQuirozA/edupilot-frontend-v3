import { ReactNode } from "react";

import './tabs.css';

export interface TabDefinition {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export interface TabsProps {
  tabs: TabDefinition[];
  activeKey: string;
  onSelect?: (key: string) => void;
  className?: string;
  navClassName?: string;
  actions?: ReactNode;
  renderActions?: (context: { activeKey: string }) => ReactNode;
  actionsClassName?: string;
}

const Tabs = ({
  tabs,
  activeKey,
  onSelect,
  className = '',
  navClassName = '',
  actions,
  renderActions,
  actionsClassName = '',
}: TabsProps) => {
  const actionContent =
    typeof renderActions === "function"
      ? renderActions({ activeKey })
      : actions;

  return (
    <div
      className={[
        "global-tabs d-flex flex-column flex-md-row gap-3 align-items-md-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <ul
        className={["nav nav-tabs global-tabs__nav gap-3 p-2 border-0", navClassName]
          .filter(Boolean)
          .join(" ")}
        role="tablist"
      >
        {tabs.map((tab) => {
          const isActive = tab.key === activeKey;
          const tabClassName = [
            "border-0",
            "nav-link",
            "global-tabs__link",
            isActive ? "active" : "",
            tab.className,
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <li key={tab.key} className="nav-item border-0" role="presentation">
              <button
                type="button"
                className={tabClassName}
                onClick={() => !isActive && onSelect?.(tab.key)}
                role="tab"
                aria-selected={isActive}
              >
                {tab.icon && (
                  <span className="me-2 d-inline-flex align-items-center">
                    {tab.icon}
                  </span>
                )}
                <span>{tab.label}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {actionContent && (
        <div
          className={["global-tabs__actions ms-md-auto", actionsClassName]
            .filter(Boolean)
            .join(" ")}
        >
          {actionContent}
        </div>
      )}
    </div>
  );
};

export default Tabs;
