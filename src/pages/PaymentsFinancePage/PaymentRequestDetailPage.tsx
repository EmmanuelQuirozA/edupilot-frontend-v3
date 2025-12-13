import { useCallback, useEffect, useMemo, useState } from 'react'
import { Layout } from '../../layout/Layout'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import type { BreadcrumbItem } from '../../components/Breadcrumb'
import { LoadingSkeleton } from '../../components/LoadingSkeleton'
import { NoPermission } from '../../components/NoPermission'
import { API_BASE_URL } from '../../config'
import { formatDate } from '../../utils/formatDate'
import { useModulePermissions } from '../../hooks/useModulePermissions'
import { RequestPaymentModal } from '../../components/payments/PaymentRegistrationModal'

interface PaymentRequestDetailPageProps {
  onNavigate: (path: string) => void
  paymentRequestId: number
}

interface StudentInfo {
  user_id: number
  student_id: number
  register_id: number | null
  payment_reference: string | null
  email: string | null
  full_name: string
  address: string | null
  generation: string | null
  grade_group: string | null
  scholar_level_name: string | null
  phone_number: string | null
}

interface PaymentRequestInfo {
  payment_request_id: number
  pr_amount: number
  pr_created_at: string
  pr_pay_by: string
  pr_comments: string | null
  late_fee: number
  fee_type: string
  late_fee_frequency: number
  payment_month: string | null
  payment_status_id: number
  partial_payment_transformed: string
  partial_payment: boolean
  mass_upload: number
  pr_payment_status_id: number | null
  ps_pr_name: string
  pt_name: string
  payment_concept_id?: number | null
  closed_at: string | null
}

interface PaymentEntry {
  payment_id: number
  payment_month: string | null
  amount: number
  payment_status_id: number
  validated_at: string | null
  pay_created_at: string
  payment_date: string
  updated_at: string
  comments: string | null
  pt_name: string
  payment_status_name: string
  validator_full_name: string | null
  validator_phone_number: string | null
  validator_username: string | null
}

interface PaymentInfoSummary {
  totalPaid: number
  latePeriods: number
  lateFeeTotal: number
  accumulatedFees: number
  pendingPayment: number
}

interface BreakdownEntry {
  payment_id: number | null
  type: 'initial_payment_request' | 'late_fee' | 'payment'
  payment_status_id: number | null
  status_name: string | null
  date: string
  amount: number
  balance: number
}

interface PaymentLogChange {
  field: string | null
  from: string | null
  to: string | null
  comments: string | null
}

interface PaymentLog {
  payment_request_id: number
  responsable_user_id: number
  responsable_full_name: string
  role_name: string
  updated_at: string
  log_type_name: string
  changes: PaymentLogChange[]
}

interface PaymentRequestDetailResponse {
  student: StudentInfo
  paymentRequest: PaymentRequestInfo
  payments: PaymentEntry[]
  paymentInfo: PaymentInfoSummary
  breakdown: BreakdownEntry[]
}

interface PaymentRequestForm {
  amount: string
  payBy: string
  comments: string
  lateFee: string
  feeType: string
  lateFeeFrequency: string
  paymentMonth: string
  partialPayment: boolean
}

export function PaymentRequestDetailPage({ onNavigate, paymentRequestId }: PaymentRequestDetailPageProps) {
  const { t, locale } = useLanguage()
  const { token, hydrated } = useAuth()
  const { permissions, loading: permissionsLoading, error: permissionsError, loaded: permissionsLoaded } = useModulePermissions('finance')

  const [paymentRequestDetail, setPaymentRequestDetail] = useState<PaymentRequestDetailResponse | null>(null)
  const [logs, setLogs] = useState<PaymentLog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [logsLoading, setLogsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logsError, setLogsError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'breakdown' | 'activity'>('breakdown')
  const [isEditingRequest, setIsEditingRequest] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [isUpdatingRequest, setIsUpdatingRequest] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [requestForm, setRequestForm] = useState<PaymentRequestForm>({
    amount: '',
    payBy: '',
    comments: '',
    lateFee: '',
    feeType: '$',
    lateFeeFrequency: '',
    paymentMonth: '',
    partialPayment: false,
  })

  const breadcrumbItems: BreadcrumbItem[] = useMemo(
    () => [
      {
        label: t('portalTitle'),
        onClick: () => onNavigate(`/${locale}`),
      },
      {
        label: t('paymentsFinance'),
        onClick: () => onNavigate(`/${locale}/finance/request`),
      },
      { label: `${t('paymentRequestDetail')} #${paymentRequestId}` },
    ],
    [locale, onNavigate, paymentRequestId, t],
  )

  const loadPaymentRequest = useCallback(
    async (signal?: AbortSignal) => {
      if (!token || !permissionsLoaded || !permissions?.readAllowed) return

      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          payment_request_id: String(paymentRequestId),
          lang: locale,
        })

        const response = await fetch(`${API_BASE_URL}/reports/paymentrequest/details?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const json = await response.json()
        setPaymentRequestDetail(json ?? null)
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          setError(t('defaultError'))
        }
      } finally {
        setIsLoading(false)
      }
    },
    [locale, paymentRequestId, permissions?.readAllowed, permissionsLoaded, t, token],
  )

  const handlePaymentSuccess = useCallback(() => {
    setIsPaymentModalOpen(false)
    loadPaymentRequest()
  }, [loadPaymentRequest])

  const paymentRequestSummary = useMemo(
    () => {
      if (!paymentRequestDetail) {
        return {
          tuitionLabel: '',
          conceptName: '',
          pendingAmount: 0,
          isPartialPayment: false,
        }
      }

      return {
        tuitionLabel: paymentRequestDetail.paymentRequest.payment_month
          ? formatDate(paymentRequestDetail.paymentRequest.payment_month, locale, { year: 'numeric', month: 'long' })
          : t('noInformation'),
        conceptName: paymentRequestDetail.paymentRequest.pt_name,
        pendingAmount: paymentRequestDetail.paymentInfo.pendingPayment,
        isPartialPayment: paymentRequestDetail.paymentRequest.partial_payment,
      }
    },
    [locale, paymentRequestDetail, t],
  )

  useEffect(() => {
    const controller = new AbortController()
    loadPaymentRequest(controller.signal)

    return () => controller.abort()
  }, [loadPaymentRequest])

  useEffect(() => {
    if (!token || !permissionsLoaded || !permissions?.readAllowed) return

    const controller = new AbortController()
    const fetchLogs = async () => {
      setLogsLoading(true)
      setLogsError(null)
      try {
        const params = new URLSearchParams({ lang: locale })
        const response = await fetch(`${API_BASE_URL}/logs/payment-requests/${paymentRequestId}?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const json = await response.json()
        setLogs(json ?? [])
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          setLogsError(t('defaultError'))
        }
      } finally {
        setLogsLoading(false)
      }
    }

    fetchLogs()

    return () => controller.abort()
  }, [locale, paymentRequestId, permissions?.readAllowed, permissionsLoaded, t, token])

  const handlePrint = () => {
    window.print()
  }
  
  const formatPhoneLink = (phone: string | null) => {
    if (!phone) return null
    const digitsOnly = phone.replace(/\D/g, '')
    if (!digitsOnly) return null
    return `https://wa.me/${digitsOnly}`
  }

  const isDateField = (field: string | null) => (field ? ['pay_by'].includes(field) : false)
  const isMonthField = (field: string | null) => (field ? ['payment_month'].includes(field) : false)
  const isStatusField = (field: string | null) => (field ? ['payment_status_id'].includes(field) : false)
  const isPartialPayment = (field: string | null) => (field ? ['partial_payment'].includes(field) : false)


  const toDateInputValue = (value: string | null) => {
    if (!value) return ''

    const parsed = new Date(value.replace(' ', 'T'))

    if (Number.isNaN(parsed.getTime())) {
      return value.slice(0, 10)
    }

    return parsed.toISOString().slice(0, 10)
  }

  const toMonthInputValue = (value: string | null) => {
    if (!value) return ''
    const parsedDate = new Date(value)

    if (Number.isNaN(parsedDate.getTime())) {
      return value.slice(0, 7)
    }

    return parsedDate.toISOString().slice(0, 7)
  }

  const handleEditRequestClick = () => {
    if (!paymentRequestDetail) return

    const { paymentRequest } = paymentRequestDetail

    setRequestForm({
      amount: paymentRequest.pr_amount ? String(paymentRequest.pr_amount) : '',
      payBy: toDateInputValue(paymentRequest.pr_pay_by),
      comments: paymentRequest.pr_comments ?? '',
      lateFee: paymentRequest.late_fee ? String(paymentRequest.late_fee) : '',
      feeType: paymentRequest.fee_type ?? '$',
      lateFeeFrequency: paymentRequest.late_fee_frequency ? String(paymentRequest.late_fee_frequency) : '',
      paymentMonth: toMonthInputValue(paymentRequest.payment_month),
      partialPayment: paymentRequest.partial_payment,
    })
    setIsEditingRequest(true)
  }

  const handleRequestFormChange = (field: keyof PaymentRequestForm, value: string | boolean) => {
    setRequestForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleUpdateRequest = async (statusId?: number) => {
    if (!token || !paymentRequestDetail) return

    if (statusId === 7) {
      const confirmation = await Swal.fire({
        icon: 'warning',
        title: t('close') || 'Cerrar',
        text: t('areYouSureCloseRequest') || '¿Deseas cerrar esta solicitud?',
        showCancelButton: true,
        confirmButtonText: t('confirm') || 'Aceptar',
        cancelButtonText: t('cancel') || 'Cancelar',
      })

      if (!confirmation.isConfirmed) return
    } else if (statusId === 8) {
      const confirmation = await Swal.fire({
        icon: 'warning',
        title: t('cancel') || 'Cancelar',
        text: t('areYouSureCancelRequest') || '¿Deseas cancelar esta solicitud?',
        showCancelButton: true,
        confirmButtonText: t('confirm') || 'Aceptar',
        cancelButtonText: t('cancel') || 'Cancelar',
      })

      if (!confirmation.isConfirmed) return
    }

    setIsUpdatingRequest(true)
    setUpdateError(null)

    try {
      const url = `${API_BASE_URL}/reports/payment-request/update/${paymentRequestDetail.paymentRequest.payment_request_id}`
      const formData = isEditingRequest
        ? requestForm
        : {
            amount: paymentRequestDetail.paymentRequest.pr_amount ? String(paymentRequestDetail.paymentRequest.pr_amount) : '',
            payBy: toDateInputValue(paymentRequestDetail.paymentRequest.pr_pay_by),
            comments: paymentRequestDetail.paymentRequest.pr_comments ?? '',
            lateFee: paymentRequestDetail.paymentRequest.late_fee
              ? String(paymentRequestDetail.paymentRequest.late_fee)
              : '',
            feeType: paymentRequestDetail.paymentRequest.fee_type ?? '$',
            lateFeeFrequency: paymentRequestDetail.paymentRequest.late_fee_frequency
              ? String(paymentRequestDetail.paymentRequest.late_fee_frequency)
              : '',
            paymentMonth: toMonthInputValue(paymentRequestDetail.paymentRequest.payment_month),
            partialPayment: paymentRequestDetail.paymentRequest.partial_payment,
          }
      const payload = {
        data: {
          amount: formData.amount ? Number(formData.amount) : 0,
          pay_by: formData.payBy ? `${formData.payBy} 00:00:00` : '',
          comments: formData.comments ?? '',
          late_fee: formData.lateFee ? Number(formData.lateFee) : 0,
          fee_type: formData.feeType,
          late_fee_frequency: formData.lateFeeFrequency ? Number(formData.lateFeeFrequency) : 0,
          payment_month: formData.paymentMonth ? `${formData.paymentMonth}-01` : '',
          partial_payment: formData.partialPayment,
          ...(statusId ? { payment_status_id: statusId } : {}),
        },
      }

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('failed_request')
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

      await loadPaymentRequest()
      setIsEditingRequest(false)
    } catch (requestError) {
      Swal.fire({
        icon: 'error',
        title: t('defaultError'),
        text: t('defaultError'),
      })
      if ((requestError as Error).name !== 'AbortError') {
        setError(t('defaultError'))
      }
    } finally {
      setIsUpdatingRequest(false)
    }
  }

  if (!hydrated || permissionsLoading || !permissionsLoaded) {
    return (
      <Layout onNavigate={onNavigate} pageTitle={t('paymentsFinance')} breadcrumbItems={breadcrumbItems}>
        <LoadingSkeleton variant="table" rowCount={10} />
      </Layout>
    )
  }

  if (permissionsError) {
    return (
      <Layout onNavigate={onNavigate} pageTitle={t('paymentRequestDetail')} breadcrumbItems={breadcrumbItems}>
        <div className="alert alert-danger" role="alert">
          {t('defaultError')}
        </div>
      </Layout>
    )
  }

  if (permissionsLoaded && permissions && !permissions.readAllowed) {
    return (
      <Layout onNavigate={onNavigate} pageTitle={t('paymentRequestDetail')} breadcrumbItems={breadcrumbItems}>
        <NoPermission />
      </Layout>
    )
  }

  if (isLoading) {
    return (
      <Layout onNavigate={onNavigate} pageTitle={t('paymentRequestDetail')} breadcrumbItems={breadcrumbItems}>
        <LoadingSkeleton variant="table" rowCount={8} />
      </Layout>
    )
  }

  if (error || !paymentRequestDetail) {
    return (
      <Layout onNavigate={onNavigate} pageTitle={t('paymentRequestDetail')} breadcrumbItems={breadcrumbItems}>
        <div className="alert alert-danger" role="alert">
          {error ?? t('defaultError')}
        </div>
      </Layout>
    )
  }

  const { student, paymentRequest, paymentInfo, payments, breakdown } = paymentRequestDetail

  const canCreatePayment = permissions?.createAllowed ?? false
  const canUpdatePayment = permissions?.updateAllowed ?? false
  const isFinalStatus = paymentRequest.payment_status_id === 7 || paymentRequest.payment_status_id === 8


  const defaultPaymentMonth = paymentRequest.payment_month
    ? toMonthInputValue(paymentRequest.payment_month)
    : undefined

  const defaultPaymentConceptId = paymentRequest.payment_concept_id ?? undefined

  const formatCurrency = (value: number | null | undefined) =>
    (value ?? 0).toLocaleString(
      locale === 'es' ? 'es-MX' : 'en-US',
      { style: 'currency', currency: 'MXN' }
    );
    
  const groupLabel = t('groupLabel')
    .replace('{{group}}', student.grade_group || '-')
    .replace('{{level}}', student.scholar_level_name || '-')
    .replace('{{generation}}', student.generation || '-')

  const conceptLabel = (type: BreakdownEntry['type']) => {
    if (type === 'initial_payment_request') return t('initialPaymentRequest')
    if (type === 'late_fee') return t('lateFee')
    return t('paymentLabel')
  }

  const commentsText = paymentRequest.pr_comments && paymentRequest.pr_comments !== 'null'
    ? paymentRequest.pr_comments
    : t('noInformation')

  return (
    <Layout onNavigate={onNavigate} pageTitle={t('paymentRequestDetail')} breadcrumbItems={breadcrumbItems}>
      <RequestPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        studentId={student.student_id}
        paymentRequestId={paymentRequest.payment_request_id}
        defaultPaymentMonth={defaultPaymentMonth}
        defaultPaymentConceptId={defaultPaymentConceptId}
        requestSummary={paymentRequestSummary}
        lang={locale}
        onSuccess={handlePaymentSuccess}
      />
      <div className="d-flex flex-column gap-3">
        <div className="card shadow-sm border-0">
          <div className="card-header border-bottom-0 bg-white">
            <h5 className="mb-0">{t('paymentSummary')}</h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              {[{
                label: t('totalPaid'),
                value: formatCurrency(paymentInfo.totalPaid),
              },
              {
                label: t('latePeriods'),
                value: paymentInfo.latePeriods,
              },
              {
                label: t('requestedAmount'),
                value: formatCurrency(paymentRequest.pr_amount),
              },
              {
                label: t('accumulatedFees'),
                value: formatCurrency(paymentInfo.accumulatedFees),
              },
              {
                label: t('pendingPayment'),
                value: formatCurrency(paymentInfo.pendingPayment),
              }].map((item) => (
                <div className="col-12 col-sm-6 col-lg" key={item.label}>
                  <div className="bg-light rounded-3 p-3 h-100">
                    <div className="text-muted small mb-1">{item.label}</div>
                    <div className="fs-5 fw-semibold">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="card shadow-sm border-0">
          <div className="card-header border-bottom-0 bg-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">{t('studentInformation')}</h5>
          </div>
          <div className="card-body">
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: 56, height: 56 }}>
                <span className="fw-semibold">{student.full_name?.charAt(0) ?? 'S'}</span>
              </div>
              <div className="flex-grow-1">
                <h6 className="mb-1">{student.full_name}</h6>
                <small className="text-muted">
                  {groupLabel}
                </small>
              </div>
            </div>
            <div className="row mt-4">
              <div className="col-md-6 mb-3 mb-md-0">
                  <span className="text-sm text-gray-500">{t('email')}</span>
                  {student.email ? (
                    <a className="d-flex align-items-center btn btn-link p-0 align-items-center link-secondary" href={`mailto:${student.email}`}>
                      <svg className="emailIcon me-1" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm0 2v.01L12 13l8-5.99V7H4zm0 10h16V9.24l-7.553 5.65a1 1 0 0 1-1.194 0L4 9.24V17z"></path></svg>
                      {student.email}
                    </a>
                  ) : (
                    <span className="text-sm text-gray-500">{t('noInformation')}</span>
                  )}
              </div>
              <div className="col-md-6">
                <div className="d-flex flex-column align-items-start">
                  <span className="text-sm text-gray-500">{t('phone')}</span>
                  {formatPhoneLink(student.phone_number) ? (
                    <a
                      className="d-flex align-items-center btn btn-link p-0 align-items-center link-secondary"
                      href={formatPhoneLink(student.phone_number) ?? '#'}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-whatsapp me-1" viewBox="0 0 16 16">
                        <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
                      </svg>
                      {student.phone_number}
                    </a>
                  ) : (
                    <span className="text-sm text-gray-500">{t('noInformation')}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-0">
          
          <div className="d-flex align-items-center justify-content-between card-header border-bottom-0 bg-white">
            <h5 className="mb-0">{t('paymentRequestInformation')}</h5>

          <div className="d-flex flex-wrap gap-2 justify-content-end">
            <button type="button" className="btn d-flex align-items-center gap-2 btn-print text-muted fw-medium" onClick={handlePrint}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-printer" viewBox="0 0 16 16">
                <path d="M2.5 8a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1"/>
                <path d="M5 1a2 2 0 0 0-2 2v2H2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V3a2 2 0 0 0-2-2zM4 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2H4zm1 5a2 2 0 0 0-2 2v1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v-1a2 2 0 0 0-2-2zm7 2v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1"/>
              </svg>
              {t('print')}
            </button>
            {canUpdatePayment && !isEditingRequest && !isFinalStatus ? (
              <>
                <button
                  type="button"
                  className="btn d-flex align-items-center gap-2 btn-edit text-muted fw-medium"
                  onClick={handleEditRequestClick}
                  disabled={isUpdatingRequest}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-pencil" viewBox="0 0 16 16">
                    <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325"/>
                  </svg>
                  {t('edit')}
                </button>
                <div className='d-flex inline-flex rounded-md '>
                  <button
                    type="button"
                    className="btn shadow-sm d-flex align-items-center gap-2 btn-closeRequest text-muted fw-medium"
                    onClick={() => handleUpdateRequest(8)}
                    disabled={isUpdatingRequest}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-dash-circle" viewBox="0 0 16 16">
                      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                      <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8"/>
                    </svg>
                    {t('cancel')}
                  </button>
                  <button
                    type="button"
                    className="btn shadow-sm d-flex align-items-center gap-2 btn-approve text-muted fw-medium"
                    onClick={() => handleUpdateRequest(7)}
                    disabled={isUpdatingRequest}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" font-weight="bold" className="bi bi-hand-thumbs-up" viewBox="0 0 16 16">
                      <path d="M8.864.046C7.908-.193 7.02.53 6.956 1.466c-.072 1.051-.23 2.016-.428 2.59-.125.36-.479 1.013-1.04 1.639-.557.623-1.282 1.178-2.131 1.41C2.685 7.288 2 7.87 2 8.72v4.001c0 .845.682 1.464 1.448 1.545 1.07.114 1.564.415 2.068.723l.048.03c.272.165.578.348.97.484.397.136.861.217 1.466.217h3.5c.937 0 1.599-.477 1.934-1.064a1.86 1.86 0 0 0 .254-.912c0-.152-.023-.312-.077-.464.201-.263.38-.578.488-.901.11-.33.172-.762.004-1.149.069-.13.12-.269.159-.403.077-.27.113-.568.113-.857 0-.288-.036-.585-.113-.856a2 2 0 0 0-.138-.362 1.9 1.9 0 0 0 .234-1.734c-.206-.592-.682-1.1-1.2-1.272-.847-.282-1.803-.276-2.516-.211a10 10 0 0 0-.443.05 9.4 9.4 0 0 0-.062-4.509A1.38 1.38 0 0 0 9.125.111zM11.5 14.721H8c-.51 0-.863-.069-1.14-.164-.281-.097-.506-.228-.776-.393l-.04-.024c-.555-.339-1.198-.731-2.49-.868-.333-.036-.554-.29-.554-.55V8.72c0-.254.226-.543.62-.65 1.095-.3 1.977-.996 2.614-1.708.635-.71 1.064-1.475 1.238-1.978.243-.7.407-1.768.482-2.85.025-.362.36-.594.667-.518l.262.066c.16.04.258.143.288.255a8.34 8.34 0 0 1-.145 4.725.5.5 0 0 0 .595.644l.003-.001.014-.003.058-.014a9 9 0 0 1 1.036-.157c.663-.06 1.457-.054 2.11.164.175.058.45.3.57.65.107.308.087.67-.266 1.022l-.353.353.353.354c.043.043.105.141.154.315.048.167.075.37.075.581 0 .212-.027.414-.075.582-.05.174-.111.272-.154.315l-.353.353.353.354c.047.047.109.177.005.488a2.2 2.2 0 0 1-.505.805l-.353.353.353.354c.006.005.041.05.041.17a.9.9 0 0 1-.121.416c-.165.288-.503.56-1.066.56z"/>
                    </svg>
                    {t('close')}
                  </button>
                </div>
              </>
            ) : null}
          </div>

          </div>

          {updateError ? (
            <div className="alert alert-danger mx-3" role="alert">
              {updateError}
            </div>
          ) : null}

          {isEditingRequest ? (
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label text-muted small" htmlFor="requestAmount">{t('amount')}</label>
                  <input
                    id="requestAmount"
                    type="number"
                    className="form-control"
                    value={requestForm.amount}
                    onChange={(event) => handleRequestFormChange('amount', event.target.value)}
                    min="0"
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label text-muted small" htmlFor="requestPayBy">{t('due_date')}</label>
                  <input
                    id="requestPayBy"
                    type="date"
                    className="form-control"
                    value={requestForm.payBy}
                    onChange={(event) => handleRequestFormChange('payBy', event.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label text-muted small" htmlFor="requestLateFee">{t('lateFee')}</label>
                  <input
                    id="requestLateFee"
                    type="number"
                    className="form-control"
                    value={requestForm.lateFee}
                    onChange={(event) => handleRequestFormChange('lateFee', event.target.value)}
                    min="0"
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label text-muted small" htmlFor="requestFeeType">{t('fee_type') ?? 'Tipo de recargo'}</label>
                  <select
                    id="requestFeeType"
                    className="form-select"
                    value={requestForm.feeType}
                    onChange={(event) => handleRequestFormChange('feeType', event.target.value)}
                  >
                    <option value="$">$</option>
                    <option value="%">%</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label text-muted small" htmlFor="requestLateFeeFrequency">{t('late_fee_frequency') ?? 'Frecuencia de recargo (días)'}</label>
                  <input
                    id="requestLateFeeFrequency"
                    type="number"
                    className="form-control"
                    value={requestForm.lateFeeFrequency}
                    onChange={(event) => handleRequestFormChange('lateFeeFrequency', event.target.value)}
                    min="0"
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label text-muted small" htmlFor="requestPaymentMonth">{t('paymentMonth')}</label>
                  <input
                    id="requestPaymentMonth"
                    type="month"
                    className="form-control"
                    value={requestForm.paymentMonth}
                    onChange={(event) => handleRequestFormChange('paymentMonth', event.target.value)}
                  />
                </div>
                <div className="col-md-12">
                  <label className="form-label text-muted small" htmlFor="requestComments">{t('comments')}</label>
                  <textarea
                    id="requestComments"
                    className="form-control"
                    rows={3}
                    value={requestForm.comments}
                    onChange={(event) => handleRequestFormChange('comments', event.target.value)}
                  />
                </div>
                <div className="col-md-12 form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="requestPartialPayment"
                    checked={requestForm.partialPayment}
                    onChange={(event) => handleRequestFormChange('partialPayment', event.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="requestPartialPayment">{t('partialPayment')}</label>
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-3">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setIsEditingRequest(false)}
                  disabled={isUpdatingRequest}
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleUpdateRequest()}
                  disabled={isUpdatingRequest}
                >
                  {isUpdatingRequest ? t('saving') ?? t('loading') : t('save') ?? t('approve')}
                </button>
              </div>
            </div>
          ) : (
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3">
                  <div className="text-muted small mb-1">{t('paymentRequestDetail')}</div>
                  <div className="fw-semibold">#{paymentRequest.payment_request_id}</div>
                </div>
                <div className="col-md-3">
                  <div className="text-muted small mb-1">{t('amount')}</div>
                  <div className="fw-semibold">{formatCurrency(paymentRequest.pr_amount)}</div>
                </div>
                <div className="col-md-3">
                  <div className="text-muted small mb-1">{t('due_date')}</div>
                  <div className="fw-semibold">
                    {formatDate(paymentRequest.pr_pay_by, locale, { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="text-muted small mb-1">{t('status')}</div>
                  <small className={'cell-chip px-4 text-nowrap ' + (paymentRequest.payment_status_id === 7 ? 'bg-success' : paymentRequest.payment_status_id === 8 ? 'bg-danger' : 'bg-warning')}>
                    {paymentRequest.ps_pr_name}
                  </small>
                </div>
                <div className="col-md-3">
                  <div className="text-muted small mb-1">{t('paymentType')}</div>
                  <div className="fw-semibold">{paymentRequest.pt_name}</div>
                </div>
                <div className="col-md-3">
                  <div className="text-muted small mb-1">{t('lateFee')}</div>
                  <div className="fw-semibold">{formatCurrency(paymentRequest.late_fee)}</div>
                </div>
                <div className="col-md-3">
                  <div className="text-muted small mb-1">{t('partialPayment')}</div>
                  <div className="fw-semibold">{paymentRequest.partial_payment_transformed}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="card shadow-sm border-0">
          <div className="d-flex align-items-center justify-content-between card-header border-bottom-0 bg-white">
            <h5 className="mb-0">{t('paymentsList')}</h5>
            {canCreatePayment && !isFinalStatus ? (
              <button
                type="button"
                className="btn d-flex align-items-center gap-2 btn-edit text-muted fw-medium"
                onClick={() => setIsPaymentModalOpen(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-plus" viewBox="0 0 16 16">
                  <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
                </svg>
                {t('addPayment')}
              </button>
            ) : null}
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table align-middle mb-0 table-striped table-hover">
                <thead className="">
                  <tr>
                    <th scope="col">ID</th>
                    <th scope="col">{t('paymentType')}</th>
                    <th scope="col">{t('status')}</th>
                    <th scope="col">{t('paymentDate')}</th>
                    <th scope="col">{t('amount')}</th>
                    <th scope="col">{t('viewDetails')}</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center text-muted py-4">
                        {t('tableNoData')}
                      </td>
                    </tr>
                  ) : (
                    payments.map((payment) => (
                      <tr key={payment.payment_id}>
                        <td className="fw-semibold">{payment.payment_id}</td>
                        <td>{payment.pt_name}</td>
                        <td>
                          <small className={'cell-chip px-3 text-nowrap ' + (payment.payment_status_id === 3 ? 'bg-success' : payment.payment_status_id === 1 ? 'bg-warning' : 'bg-danger')}>
                            {payment.payment_status_name}
                          </small>
                        </td>
                        <td>{formatDate(payment.payment_date, locale, { dateStyle: 'medium', timeStyle: 'short' })}</td>
                        <td className="fw-semibold">{formatCurrency(payment.amount)}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-link p-0"
                            onClick={() => onNavigate(`/${locale}/finance/payments/${payment.payment_id}`)}
                          >
                            {t('viewDetails')}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-0">
          <div className="card-header border-bottom-0 bg-white border-0 pb-0">
            <div className="d-flex align-items-center gap-3">
              <button
                type="button"
                className={`btn btn-link text-decoration-none px-0 ${activeTab === 'breakdown' ? 'fw-semibold' : 'text-muted'}`}
                onClick={() => setActiveTab('breakdown')}
              >
                {t('breakdownTab')}
              </button>
              <button
                type="button"
                className={`btn btn-link text-decoration-none px-0 ${activeTab === 'activity' ? 'fw-semibold' : 'text-muted'}`}
                onClick={() => setActiveTab('activity')}
              >
                {t('activityAndComments')}
              </button>
            </div>
          </div>

          <div className="card-body">
            {activeTab === 'breakdown' ? (
              <div className="table-responsive">
                <table className="table align-middle mb-0 table-striped table-hover">
                  <thead className="">
                    <tr>
                      <th scope="col">ID</th>
                      <th scope="col">{t('paymentType')}</th>
                      <th scope="col">{t('status')}</th>
                      <th scope="col">{t('paymentDate')}</th>
                      <th scope="col">{t('amount')}</th>
                      <th scope="col">{t('balance')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdown.map((entry, index) => (
                      <tr key={`${entry.type}-${entry.date}-${index}`}>
                        <td>{entry.payment_id ?? '—'}</td>
                        <td className="fw-light">{conceptLabel(entry.type)}</td>
                        <td>
                          <small className={'cell-chip px-3 text-nowrap ' + 
                            (entry.payment_status_id === null ? '' 
                            : entry.payment_status_id === 3 ? 'bg-success' 
                            : 
                            entry.payment_status_id === 1 ? 'bg-warning' : 'bg-danger'
                            )}>
                            {entry.status_name}
                          </small>
                        </td>
                        <td>{formatDate(entry.date, locale, { dateStyle: 'medium', timeStyle: 'short' })}</td>
                        <td className={entry.amount < 0 ? 'text-danger fw-light' : 'text-success fw-light'}>
                          {formatCurrency(entry.amount)}
                        </td>
                        <td className={entry.balance < 0 ? 'text-danger fw-light' : 'text-success fw-light'}>
                          {formatCurrency(entry.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="d-flex flex-column gap-4">
                <div className="card shadow-none bg-light bg-gradient mb-0">
                  <div className="card-header border-bottom-0 bg-transparent">
                    <h3 className="mb-0">{t('comments')}</h3>
                  </div>
                  <div className="card-body">
                    {logsError ? (
                      <div className="alert alert-danger" role="alert">
                        {logsError}
                      </div>
                    ) : logsLoading ? (
                      <LoadingSkeleton variant="table" rowCount={4} />
                    ) : (
                      <div className="list-group list-group-flush">
                        <div className="list-group-item bg-transparent px-0">
                          <div className="mb-3">
                            <span className="fw-medium">{commentsText}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card shadow-none bg-light bg-gradient mb-0">
                  <div className="card-header border-bottom-0 bg-transparent">
                    <h3 className="mb-0">{t('activityLog')}</h3>
                  </div>
                  <div className="card-body">
                    {logsError ? (
                      <div className="alert alert-danger" role="alert">
                        {logsError}
                      </div>
                    ) : logsLoading ? (
                      <LoadingSkeleton variant="table" rowCount={4} />
                    ) : logs.length === 0 ? (
                      <p className="text-muted mb-0">{t('noLogs')}</p>
                    ) : (
                      <div className="list-group list-group-flush">
                        {logs.map((log, index) => (
                          <div key={`${log.updated_at}-${index}`} className="list-group-item bg-transparent px-0">
                            <div className="d-flex justify-content-between align-items-start">
                              <div className='d-flex align-items-center gap-2'>
                                <div className="fw-semibold">{log.responsable_full_name}</div>
                                <div className="text-muted small">{log.role_name}</div>
                              </div>
                              <div className="text-muted small">
                                {formatDate(log.updated_at, locale, { dateStyle: 'medium', timeStyle: 'short' })}
                              </div>
                            </div>
                            <div className="mt-2">
                              <div className="fw-semibold mb-1">{log.log_type_name}</div>
                              <ul className="log-entry mb-0 ps-3 small text-muted">
                                {log.changes?.map((change, changeIndex) => (
                                  <li key={`${change.field}-${changeIndex}`}>
                                    <span className="fw-semibold">
                                        {change.field ? t(change.field) : t('noInformation')}
                                      </span>
                                      : {
                                        isDateField(change.field)
                                          ? formatDate(change.from, locale, { dateStyle: 'medium', timeStyle: 'short' })
                                          : isMonthField(change.field) 
                                            ? formatDate(change.from, locale, {year: 'numeric', month: 'long'})
                                            : isStatusField(change.field)  ?
                                            t("status-"+change.from) 
                                            : isPartialPayment(change.field)  ?
                                            t("partialPayment-"+change.from) :
                                            change.from ?? '—'
                                      }
                                      {" → "}
                                      {
                                        isDateField(change.field)
                                          ? formatDate(change.to, locale, { dateStyle: 'medium', timeStyle: 'short' })
                                          : isMonthField(change.field) 
                                            ? formatDate(change.to, locale, {year: 'numeric', month: 'long'})
                                            : isStatusField(change.field)  ?
                                            t("status-"+change.to)
                                            : isPartialPayment(change.field)  ?
                                            t("partialPayment-"+change.to) :
                                            change.from ?? '—'
                                      }
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
