import type { CatalogSelectProps } from './CatalogSelect'
import CatalogSelect from './CatalogSelect'

const PaymentConceptSelect = (props: Omit<CatalogSelectProps, 'endpoint'>) => (
  <CatalogSelect
    endpoint="catalog/payment-concepts"
    placeholder="Selecciona un concepto de pago"
    {...props}
  />
)

export default PaymentConceptSelect
