import type { ReactNode } from "react";
import { createCurrencyFormatter } from "../../../utils/currencyFormatter";

interface PaymentEntry {
  amount: number;
  created_at: string;
  payment_id: number;
  payment_status_id: number;
  payment_status_name: string;
}

interface PaymentMonthData {
  payments: PaymentEntry[];
  total_amount: number;
  payment_month: string;
  payment_request_id: number | null;
}

interface TuitionPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentData?: PaymentMonthData | null;
  monthLabel: string;
  studentData?: {
    student?: string;
    class?: string;
    generation?: string;
    scholar_level_name?: string;
  };
}

const formatDate = (dateString: string): string => {
  if (!dateString) return "";

  const normalized = dateString.replace(/_/g, "-");
  const parsedDate = new Date(normalized);

  if (Number.isNaN(parsedDate.getTime())) return dateString;

  return parsedDate.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatPaymentMonth = (monthCode: string): string => {
  if (!monthCode) return "";

  const [year, month] = monthCode.split("_");
  if (!year || !month) return monthCode;

  const parsedDate = new Date(Number(year), Number(month) - 1, 1);
  if (Number.isNaN(parsedDate.getTime())) return monthCode;

  return parsedDate.toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  });
};

const InfoRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="d-flex flex-column mb-2">
    <span className="text-muted small">{label}</span>
    <span className="fw-semibold text-dark">{value || "-"}</span>
  </div>
);

export function TuitionPaymentModal({
  isOpen,
  onClose,
  paymentData,
  monthLabel,
  studentData,
}: TuitionPaymentModalProps) {
  if (!paymentData) return null;

  const currencyFormatter = createCurrencyFormatter("es-MX", "MXN");

  return (
    <>
      <div className="modal-backdrop fade show" />
      <div
        className={`modal fade ${isOpen ? "show d-block" : ""}`}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        onClick={onClose} // click outside closes modal
      >
        <div
          className="modal-dialog modal-lg modal-dialog-centered"
          onClick={(e) => e.stopPropagation()} // prevent close when clicking inside
        >
          <div className="modal-content">
            {/* HEADER */}
            <div className="modal-header">
              <div>
                <h5 className="modal-title fw-semibold">
                  Detalle de pagos de colegiatura
                </h5>
                <div className="text-muted small text-capitalize">
                  {formatPaymentMonth(paymentData.payment_month) || monthLabel}
                </div>
              </div>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={onClose}
              ></button>
            </div>

            {/* BODY */}
            <div className="modal-body">
              <div className="row g-3 mb-3">
                <div className="col-md-4">
                  <InfoRow label="Alumno" value={studentData?.student} />
                </div>
                <div className="col-md-4">
                  <InfoRow label="Grupo" value={studentData?.class} />
                </div>
                <div className="col-md-4">
                  <InfoRow label="Generación" value={studentData?.generation} />
                </div>
                <div className="col-md-4">
                  <InfoRow
                    label="Nivel Académico"
                    value={studentData?.scholar_level_name}
                  />
                </div>
                <div className="col-md-4">
                  <InfoRow
                    label="Mes de Pago"
                    value={formatPaymentMonth(paymentData.payment_month)}
                  />
                </div>
                <div className="col-md-4">
                  <InfoRow
                    label="Monto total"
                    value={currencyFormatter.format(paymentData.total_amount)}
                  />
                </div>
              </div>

              {/* PAYMENT REQUEST */}
              {paymentData.payment_request_id ? (
                <div className="d-flex justify-content-between align-items-center mb-3 p-3 border rounded">
                  <div>
                    <div className="text-muted small">Solicitud de pago</div>
                    <div className="fw-semibold">
                      {paymentData.payment_request_id}
                    </div>
                  </div>
                  <button type="button" className="btn btn-outline-primary btn-sm">
                    Ver solicitud de pago
                  </button>
                </div>
              ) : null}

              {/* TABLE */}
              <h6 className="fw-semibold mb-2">Pagos registrados</h6>
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th className="text-muted small text-uppercase">ID</th>
                      <th className="text-muted small text-uppercase">Fecha</th>
                      <th className="text-muted small text-uppercase">Monto</th>
                      <th className="text-muted small text-uppercase">Estatus</th>
                      <th className="text-muted small text-uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentData.payments?.length ? (
                      paymentData.payments.map((payment) => (
                        <tr key={payment.payment_id}>
                          <td className="fw-semibold">{payment.payment_id}</td>
                          <td className="text-muted">
                            {formatDate(payment.created_at)}
                          </td>
                          <td className="fw-semibold text-dark">
                            {currencyFormatter.format(payment.amount)}
                          </td>
                          <td className="text-muted">
                            {payment.payment_status_name}
                          </td>
                          <td>
                            <button className="btn btn-link p-0">
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

            {/* FOOTER */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
