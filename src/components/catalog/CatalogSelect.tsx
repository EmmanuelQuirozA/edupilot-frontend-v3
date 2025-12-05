import type { ChangeEvent, SelectHTMLAttributes } from 'react'
import useCatalogOptions, { type CatalogOption } from '../../hooks/useCatalogOptions'
import './catalog-select.css'

export interface CatalogSelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'> {
  lang?: string
  value?: number | ''
  onChange?: (value: number | '') => void
  placeholder?: string
  includePlaceholder?: boolean
  endpoint: string
  wrapperClassName?: string
}

const CatalogSelect = ({
  endpoint,
  lang = 'es',
  value = '',
  onChange,
  placeholder = 'Selecciona una opción',
  includePlaceholder = true,
  className = '',
  wrapperClassName = '',
  disabled,
  ...selectProps
}: CatalogSelectProps) => {
  const { options, loading, error } = useCatalogOptions(endpoint, lang)

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value
    const parsedValue = selectedValue === '' ? '' : Number(selectedValue)

    onChange?.(parsedValue)
  }

  const renderOption = (option: CatalogOption) => (
    <option key={option.id} value={option.id}>
      {option.name}
    </option>
  )

  const combinedClassName = ['form-control', className].filter(Boolean).join(' ')
  const combinedWrapperClassName = ['catalog-select', wrapperClassName].filter(Boolean).join(' ')

  return (
    <div className={combinedWrapperClassName}>
      <select
        className={combinedClassName}
        value={value}
        onChange={handleChange}
        disabled={disabled || loading}
        {...selectProps}
      >
        {includePlaceholder && (
          <option value="">
            {loading ? 'Cargando opciones...' : placeholder}
          </option>
        )}

        {options.map(renderOption)}
      </select>

      {error && <p className="catalog-select__error">{error}</p>}
    </div>
  )
}

export default CatalogSelect
