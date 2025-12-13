import { useEffect, useMemo, useState } from 'react'
import PaymentConceptSelect from '../catalog/PaymentConceptSelect'
import PaymentThroughSelect from '../catalog/PaymentThroughSelect'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { API_BASE_URL } from '../../config'
import { createCurrencyFormatter } from '../../utils/currencyFormatter'
import './payment-registration-modal.css'

declare const Swal: any

export interface PaymentRequestSummary {
  tuitionLabel: string
  conceptName: string
  pendingAmount: number
  isPartialPayment: boolean
}

export interface PaymentRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  studentId: number
  paymentRequestId?: number
  defaultPaymentMonth?: string
  defaultPaymentConceptId?: number
  defaultPaymentThroughId?: number
  requestSummary?: PaymentRequestSummary
  lang?: string
  onSuccess?: () => void
  title?: string
  description?: string
}

interface PaymentFormState {
  amount: string
  paymentMonth: string
  paymentConceptId: number | ''
  paymentThroughId: number | ''
  comments: string
  receipt: File | null
}

const PENDING_COMPARISON_DELTA = 0.01

const formatMonthLabel = (value?: string) => {
  if (!value) return '-'
  const parsed = new Date(`${value}-01`)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
}

const buildJsonPart = (payload: Record<string, unknown>) =>
  new Blob([JSON.stringify(payload)], { type: 'application/json' })

export function PaymentRegistrationModal({
  isOpen,
  onClose,
  studentId,
  paymentRequestId,
  defaultPaymentConceptId,
  defaultPaymentMonth,
  defaultPaymentThroughId,
  requestSummary,
  lang = 'es',
  onSuccess,
  title,
  description,
}: PaymentRegistrationModalProps) {
  const { token } = useAuth()
  const { t } = useLanguage()
  const [form, setForm] = useState<PaymentFormState>({
    amount: '',
    paymentMonth: defaultPaymentMonth || '',
    paymentConceptId: defaultPaymentConceptId ?? '',
    paymentThroughId: defaultPaymentThroughId ?? '',
    comments: '',
    receipt: null,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const currencyFormatter = useMemo(
    () => createCurrencyFormatter('es-MX', 'MXN'),
    [],
  )

  const hasPaymentRequestContext = Boolean(requestSummary)
  const requireFullPendingPayment = !!requestSummary && !requestSummary.isPartialPayment
  const resolvedTitle = title ?? t('registerPaymentTitle')
  const resolvedDescription = description ?? t('registerPaymentDescription')

  useEffect(() => {
    if (!isOpen) return

    const pendingAmount = requestSummary?.pendingAmount ?? null

    setForm({
      amount: pendingAmount !== null
        ? pendingAmount.toFixed(2)
        : '',
      paymentMonth: defaultPaymentMonth || '',
      paymentConceptId: defaultPaymentConceptId ?? '',
      paymentThroughId: defaultPaymentThroughId ?? '',
      comments: '',
      receipt: null,
    })
    setError(null)
    setSuccessMessage(null)
  }, [
    defaultPaymentConceptId,
    defaultPaymentMonth,
    defaultPaymentThroughId,
    isOpen,
    requestSummary,
    requireFullPendingPayment,
  ])

  const handleChange = <K extends keyof PaymentFormState>(
    field: K,
    value: PaymentFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const validateAmount = (amountValue: number) => {
    if (!amountValue || Number.isNaN(amountValue)) {
      return t('enterValidAmount')
    }

    if (requireFullPendingPayment) {
      const difference = Math.abs(amountValue - requestSummary.pendingAmount)
      if (difference > PENDING_COMPARISON_DELTA) {
        return t('amountMustCoverPending')
      }
    }

    return null
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccessMessage(null)

    const amountValue = Number(form.amount)
    const validationError = validateAmount(amountValue)
    if (validationError) {
      setError(validationError)
      return
    }

    if (!form.paymentThroughId) {
      setError(t('paymentMethodRequired'))
      return
    }

    if (!token) {
      setError(t('noActiveSession'))
      return
    }

    const payload = {
      student_id: studentId,
      payment_concept_id: form.paymentConceptId || defaultPaymentConceptId || undefined,
      payment_month: form.paymentMonth,
      amount: amountValue.toString(),
      comments: form.comments,
      payment_through_id: form.paymentThroughId,
      payment_request_id: paymentRequestId,
    }

    const formData = new FormData()
    formData.append('request', buildJsonPart(payload))
    if (form.receipt) {
      formData.append('receipt', form.receipt)
    }

    setSubmitting(true)
    try {
      const params = new URLSearchParams({ lang })
      const response = await fetch(`${API_BASE_URL}/payments/create?${params.toString()}` as string, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || t('paymentRegisterError'))
      }

      const result = await response.json()

      if (!result?.success) {
        Swal.fire({
          icon: 'error',
          title: result?.title || t('defaultError'),
          text: result?.message || t('defaultError'),
        })
        return
      }

      Swal.fire({
        icon: 'success',
        title: result?.title || '',
        text: result?.message || '',
      })

      setSuccessMessage(t('paymentRegisterSuccess'))
      onSuccess?.()
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : t('paymentRegisterUnexpected')
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  const tuitionLabel = requestSummary?.tuitionLabel ?? formatMonthLabel(defaultPaymentMonth)

  return (
    <>
      <div className="modal-backdrop fade show" />
      <div
        className={`modal fade ${isOpen ? 'show d-block' : ''}`}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        onClick={onClose}
      >
        <div
          className="modal-dialog modal-lg modal-dialog-centered"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h5 className="modal-title fw-semibold">{resolvedTitle}</h5>
                <p className="mb-0 text-muted">{resolvedDescription}</p>
              </div>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={onClose}
              />
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {requestSummary && (
                  <div className="payment-summary-card mb-3">
                    <div className="payment-summary-card__header">
                      <div>
                        <div className="text-muted small">{t('tuition') || 'Colegiatura'}</div>
                        <div className="fw-semibold text-capitalize">
                          {tuitionLabel}
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="text-muted small">{t('concept')}</div>
                        <div className="fw-semibold">{requestSummary.conceptName}</div>
                      </div>
                    </div>
                    <div className="payment-summary-card__body">
                      <div>
                        <span className="text-muted small d-block">{t('partialPayment')}</span>
                        <span className="fw-semibold">
                          {requestSummary.isPartialPayment ? t('yes') : t('no')}
                        </span>
                      </div>
                      <div className="text-end">
                        <span className="text-muted small d-block">{t('pendingPayment')}</span>
                        <span className="fw-semibold text-primary">
                          {currencyFormatter.format(requestSummary.pendingAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">{t('amount')}</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={form.amount}
                      onChange={(e) => handleChange('amount', e.target.value)}
                      className="form-control"
                      required
                      readOnly={Boolean(requireFullPendingPayment)}
                    />
                    {requireFullPendingPayment && (
                      <small className="text-muted">{t('amountMustCoverPending')}</small>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">{t('paymentThrough')}</label>
                    <PaymentThroughSelect
                      value={form.paymentThroughId}
                      onChange={(value) => handleChange('paymentThroughId', value)}
                      required
                    />
                  </div>
                  {!hasPaymentRequestContext && (
                    <>
                      <div className="col-md-6">
                        <label className="form-label">{t('paymentType')}</label>
                        <PaymentConceptSelect
                          value={form.paymentConceptId}
                          onChange={(value) => handleChange('paymentConceptId', value)}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">{t('paymentMonth')}</label>
                        <input
                          type="month"
                          value={form.paymentMonth}
                          onChange={(e) => handleChange('paymentMonth', e.target.value)}
                          className="form-control"
                        />
                      </div>
                    </>
                  )}
                  <div className="col-12">
                    <label className="form-label">{t('comments')}</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={form.comments}
                      onChange={(e) => handleChange('comments', e.target.value)}
                      placeholder={t('addAdditionalInformation')}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">{t('receipt')}</label>
                    <label className="payment-file-drop w-100" htmlFor="payment-receipt">
                      <span className="text-muted">{t('uploadReceipt')}</span>
                      <input
                        id="payment-receipt"
                        type="file"
                        className="d-none"
                        onChange={(event) => {
                          const [file] = Array.from(event.target.files || [])
                          handleChange('receipt', file || null)
                        }}
                        accept="image/*,application/pdf"
                      />
                    </label>
                    {form.receipt && (
                      <div className="small text-muted mt-1">
                        {t('selectedFile')}: {form.receipt.name}
                      </div>
                    )}
                  </div>
                </div>

                {error && <div className="alert alert-danger mt-3">{error}</div>}
                {successMessage && (
                  <div className="alert alert-success mt-3">{successMessage}</div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={submitting}
                >
                  {t('cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? t('registeringPayment') : t('registerPayment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

export function RequestPaymentModal(
  props: Omit<PaymentRegistrationModalProps, 'title' | 'description' | 'requestSummary'> & {
    requestSummary: PaymentRequestSummary
  },
) {
  return (
    <PaymentRegistrationModal
      {...props}
      requestSummary={props.requestSummary}
    />
  )
}

export function StandalonePaymentModal(
  props: PaymentRegistrationModalProps,
) {
  return (
    <PaymentRegistrationModal
      {...props}
    />
  )
}

export default PaymentRegistrationModal
