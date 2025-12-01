import type { ReactNode } from 'react'
import './FilterSidebar.css'

interface FilterSidebarProps {
  title: string
  subtitle?: string
  isOpen: boolean
  onClose: () => void
  onClear: () => void
  onApply: () => void
  children: ReactNode
}

export function FilterSidebar({ title, subtitle, isOpen, onClose, onClear, onApply, children }: FilterSidebarProps) {
  return (
    <>
      <div className={`filter-overlay ${isOpen ? 'filter-overlay--visible' : ''}`} onClick={onClose} aria-hidden={!isOpen} />

      <aside className={`filter-sidebar ${isOpen ? 'filter-sidebar--open' : ''}`} aria-hidden={!isOpen} aria-label={title}>
        <div className="filter-sidebar__header">
          <div>
            <p className="filter-sidebar__eyebrow">Filtros</p>
            <h3 className="filter-sidebar__title">{title}</h3>
            {subtitle ? <p className="filter-sidebar__subtitle">{subtitle}</p> : null}
          </div>
          <button type="button" className="filter-sidebar__close" onClick={onClose} aria-label="Cerrar filtros">
            ✕
          </button>
        </div>

        <div className="filter-sidebar__content">{children}</div>

        <div className="filter-sidebar__footer">
          <button type="button" className="filter-sidebar__ghost" onClick={onClear}>
            Borrar filtros
          </button>
          <button type="button" className="filter-sidebar__primary" onClick={onApply}>
            Filtrar
          </button>
        </div>
      </aside>
    </>
  )
}
