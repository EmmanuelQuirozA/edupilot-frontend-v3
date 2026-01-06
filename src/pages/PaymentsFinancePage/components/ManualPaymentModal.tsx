import { useCallback, useEffect, useMemo, useState } from 'react'
import PaymentConceptSelect from '../../../components/catalog/PaymentConceptSelect'
import PaymentThroughSelect from '../../../components/catalog/PaymentThroughSelect'
import StudentSearchDropdown, { type StudentSearchItem } from '../../../components/StudentSearchDropdown'
import { API_BASE_URL } from '../../../config'
import { useAuth } from '../../../context/AuthContext'
import { useLanguage } from '../../../context/LanguageContext'
import { createCurrencyFormatter } from '../../../utils/currencyFormatter'
import { useCatalogOptions } from '../../../hooks/useCatalogOptions'
import { usePaymentReceiptPrinter } from '../../../hooks/usePaymentReceiptPrinter'
import { buildSchoolAddress, fetchSchoolDetails, resolveSchoolName } from '../../../utils/schoolDetails'
import { formatMexicoCityDateTime, formatMonthLabel } from '../../../utils/receipt/buildPaymentReceipt'

declare const Swal: {
  fire: (options: Record<string, unknown>) => Promise<{ isConfirmed?: boolean }>
}

interface ManualPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  lang?: string
}

interface ManualPaymentFormState {
  student: StudentSearchItem | null
  amount: string
  paymentMonth: string
  paymentConceptId: number | ''
  paymentThroughId: number | ''
  comments: string
  receipt: File | null
}

const buildJsonPart = (payload: Record<string, unknown>) =>
  new Blob([JSON.stringify(payload)], { type: 'application/json' })

export function ManualPaymentModal({ isOpen, lang = 'es', onClose, onSuccess }: ManualPaymentModalProps) {
  const { token, user } = useAuth()
  const { t, locale } = useLanguage()
  const [form, setForm] = useState<ManualPaymentFormState>({
    student: null,
    amount: '',
    paymentMonth: '',
    paymentConceptId: '',
    paymentThroughId: '',
    comments: '',
    receipt: null,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const shouldShowPaymentMonth = form.paymentConceptId === 1
  const [schoolDetails, setSchoolDetails] = useState<Awaited<ReturnType<typeof fetchSchoolDetails>> | null>(null)
  const { options: paymentThroughOptions } = useCatalogOptions('catalog/payment-through', lang)
  const { options: paymentConceptOptions } = useCatalogOptions('catalog/payment-concepts', lang)
  const { promptAndPrintReceipt } = usePaymentReceiptPrinter()

  const currencyFormatter = useMemo(
    () => createCurrencyFormatter('es-MX', 'MXN'),
    [],
  )

  useEffect(() => {
    if (!isOpen) return

    setForm({
      student: null,
      amount: '',
      paymentMonth: '',
      paymentConceptId: '',
      paymentThroughId: '',
      comments: '',
      receipt: null,
    })
    setError(null)
    setSuccessMessage(null)
  }, [isOpen])

  const handleChange = <K extends keyof ManualPaymentFormState>(field: K, value: ManualPaymentFormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handlePaymentConceptChange = (value: number | '') => {
    setForm((prev) => ({
      ...prev,
      paymentConceptId: value,
      paymentMonth: value === 1 ? prev.paymentMonth : '',
    }))
  }

  const ensureSchoolDetails = useCallback(async () => {
    if (schoolDetails) return schoolDetails
    if (!user?.school_id || !token) return null

    try {
      const fetched = await fetchSchoolDetails({
        schoolId: user.school_id,
        token,
        lang,
      })
      setSchoolDetails(fetched)
      return fetched
    } catch (fetchError) {
      console.error('Failed to fetch school details', fetchError)
      return null
    }
  }, [lang, schoolDetails, token, user?.school_id])

  const resolveCatalogName = useCallback(
    (id: number | '', options: { id: number; name: string }[]) => {
      if (!id) return ''
      const match = options.find((option) => option.id === id)
      return match?.name ?? ''
    },
    [],
  )

  const resolvePaymentThroughName = useCallback(
    () => resolveCatalogName(form.paymentThroughId, paymentThroughOptions),
    [form.paymentThroughId, paymentThroughOptions, resolveCatalogName],
  )

  const resolveConceptName = useCallback(
    () => resolveCatalogName(form.paymentConceptId, paymentConceptOptions),
    [form.paymentConceptId, paymentConceptOptions, resolveCatalogName],
  )

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (!form.student) {
      setError(t('studentRequired'))
      return
    }

    const amountValue = Number(form.amount)
    if (!amountValue || Number.isNaN(amountValue) || amountValue <= 0) {
      setError(t('enterValidAmount'))
      return
    }

    if (!form.paymentConceptId) {
      setError(t('paymentConceptRequired'))
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

    const payload: Record<string, string | number> = {
      student_id: form.student.student_id,
      payment_concept_id: form.paymentConceptId,
      amount: amountValue.toString(),
      comments: form.comments,
      payment_through_id: form.paymentThroughId,
    }

    if (shouldShowPaymentMonth && form.paymentMonth) {
      payload.payment_month = form.paymentMonth
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
      const resolvedSchoolDetails = await ensureSchoolDetails()
      const schoolName = resolveSchoolName(resolvedSchoolDetails, user?.school_name || '-')
      const address = buildSchoolAddress(resolvedSchoolDetails) || '-'
      const phone = resolvedSchoolDetails?.phone_number || '-'
      const conceptName = resolveConceptName() || '-'
      const paymentThroughName = resolvePaymentThroughName() || '-'
      const studentName = form.student?.full_name || '-'
      const scholarLevel = form.student?.scholar_level_name || '-'
      const gradeGroup = form.student?.grade_group || '-'
      const reference = form.student?.payment_reference || '-'
      const monthLabel = shouldShowPaymentMonth ? formatMonthLabel(form.paymentMonth) || '-' : '-'
      const cycleLabel = form.student?.generation ? form.student.generation.slice(-12) : '-'
      const comments = (form.comments || '').trim() || '-'
      const paymentDateLabel = formatMexicoCityDateTime()
      const amountText = currencyFormatter.format(amountValue)

      await promptAndPrintReceipt({
        school: {
          name: schoolName,
          address,
          phone,
        },
        payment: {
          conceptLabel: conceptName,
          studentName,
          scholarLevel,
          gradeGroup,
          paymentMethodLabel: paymentThroughName,
          paymentDateLabel,
          reference,
          monthLabel,
          cycleLabel,
          comments,
          amountText,
        },
        now: new Date(),
      })
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : t('paymentRegisterUnexpected')
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="modal-backdrop fade show" />
      <div className={`modal fade ${isOpen ? 'show d-block' : ''}`} tabIndex={-1} role="dialog" aria-modal="true" onClick={onClose}>
        <div className="modal-dialog modal-lg modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h5 className="modal-title fw-semibold">{t('createManualPayment')}</h5>
                <p className="mb-0 text-muted">{t('createManualPaymentDescription')}</p>
              </div>
              <button type="button" className="btn-close" aria-label={t('close')} onClick={onClose} />
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-12">
                    <StudentSearchDropdown
                      label={t('student')}
                      placeholder={t('searchStudentByName')}
                      lang={locale}
                      onSelect={(student) => handleChange('student', student)}
                      value={form.student ? [form.student] : []}
                      onClear={() => handleChange('student', null)}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">{t('amount')}</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={form.amount}
                      onChange={(e) => handleChange('amount', e.target.value)}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">{t('paymentThrough')}</label>
                    <PaymentThroughSelect
                      value={form.paymentThroughId}
                      onChange={(value) => handleChange('paymentThroughId', value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">{t('paymentType')}</label>
                    <PaymentConceptSelect
                      value={form.paymentConceptId}
                      onChange={handlePaymentConceptChange}
                      className="form-select"
                    />
                  </div>
                  {shouldShowPaymentMonth && (
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">{t('paymentMonth')}</label>
                      <input
                        type="month"
                        value={form.paymentMonth}
                        onChange={(e) => handleChange('paymentMonth', e.target.value)}
                        className="form-control"
                      />
                    </div>
                  )}
                  <div className="col-12">
                    <label className="form-label fw-semibold">{t('comments')}</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={form.comments}
                      onChange={(e) => handleChange('comments', e.target.value)}
                      placeholder={t('addAdditionalInformation')}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">{t('receipt')}</label>
                    <label className="payment-file-drop w-100" htmlFor="manual-payment-receipt">
                      <span className="text-muted">{t('uploadReceipt')}</span>
                      <input
                        id="manual-payment-receipt"
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
                {successMessage && <div className="alert alert-success mt-3">{successMessage}</div>}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
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

export default ManualPaymentModal
