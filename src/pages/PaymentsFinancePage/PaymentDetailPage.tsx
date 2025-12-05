import { useEffect, useMemo, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react'
import Swal from 'sweetalert2'
import { Layout } from '../../layout/Layout'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import type { BreadcrumbItem } from '../../components/Breadcrumb'
import { LoadingSkeleton } from '../../components/LoadingSkeleton'
import { NoPermission } from '../../components/NoPermission'
import { API_BASE_URL } from '../../config'
import { formatDate } from '../../utils/formatDate'
import PaymentConceptSelect from '../../components/catalog/PaymentConceptSelect'
import PaymentThroughSelect from '../../components/catalog/PaymentThroughSelect'
import { useModulePermissions } from '../../hooks/useModulePermissions'

interface PaymentDetailPageProps {
  onNavigate: (path: string) => void
  paymentId: number
}

interface PaymentDetail {
  payment_id: number
  student_id: number
  school_id: number
  payment_month: string
  amount: number
  payment_status_id: number
  payment_through_id: number
  payment_concept_id: number
  validated_at: string | null
  payment_created_at: string
  updated_at: string
  comments: string
  pt_name: string
  payt_name: string
  payment_reference: string
  generation: string
  email: string | null
  personal_email: string | null
  student_full_name: string
  address: string | null
  phone_number: string | null
  school_description: string
  scholar_level_name: string
  g_enabled: boolean
  u_enabled: boolean
  sc_enabled: boolean
  school_status: string
  user_status: string
  group_status: string
  payment_status_name: string
  grade_group: string
  validator_full_name: string | null
  validator_phone_number: string | null
  validator_username: string | null
  payment_request_id: number
  receipt_path: string | null
  receipt_file_name: string | null
  payment_date: string
}

interface PaymentLogChange {
  field: string | null
  from: string | null
  to: string | null
  comments: string | null
}

interface PaymentLog {
  payment_id: number
  responsable_user_id: number
  responsable_full_name: string
  role_name: string
  updated_at: string
  log_type_name: string
  changes: PaymentLogChange[]
}

export function PaymentDetailPage({ onNavigate, paymentId }: PaymentDetailPageProps) {
  const { t, locale } = useLanguage()
  const { token, hydrated } = useAuth()
  const { permissions, loading: permissionsLoading, error: permissionsError, loaded: permissionsLoaded } = useModulePermissions('payments')

  const [payment, setPayment] = useState<PaymentDetail | null>(null)
  const [logs, setLogs] = useState<PaymentLog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [logsLoading, setLogsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logsError, setLogsError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [hasRemovedReceipt, setHasRemovedReceipt] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isEditingPayment, setIsEditingPayment] = useState(false)
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false)
  const [isStatusUpdating, setIsStatusUpdating] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    payment_concept_id: '' as number | '',
    payment_through_id: '' as number | '',
    created_at: '',
    payment_date: '',
    payment_month: '',
    amount: '',
    comments: '',
  })

  const breadcrumbItems: BreadcrumbItem[] = useMemo(
    () => [
      {
        label: t('portalTitle'),
        onClick: () => onNavigate(`/${locale}`),
      },
      {
        label: t('paymentsFinance'),
        onClick: () => onNavigate(`/${locale}/finance/payments`),
      },
      { label: `${t('paymentDetail')} #${paymentId}` },
    ],
    [locale, onNavigate, paymentId, t],
  )

  useEffect(() => {
    if (!token || !permissionsLoaded || !permissions?.readAllowed) return

    const controller = new AbortController()
    const fetchPayment = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          payment_id: String(paymentId),
          lang: locale,
        })

        const response = await fetch(`${API_BASE_URL}/reports/payments?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const json = await response.json()
        setPayment((json?.content ?? [])[0] ?? null)
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          setError(t('defaultError'))
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchPayment()

    return () => controller.abort()
  }, [locale, paymentId, permissions?.readAllowed, permissionsLoaded, t, token])

  useEffect(() => {
    if (!token || !permissionsLoaded || !permissions?.readAllowed) return

    const controller = new AbortController()
    const fetchLogs = async () => {
      setLogsLoading(true)
      setLogsError(null)
      try {
        const params = new URLSearchParams({ lang: locale })
        const response = await fetch(`${API_BASE_URL}/logs/payment/${paymentId}?${params.toString()}`, {
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
  }, [locale, paymentId, permissions?.readAllowed, permissionsLoaded, t, token])

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file)
    if (file) {
      setHasRemovedReceipt(true)
    }
  }

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    handleFileSelect(file ?? null)
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    handleFileSelect(file ?? null)
    setIsDragOver(false)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setHasRemovedReceipt(true)
  }

  const handleRemoveExistingReceipt = () => {
    setHasRemovedReceipt(true)
    setSelectedFile(null)
    if (payment) {
      setPayment({ ...payment, receipt_path: null, receipt_file_name: null })
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const formatPhoneLink = (phone: string | null) => {
    if (!phone) return null
    const digitsOnly = phone.replace(/\D/g, '')
    if (!digitsOnly) return null
    return `https://wa.me/${digitsOnly}`
  }

  const isDateField = (field: string | null) => (field ? ['payment_date', 'created_at'].includes(field) : false)
  const isMonthField = (field: string | null) => (field ? ['payment_month'].includes(field) : false)

  const toDateTimeLocalValue = (value: string) => {
    if (!value) return ''

    const normalized = value.replace(' ', 'T')
    const parsedDate = new Date(normalized)

    if (Number.isNaN(parsedDate.getTime())) {
      return normalized.slice(0, 16)
    }

    return parsedDate.toISOString().slice(0, 16)
  }

  const toMonthInputValue = (value: string) => {
    if (!value) return ''
    const parsedDate = new Date(value)

    if (Number.isNaN(parsedDate.getTime())) {
      return value.slice(0, 7)
    }

    return parsedDate.toISOString().slice(0, 7)
  }

  const handleEditPaymentClick = () => {
    if (!payment) return

    setPaymentForm({
      payment_concept_id: payment.payment_concept_id ?? '',
      payment_through_id: payment.payment_through_id ?? '',
      created_at: toDateTimeLocalValue(payment.payment_created_at),
      payment_date: toDateTimeLocalValue(payment.payment_date),
      payment_month: toMonthInputValue(payment.payment_month),
      amount: payment.amount ? String(payment.amount) : '',
      comments: payment.comments ?? '',
    })
    setIsEditingPayment(true)
  }

  const handleCancelEdit = () => {
    setIsEditingPayment(false)
  }

  const appendSeconds = (value: string) => {
    if (!value) return ''
    if (value.length === 16) return `${value}:00`
    return value
  }

  const handlePaymentFormChange = (field: keyof typeof paymentForm, value: string | number | '') => {
    setPaymentForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleStatusUpdate = async (paymentStatusId: number) => {
    if (!token || !payment) return

    const confirmation = await Swal.fire({
      icon: 'question',
      title: paymentStatusId === 3 ? t('approve') : t('reject'),
      text:
        paymentStatusId === 3
          ? t('confirmApprovePayment') ?? '¿Deseas aprobar el pago?'
          : t('confirmRejectPayment') ?? '¿Deseas rechazar el pago?',
      showCancelButton: true,
      confirmButtonText: t('confirm') ?? 'Confirmar',
      cancelButtonText: t('cancel'),
      focusCancel: true,
    })

    if (!confirmation.isConfirmed) return

    setIsStatusUpdating(true)

    try {
      const normalizedLanguage = locale || 'es'
      const url = `${API_BASE_URL}/payments/update/${payment.payment_id}?lang=${normalizedLanguage}`

      const payload = { payment_status_id: paymentStatusId }

      const formData = new FormData()
      formData.append('request', new Blob([JSON.stringify(payload)], { type: 'application/json' }))

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
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

      if (result.payload) {
        setPayment((prev) => {
          if (!prev) return prev

          return {
            ...prev,
            ...result.payload,
            payment_status_id: result.payload.payment_status_id ?? prev.payment_status_id,
            payment_status_name: result.payload.payment_status_name ?? prev.payment_status_name,
            validator_full_name: result.payload.validator_full_name ?? prev.validator_full_name,
            validator_username: result.payload.validator_username ?? prev.validator_username,
            validator_phone_number: result.payload.validator_phone_number ?? prev.validator_phone_number,
          }
        })
      }
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
      setIsStatusUpdating(false)
    }
  }

  const handlePaymentUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!token || !payment) return

    setIsUpdatingPayment(true)

    try {
      const normalizedLanguage = locale || 'es'
      const url = `${API_BASE_URL}/payments/update/${payment.payment_id}?lang=${normalizedLanguage}`

      const payload = {
        payment_concept_id: paymentForm.payment_concept_id === '' ? undefined : Number(paymentForm.payment_concept_id),
        payment_through_id: paymentForm.payment_through_id === '' ? undefined : Number(paymentForm.payment_through_id),
        created_at: appendSeconds(paymentForm.created_at),
        payment_date: appendSeconds(paymentForm.payment_date),
        payment_month: paymentForm.payment_month ? `${paymentForm.payment_month}-01` : undefined,
        amount: paymentForm.amount ? Number(paymentForm.amount) : undefined,
        comments: paymentForm.comments ?? '',
      }

      const formData = new FormData()
      formData.append('request', new Blob([JSON.stringify(payload)], { type: 'application/json' }))

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
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

      if (result.payload) {
        setPayment((prev) => {
          if (!prev) return prev

          return {
            ...prev,
            ...result.payload,
            payment_concept_id: result.payload.payment_concept_id ?? prev.payment_concept_id,
            payment_through_id: result.payload.payment_through_id ?? prev.payment_through_id,
            payment_month: result.payload.payment_month ?? prev.payment_month,
            amount: result.payload.amount ?? prev.amount,
            comments: result.payload.comments ?? prev.comments,
            payment_date: result.payload.payment_date ?? prev.payment_date,
            payment_created_at: result.payload.created_at ?? prev.payment_created_at,
          }
        })
      }

      setIsEditingPayment(false)
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
      setIsUpdatingPayment(false)
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
      <Layout onNavigate={onNavigate} pageTitle={t('paymentDetail')} breadcrumbItems={breadcrumbItems}>
        <div className="alert alert-danger" role="alert">
          {t('defaultError')}
        </div>
      </Layout>
    )
  }

  if (permissionsLoaded && permissions && !permissions.readAllowed) {
    return (
      <Layout onNavigate={onNavigate} pageTitle={t('paymentDetail')} breadcrumbItems={breadcrumbItems}>
        <NoPermission />
      </Layout>
    )
  }

  if (isLoading) {
    return (
      <Layout onNavigate={onNavigate} pageTitle={t('paymentDetail')} breadcrumbItems={breadcrumbItems}>
        <LoadingSkeleton variant="table" rowCount={8} />
      </Layout>
    )
  }

  if (error || !payment) {
    return (
      <Layout onNavigate={onNavigate} pageTitle={t('paymentDetail')} breadcrumbItems={breadcrumbItems}>
        <div className="alert alert-danger" role="alert">
          {error ?? t('defaultError')}
        </div>
      </Layout>
    )
  }

  const groupLabel = t('groupLabel')
    .replace('{{group}}', payment.grade_group || '-')
    .replace('{{level}}', payment.scholar_level_name || '-')
    .replace('{{generation}}', payment.generation || '-')

  const canUpdatePayment = permissions?.updateAllowed ?? false
  const hasReceipt = Boolean(payment.receipt_path && !hasRemovedReceipt)

  return (
    <Layout onNavigate={onNavigate} pageTitle={t('paymentDetail')} breadcrumbItems={breadcrumbItems}>
      <div className="d-flex flex-column gap-3">
        <div className="card shadow-sm border-0">
          <div className="card-header border-bottom-0 bg-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">{t('studentInformation')}</h5>
          </div>
          <div className="card-body">
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: 56, height: 56 }}>
                <span className="fw-semibold">{payment.student_full_name?.charAt(0) ?? 'S'}</span>
              </div>
              <div className="flex-grow-1">
                <h6 className="mb-1">{payment.student_full_name}</h6>
                <small className="text-muted">
                  {groupLabel}
                </small>
              </div>
            </div>
            <div className="row mt-4">
              <div className="col-md-6 mb-3 mb-md-0">
                  <span className="text-sm text-gray-500">{t('email')}</span>
                  {payment.email ? (
                    <a className="d-flex align-items-center btn btn-link p-0 align-items-center link-secondary" href={`mailto:${payment.email}`}>
                      <svg className="emailIcon me-1" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm0 2v.01L12 13l8-5.99V7H4zm0 10h16V9.24l-7.553 5.65a1 1 0 0 1-1.194 0L4 9.24V17z"></path></svg>
                      {payment.email}
                    </a>
                  ) : (
                    <span className="text-sm text-gray-500">{t('noInformation')}</span>
                  )}
              </div>
              <div className="col-md-6">
                <div className="d-flex flex-column align-items-start">
                  <span className="text-sm text-gray-500">{t('phone')}</span>
                  {formatPhoneLink(payment.phone_number) ? (
                    <a
                      className="d-flex align-items-center btn btn-link p-0 align-items-center link-secondary"
                      href={formatPhoneLink(payment.phone_number) ?? '#'}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-whatsapp me-1" viewBox="0 0 16 16">
                        <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
                      </svg>
                      {payment.phone_number}
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
            <h5 className="mb-0">{t('paymentInformation')}</h5>

            <div className="d-flex flex-wrap gap-2 justify-content-end">
              {!isEditingPayment && (
                <>
                  <button type="button" className="btn d-flex align-items-center gap-2 btn-print text-muted fw-medium" onClick={handlePrint}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-printer" viewBox="0 0 16 16">
                      <path d="M2.5 8a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1"/>
                      <path d="M5 1a2 2 0 0 0-2 2v2H2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V3a2 2 0 0 0-2-2zM4 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2H4zm1 5a2 2 0 0 0-2 2v1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v-1a2 2 0 0 0-2-2zm7 2v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1"/>
                    </svg>
                    {t('print')}
                  </button>
                  {canUpdatePayment ? (
                    <>
                      <button
                        type="button"
                        className="btn d-flex align-items-center gap-2 btn-edit text-muted fw-medium"
                        onClick={handleEditPaymentClick}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-pencil" viewBox="0 0 16 16">
                          <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325"/>
                        </svg>
                        {t('edit')}
                      </button>
                      <div className='d-flex inline-flex rounded-md '>
                        <button
                          type="button"
                          className="btn shadow-sm d-flex align-items-center gap-2 btn-reject text-muted fw-medium"
                          onClick={() => handleStatusUpdate(4)}
                          disabled={isStatusUpdating}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" font-weight="bold" className="bi bi-hand-thumbs-down" viewBox="0 0 16 16">
                            <path d="M8.864 15.674c-.956.24-1.843-.484-1.908-1.42-.072-1.05-.23-2.015-.428-2.59-.125-.36-.479-1.012-1.04-1.638-.557-.624-1.282-1.179-2.131-1.41C2.685 8.432 2 7.85 2 7V3c0-.845.682-1.464 1.448-1.546 1.07-.113 1.564-.415 2.068-.723l.048-.029c.272-.166.578-.349.97-.484C6.931.08 7.395 0 8 0h3.5c.937 0 1.599.478 1.934 1.064.164.287.254.607.254.913 0 .152-.023.312-.077.464.201.262.38.577.488.9.11.33.172.762.004 1.15.069.13.12.268.159.403.077.27.113.567.113.856s-.036.586-.113.856c-.035.12-.08.244-.138.363.394.571.418 1.2.234 1.733-.206.592-.682 1.1-1.2 1.272-.847.283-1.803.276-2.516.211a10 10 0 0 1-.443.05 9.36 9.36 0 0 1-.062 4.51c-.138.508-.55.848-1.012.964zM11.5 1H8c-.51 0-.863.068-1.14.163-.281.097-.506.229-.776.393l-.04.025c-.555.338-1.198.73-2.49.868-.333.035-.554.29-.554.55V7c0 .255.226.543.62.65 1.095.3 1.977.997 2.614 1.709.635.71 1.064 1.475 1.238 1.977.243.7.407 1.768.482 2.85.025.362.36.595.667.518l.262-.065c.16-.04.258-.144.288-.255a8.34 8.34 0 0 0-.145-4.726.5.5 0 0 1 .595-.643h.003l.014.004.058.013a9 9 0 0 0 1.036.157c.663.06 1.457.054 2.11-.163.175-.059.45-.301.57-.651.107-.308.087-.67-.266-1.021L12.793 7l.353-.354c.043-.042.105-.14.154-.315.048-.167.075-.37.075-.581s-.027-.414-.075-.581c-.05-.174-.111-.273-.154-.315l-.353-.354.353-.354c.047-.047.109-.176.005-.488a2.2 2.2 0 0 0-.505-.804l-.353-.354.353-.354c.006-.005.041-.05.041-.17a.9.9 0 0 0-.121-.415C12.4 1.272 12.063 1 11.5 1"/>
                          </svg>
                          {t('reject')}
                        </button>
                        <button
                          type="button"
                          className="btn shadow-sm d-flex align-items-center gap-2 btn-approve text-muted fw-medium"
                          onClick={() => handleStatusUpdate(3)}
                          disabled={isStatusUpdating}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" font-weight="bold" className="bi bi-hand-thumbs-up" viewBox="0 0 16 16">
                            <path d="M8.864.046C7.908-.193 7.02.53 6.956 1.466c-.072 1.051-.23 2.016-.428 2.59-.125.36-.479 1.013-1.04 1.639-.557.623-1.282 1.178-2.131 1.41C2.685 7.288 2 7.87 2 8.72v4.001c0 .845.682 1.464 1.448 1.545 1.07.114 1.564.415 2.068.723l.048.03c.272.165.578.348.97.484.397.136.861.217 1.466.217h3.5c.937 0 1.599-.477 1.934-1.064a1.86 1.86 0 0 0 .254-.912c0-.152-.023-.312-.077-.464.201-.263.38-.578.488-.901.11-.33.172-.762.004-1.149.069-.13.12-.269.159-.403.077-.27.113-.568.113-.857 0-.288-.036-.585-.113-.856a2 2 0 0 0-.138-.362 1.9 1.9 0 0 0 .234-1.734c-.206-.592-.682-1.1-1.2-1.272-.847-.282-1.803-.276-2.516-.211a10 10 0 0 0-.443.05 9.4 9.4 0 0 0-.062-4.509A1.38 1.38 0 0 0 9.125.111zM11.5 14.721H8c-.51 0-.863-.069-1.14-.164-.281-.097-.506-.228-.776-.393l-.04-.024c-.555-.339-1.198-.731-2.49-.868-.333-.036-.554-.29-.554-.55V8.72c0-.254.226-.543.62-.65 1.095-.3 1.977-.996 2.614-1.708.635-.71 1.064-1.475 1.238-1.978.243-.7.407-1.768.482-2.85.025-.362.36-.594.667-.518l.262.066c.16.04.258.143.288.255a8.34 8.34 0 0 1-.145 4.725.5.5 0 0 0 .595.644l.003-.001.014-.003.058-.014a9 9 0 0 1 1.036-.157c.663-.06 1.457-.054 2.11.164.175.058.45.3.57.65.107.308.087.67-.266 1.022l-.353.353.353.354c.043.043.105.141.154.315.048.167.075.37.075.581 0 .212-.027.414-.075.582-.05.174-.111.272-.154.315l-.353.353.353.354c.047.047.109.177.005.488a2.2 2.2 0 0 1-.505.805l-.353.353.353.354c.006.005.041.05.041.17a.9.9 0 0 1-.121.416c-.165.288-.503.56-1.066.56z"/>
                          </svg>
                          {t('approve')}
                        </button>
                      </div>
                    </>
                  ) : null}
                </>
              )}
            </div>

          </div>
          <div className="card-body">
            {isEditingPayment ? (
              <form className="row g-3" onSubmit={handlePaymentUpdate}>
                <div className="col-md-4">
                  <label className="form-label text-muted small">{t('paymentType')}</label>
                  <PaymentConceptSelect
                    lang={locale}
                    value={paymentForm.payment_concept_id}
                    onChange={(value) => handlePaymentFormChange('payment_concept_id', value)}
                    disabled={isUpdatingPayment}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label text-muted small">{t('paymentThrough')}</label>
                  <PaymentThroughSelect
                    lang={locale}
                    value={paymentForm.payment_through_id}
                    onChange={(value) => handlePaymentFormChange('payment_through_id', value)}
                    disabled={isUpdatingPayment}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label text-muted small">{t('paymentMonth')}</label>
                  <input
                    type="month"
                    className="form-control"
                    value={paymentForm.payment_month}
                    onChange={(event) => handlePaymentFormChange('payment_month', event.target.value)}
                    disabled={isUpdatingPayment}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label text-muted small">{t('amount')}</label>
                  <input
                    type="number"
                    className="form-control"
                    value={paymentForm.amount}
                    onChange={(event) => handlePaymentFormChange('amount', event.target.value)}
                    disabled={isUpdatingPayment}
                    min="0"
                    step="1"
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label text-muted small">{t('paymentDate')}</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={paymentForm.payment_date}
                    onChange={(event) => handlePaymentFormChange('payment_date', event.target.value)}
                    disabled={isUpdatingPayment}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label text-muted small">{t('createdAt') ?? 'Creado el'}</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={paymentForm.created_at}
                    onChange={(event) => handlePaymentFormChange('created_at', event.target.value)}
                    disabled={isUpdatingPayment}
                    required
                  />
                </div>
                <div className="col-12">
                  <label className="form-label text-muted small">{t('comments')}</label>
                  <textarea
                    className="form-control"
                    value={paymentForm.comments}
                    onChange={(event) => handlePaymentFormChange('comments', event.target.value)}
                    disabled={isUpdatingPayment}
                    rows={3}
                  />
                </div>
                <div className="col-12 d-flex gap-2 justify-content-end">
                  <button type="button" className="btn btn-outline-secondary" onClick={handleCancelEdit} disabled={isUpdatingPayment}>
                    {t('cancel')}
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isUpdatingPayment}>
                    {isUpdatingPayment ? t('saving') || t('loading') : t('save') ?? t('approve')}
                  </button>
                </div>
              </form>
            ) : (
              <div className="row">
                <div className="col-md-3">
                  <div className="text-muted small mb-1">{t('paymentRequestDetail')}</div>
                  <div className="fw-semibold">#{payment.payment_id}</div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="text-muted small mb-1">{t('amount')}</div>
                  <div className="fw-semibold">${payment.amount?.toFixed(2)}</div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="text-muted small mb-1">{t('paymentDate')}</div>
                  <div className="fw-semibold">{formatDate(payment.payment_date, locale, { dateStyle: 'full', timeStyle: 'short' })}</div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="text-muted small mb-1">{t('status')}</div>
                  <small className={'cell-chip px-4 text-nowrap ' + (payment.payment_status_id === 3 ? 'bg-success' : payment.payment_status_id === 4 ? 'bg-danger' : 'bg-warning')}>
                    {payment.payment_status_name}
                  </small>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="text-muted small mb-1">{t('paymentType')}</div>
                  <div className="fw-semibold">{payment.pt_name}</div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="text-muted small mb-1">{t('paymentThrough')}</div>
                  <div className="fw-semibold">{payment.payt_name}</div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="text-muted small mb-1">{t('paymentReference')}</div>
                  <div className="fw-semibold">{payment.payment_reference || t('noInformation')}</div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="text-muted small mb-1">{t('paymentMonth')}</div>
                  <div className="fw-semibold">{formatDate(payment.payment_month, locale, {year: 'numeric', month: 'long'})}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card shadow-sm border-0">
          <div className="card-header border-bottom-0 bg-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">{t('receipt')}</h5>
            {hasReceipt ? (
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setShowModal(true)}>
                  {t('viewReceipt')}
                </button>
                {canUpdatePayment ? (
                  <button type="button" className="btn btn-outline-danger btn-sm" onClick={handleRemoveExistingReceipt}>
                    {t('removeReceipt')}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="card-body">
            {hasReceipt ? (
              <p className="mb-0 text-muted">{payment.receipt_file_name ?? t('receipt')}</p>
            ) : canUpdatePayment ? (
              <>
                <div
                  className={`border rounded p-4 text-center ${isDragOver ? 'bg-light' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <p className="mb-3">{t('uploadReceipt')}</p>
                  <label className="btn btn-outline-primary btn-sm mb-3">
                    {t('chooseFile')}
                    <input type="file" className="d-none" onChange={handleFileInputChange} />
                  </label>
                  {selectedFile ? (
                    <div className="d-flex align-items-center justify-content-center gap-2 mt-3">
                      <span className="text-muted">{selectedFile.name}</span>
                      <button type="button" className="btn btn-outline-danger btn-sm" onClick={handleRemoveFile}>
                        {t('removeReceipt')}
                      </button>
                    </div>
                  ) : (
                    <p className="text-muted small mb-0">{t('dropInstruction')}</p>
                  )}
                </div>
              </>
            ) : (
              <p className="mb-0 text-muted">{t('noReceiptPermission')}</p>
            )}
          </div>
        </div>
        <div className="card shadow-sm border-0">

          <div className="card shadow-none bg-light bg-gradient mb-3">
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
              ) : logs.length === 0 ? (
                <p className="text-muted mb-0">{t('noLogs')}</p>
              ) : (
                <div className="list-group list-group-flush">
                    <div className="list-group-item bg-transparent px-0">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="mb-3">
                          <span className="fw-medium">{payment.comments || t('noInformation')}</span>
                        </div>
                      </div>
                    </div>
                </div>
              )}
            </div>
          </div>

          <div className="card shadow-none bg-light bg-gradient">
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
                                      : change.from ?? '—'
                                }
                                {" → "}
                                {
                                  isDateField(change.field)
                                    ? formatDate(change.to, locale, { dateStyle: 'medium', timeStyle: 'short' })
                                    : isMonthField(change.field) 
                                      ? formatDate(change.to, locale, {year: 'numeric', month: 'long'})
                                      : change.to ?? '—'
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
      </div>

      {showModal && hasReceipt ? (
        <div className="modal fade show d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{payment.receipt_file_name ?? t('receipt')}</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body">
                <iframe title="receipt-preview" src={payment.receipt_path} className="w-100" style={{ minHeight: 400 }} />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </Layout>
  )
}
