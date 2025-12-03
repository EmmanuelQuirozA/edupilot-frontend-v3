import type { ReactNode } from 'react'
import { createCurrencyFormatter } from '../../../utils/currencyFormatter'
import './TuitionPaymentModal.css'

interface PaymentEntry {
  amount: number
  created_at: string
  payment_id: number
  payment_status_id: number
  payment_status_name: string
}

interface PaymentMonthData {
  payments: PaymentEntry[]
  total_amount: number
  payment_month: string
  payment_request_id: number | null
}

interface TuitionPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  paymentData?: PaymentMonthData | null
  monthLabel: string
  studentData?: {
    student?: string
    class?: string
    generation?: string
    scholar_level_name?: string
  }
}

const formatDate = (dateString: string): string => {
  if (!dateString) return ''

  const normalized = dateString.replace(/_/g, '-')
  const parsedDate = new Date(normalized)

  if (Number.isNaN(parsedDate.getTime())) return dateString

  return parsedDate.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const formatPaymentMonth = (monthCode: string): string => {
  if (!monthCode) return ''

  const [year, month] = monthCode.split('_')
  if (!year || !month) return monthCode

  const parsedDate = new Date(Number(year), Number(month) - 1, 1)
  if (Number.isNaN(parsedDate.getTime())) return monthCode

  return parsedDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
}

const InfoRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="tuition-modal__info">
    <div className="text-muted small">{label}</div>
    <div className="fw-semibold text-dark">{value || '-'} </div>
  </div>
)

export function TuitionPaymentModal({
  isOpen,
  onClose,
  paymentData,
  monthLabel,
  studentData,
}: TuitionPaymentModalProps) {
  if (!isOpen || !paymentData) return null

  const currencyFormatter = createCurrencyFormatter('es-MX', 'MXN')

  return (
    <div className="tuition-modal__backdrop">
      <div className="tuition-modal" role="dialog" aria-modal="true">
        <div className="tuition-modal__header">
          <div>
            <div className="tuition-modal__title">Detalle de pagos de colegiatura</div>
            <div className="text-muted small text-capitalize">
              {formatPaymentMonth(paymentData.payment_month) || monthLabel}
            </div>
          </div>
          <button type="button" className="btn btn-link text-decoration-none" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <div className="tuition-modal__body">
          <div className="tuition-modal__info-grid">
            <InfoRow label="Alumno" value={studentData?.student} />
            <InfoRow label="Grupo" value={studentData?.class} />
            <InfoRow label="Generación" value={studentData?.generation} />
            <InfoRow label="Nivel Académico" value={studentData?.scholar_level_name} />
            <InfoRow label="Mes de Pago" value={formatPaymentMonth(paymentData.payment_month)} />
            <InfoRow label="Monto total" value={currencyFormatter.format(paymentData.total_amount)} />
          </div>

          {paymentData.payment_request_id ? (
            <div className="tuition-modal__request">
              <div>
                <div className="text-muted small">Solicitud de pago</div>
                <div className="fw-semibold">{paymentData.payment_request_id}</div>
              </div>
              <button type="button" className="btn btn-outline-primary btn-sm">
                Ver solicitud de pago
              </button>
            </div>
          ) : null}

          <div className="tuition-modal__section">
            <div className="fw-semibold mb-2">Pagos registrados</div>
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th scope="col" className="text-muted small fw-semibold text-uppercase">ID de pago</th>
                    <th scope="col" className="text-muted small fw-semibold text-uppercase">Fecha</th>
                    <th scope="col" className="text-muted small fw-semibold text-uppercase">Monto</th>
                    <th scope="col" className="text-muted small fw-semibold text-uppercase">Estatus</th>
                    <th scope="col" className="text-muted small fw-semibold text-uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentData.payments?.length ? (
                    paymentData.payments.map((payment) => (
                      <tr key={payment.payment_id}>
                        <td className="fw-semibold">{payment.payment_id}</td>
                        <td className="text-muted">{formatDate(payment.created_at)}</td>
                        <td className="fw-semibold text-dark">
                          {currencyFormatter.format(payment.amount)}
                        </td>
                        <td className="text-muted">{payment.payment_status_name}</td>
                        <td>
                          <button type="button" className="btn btn-link p-0">
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center text-muted">
                        No hay pagos registrados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
