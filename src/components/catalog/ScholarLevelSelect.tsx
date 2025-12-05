import type { CatalogSelectProps } from './CatalogSelect'
import CatalogSelect from './CatalogSelect'

const ScholarLevelSelect = (props: Omit<CatalogSelectProps, 'endpoint'>) => (
  <CatalogSelect
    endpoint="catalog/scholar-levels"
    placeholder="Selecciona un nivel escolar"
    {...props}
  />
)

export default ScholarLevelSelect
