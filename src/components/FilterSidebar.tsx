import { useEffect, useMemo, useState, type ReactNode } from 'react'
import './FilterSidebar.css'

type FilterFieldType = 'text' | 'select' | 'checkbox'

interface FilterOption {
  label: string
  value: string
}

export interface FilterField {
  key: string
  label: string
  placeholder?: string
  type: FilterFieldType
  options?: FilterOption[]
  helperText?: string
}

type FilterValue = string | boolean

export type FilterValues = Record<string, FilterValue>

interface FilterSidebarProps {
  title: string
  subtitle?: string
  isOpen: boolean
  onClose: () => void
  onClear: (values?: FilterValues) => void
  onApply: (values?: FilterValues) => void
  children?: ReactNode
  fields?: FilterField[]
  initialValues?: Partial<FilterValues>
}

const buildInitialValues = (fields?: FilterField[], initialValues?: Partial<FilterValues>): FilterValues => {
  if (!fields) return {}

  return fields.reduce<FilterValues>((accumulator, field) => {
    const fallbackValue = field.type === 'checkbox' ? false : ''
    return { ...accumulator, [field.key]: initialValues?.[field.key] ?? fallbackValue }
  }, {})
}

export function FilterSidebar({
  title,
  subtitle,
  isOpen,
  onClose,
  onClear,
  onApply,
  children,
  fields,
  initialValues,
}: FilterSidebarProps) {
  const hasDynamicFields = Boolean(fields?.length)
  const defaultValues = useMemo(() => buildInitialValues(fields, initialValues), [fields, initialValues])
  const [values, setValues] = useState<FilterValues>(defaultValues)

  useEffect(() => {
    setValues(defaultValues)
  }, [defaultValues])

  const handleFieldChange = (key: string, value: FilterValue) => {
    setValues((previous) => ({ ...previous, [key]: value }))
  }

  const handleClear = () => {
    if (hasDynamicFields) {
      setValues(defaultValues)
      onClear(defaultValues)
    } else {
      onClear()
    }
  }

  const handleApply = () => {
    if (hasDynamicFields) {
      onApply(values)
    } else {
      onApply()
    }
  }

  const renderDynamicFields = () => {
    if (!fields?.length) return null

    return fields.map((field) => {
      if (field.type === 'checkbox') {
        const checked = Boolean(values[field.key])
        return (
          <label key={field.key} className="filter-sidebar__checkbox">
            <input
              type="checkbox"
              checked={checked}
              onChange={(event) => handleFieldChange(field.key, event.target.checked)}
            />
            <div>
              <span className="filter-sidebar__checkbox-label">{field.label}</span>
              {field.helperText ? <p className="filter-sidebar__hint">{field.helperText}</p> : null}
            </div>
          </label>
        )
      }

      if (field.type === 'select') {
        return (
          <div key={field.key} className="filter-sidebar__field">
            <label htmlFor={field.key}>{field.label}</label>
            <select
              id={field.key}
              className="form-select"
              value={(values[field.key] as string) ?? ''}
              onChange={(event) => handleFieldChange(field.key, event.target.value)}
            >
              <option value="">{field.placeholder ?? 'Selecciona una opción'}</option>
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {field.helperText ? <p className="filter-sidebar__hint">{field.helperText}</p> : null}
          </div>
        )
      }

      return (
        <div key={field.key} className="filter-sidebar__field">
          <label htmlFor={field.key}>{field.label}</label>
          <input
            id={field.key}
            className="form-control"
            placeholder={field.placeholder}
            value={(values[field.key] as string) ?? ''}
            onChange={(event) => handleFieldChange(field.key, event.target.value)}
          />
          {field.helperText ? <p className="filter-sidebar__hint">{field.helperText}</p> : null}
        </div>
      )
    })
  }

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

        <div className="filter-sidebar__content">{hasDynamicFields ? renderDynamicFields() : children}</div>

        <div className="filter-sidebar__footer">
          <button type="button" className="filter-sidebar__ghost" onClick={handleClear}>
            Borrar filtros
          </button>
          <button type="button" className="filter-sidebar__primary" onClick={handleApply}>
            Filtrar
          </button>
        </div>
      </aside>
    </>
  )
}
