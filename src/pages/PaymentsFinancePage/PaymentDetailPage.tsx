import { useEffect, useMemo, useState, type ChangeEvent, type DragEvent } from 'react'
import { Layout } from '../../layout/Layout'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import type { BreadcrumbItem } from '../../components/Breadcrumb'
import { LoadingSkeleton } from '../../components/LoadingSkeleton'
import { API_BASE_URL } from '../../config'
import { formatDate } from '../../utils/formatDate'

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
    if (!token) return

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
  }, [locale, paymentId, t, token])

  useEffect(() => {
    if (!token) return

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
  }, [locale, paymentId, t, token])

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

  if (!hydrated) {
    return (
      <Layout onNavigate={onNavigate} pageTitle={t('paymentsFinance')} breadcrumbItems={breadcrumbItems}>
        <LoadingSkeleton variant="table" rowCount={10} />
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

  return (
    <Layout onNavigate={onNavigate} pageTitle={t('paymentDetail')} breadcrumbItems={breadcrumbItems}>
      <div className="d-flex flex-column gap-3">
        <div className="d-flex flex-wrap gap-2 justify-content-end">
          <button type="button" className="btn btn-outline-secondary" onClick={handlePrint}>
            {t('print')}
          </button>
          <button type="button" className="btn btn-outline-primary">
            {t('edit')}
          </button>
          <button type="button" className="btn btn-success">
            {t('approve')}
          </button>
          <button type="button" className="btn btn-outline-danger">
            {t('reject')}
          </button>
        </div>

        <div className="card shadow-sm border-0">
          <div className="card-header bg-white d-flex justify-content-between align-items-center">
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
                <div className="d-flex align-items-center gap-2">
                  <span className="text-muted">{t('email')}</span>
                  {payment.email ? (
                    <a className="btn btn-link p-0" href={`mailto:${payment.email}`}>
                      {payment.email}
                    </a>
                  ) : (
                    <span className="text-muted">{t('noInformation')}</span>
                  )}
                </div>
              </div>
              <div className="col-md-6">
                <div className="d-flex align-items-center gap-2">
                  <span className="text-muted">{t('phone')}</span>
                  {formatPhoneLink(payment.phone_number) ? (
                    <a
                      className="btn btn-link p-0"
                      href={formatPhoneLink(payment.phone_number) ?? '#'}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {payment.phone_number}
                    </a>
                  ) : (
                    <span className="text-muted">{t('noInformation')}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-0">
          <div className="card-header bg-white">
            <h5 className="mb-0">{t('paymentInformation')}</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mb-3">
                <strong className="d-block text-muted">{t('amount')}</strong>
                <span className="fw-semibold">${payment.amount?.toFixed(2)}</span>
              </div>
              <div className="col-md-6 mb-3">
                <strong className="d-block text-muted">{t('status')}</strong>
                <span className="fw-semibold">{payment.payment_status_name}</span>
              </div>
              <div className="col-md-6 mb-3">
                <strong className="d-block text-muted">{t('paymentType')}</strong>
                <span className="fw-semibold">{payment.pt_name}</span>
              </div>
              <div className="col-md-6 mb-3">
                <strong className="d-block text-muted">{t('paymentThrough')}</strong>
                <span className="fw-semibold">{payment.payt_name}</span>
              </div>
              <div className="col-md-6 mb-3">
                <strong className="d-block text-muted">{t('paymentReference')}</strong>
                <span className="fw-semibold">{payment.payment_reference || t('noInformation')}</span>
              </div>
              <div className="col-md-6 mb-3">
                <strong className="d-block text-muted">{t('paymentDate')}</strong>
                <span className="fw-semibold">{formatDate(payment.payment_date, locale, { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>
              <div className="col-md-6 mb-3">
                <strong className="d-block text-muted">{t('paymentMonth')}</strong>
                <span className="fw-semibold">{payment.payment_month}</span>
              </div>
              <div className="col-md-6 mb-3">
                <strong className="d-block text-muted">{t('comments')}</strong>
                <span className="fw-semibold">{payment.comments || t('noInformation')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-0">
          <div className="card-header bg-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">{t('receipt')}</h5>
            {payment.receipt_path && !hasRemovedReceipt ? (
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setShowModal(true)}>
                  {t('viewReceipt')}
                </button>
                <button type="button" className="btn btn-outline-danger btn-sm" onClick={handleRemoveExistingReceipt}>
                  {t('removeReceipt')}
                </button>
              </div>
            ) : null}
          </div>
          <div className="card-body">
            {payment.receipt_path && !hasRemovedReceipt ? (
              <p className="mb-0 text-muted">{payment.receipt_file_name ?? t('receipt')}</p>
            ) : (
              <>
                <div
                  className={`border rounded p-4 text-center ${isDragOver ? 'bg-light' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <p className="mb-2">{t('uploadReceipt')}</p>
                  <label className="btn btn-outline-primary btn-sm mb-0">
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
            )}
          </div>
        </div>

        <div className="card shadow-sm border-0">
          <div className="card-header bg-white">
            <h5 className="mb-0">{t('activityLog')}</h5>
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
                  <div key={`${log.updated_at}-${index}`} className="list-group-item px-0">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="fw-semibold">{log.responsable_full_name}</div>
                        <div className="text-muted small">{log.role_name}</div>
                      </div>
                      <div className="text-muted small">
                        {formatDate(log.updated_at, locale, { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="fw-semibold mb-1">{log.log_type_name}</div>
                      <ul className="mb-0 ps-3 small text-muted">
                        {log.changes?.map((change, changeIndex) => (
                          <li key={`${change.field}-${changeIndex}`}>
                            <span className="fw-semibold">{change.field ?? t('noInformation')}</span>: {change.from ?? '—'} → {change.to ?? '—'}
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

      {showModal && payment.receipt_path ? (
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
