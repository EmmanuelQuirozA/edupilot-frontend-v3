import type { CatalogSelectProps } from './CatalogSelect'
import CatalogSelect from './CatalogSelect'

const PaymentThroughSelect = (props: Omit<CatalogSelectProps, 'endpoint'>) => (
  <CatalogSelect
    endpoint="catalog/payment-through"
    placeholder="Selecciona un método de pago"
    {...props}
  />
)

export default PaymentThroughSelect
