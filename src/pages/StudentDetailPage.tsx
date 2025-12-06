import { useEffect, useMemo, useState } from 'react'
import { Layout } from '../layout/Layout'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { API_BASE_URL } from '../config'
import { DataTable, type DataTableColumn } from '../components/DataTable'
import type { BreadcrumbItem } from '../components/Breadcrumb'
import { LoadingSkeleton } from '../components/LoadingSkeleton'
import { formatDate } from '../utils/formatDate'
import './StudentDetailPage.css'

interface StudentDetailPageProps {
  onNavigate: (path: string) => void
  studentId: number
  language?: string
}

interface StudentDetail {
  student_id: number
  register_id: string
  full_name: string
  payment_reference: string | null
  generation: string | null
  scholar_level_name: string | null
  grade_group: string | null
  user_status: string | null
  status: number | null
  email: string | null
  personal_email: string | null
  phone_number: string | null
  birth_date: string | null
  address: string | null
  school_description?: string | null
}

interface PaymentRow {
  payment_id: number
  payment_status_name: string
  payment_date: string
  amount: number
  payment_concept_name?: string
}

interface PaymentRequestRow {
  payment_request_id: number
  pr_status_name: string
  total_amount: number
  due_date: string
  concept_name?: string
}

interface StudentDetailResponse {
  student_details?: StudentDetail | StudentDetail[]
  payments?: PaymentRow[]
  payment_requests?: PaymentRequestRow[]
  student?: StudentDetail | StudentDetail[]
}

function normalizeStudent(detail: StudentDetail | StudentDetail[] | undefined): StudentDetail | null {
  if (!detail) return null
  if (Array.isArray(detail)) return detail[0] ?? null
  return detail
}

function normalizePayments(value: unknown): PaymentRow[] {
  if (!Array.isArray(value)) return []
  return value.filter(Boolean) as PaymentRow[]
}

function normalizeRequests(value: unknown): PaymentRequestRow[] {
  if (!Array.isArray(value)) return []
  return value.filter(Boolean) as PaymentRequestRow[]
}

export default function StudentDetailPage({ onNavigate, studentId, language }: StudentDetailPageProps) {
  const { token, hydrated } = useAuth()
  const { locale, t } = useLanguage()

  const [student, setStudent] = useState<StudentDetail | null>(null)
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [requests, setRequests] = useState<PaymentRequestRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const breadcrumbItems: BreadcrumbItem[] = useMemo(
    () => [
      { label: t('portalTitle'), onClick: () => onNavigate(`/${locale}`) },
      { label: t('studentsGroups'), onClick: () => onNavigate(`/${locale}/students`) },
      { label: student?.full_name || t('studentDetail') },
    ],
    [locale, onNavigate, student?.full_name, t],
  )

  useEffect(() => {
    if (!token) return

    const controller = new AbortController()
    const fetchDetails = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({ lang: language ?? locale })
        const response = await fetch(
          `${API_BASE_URL}/students/student-details/${encodeURIComponent(studentId)}?${params.toString()}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          },
        )

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const json = (await response.json()) as StudentDetailResponse
        const normalizedStudent = normalizeStudent(json.student_details ?? json.student)
        setStudent(normalizedStudent)
        setPayments(normalizePayments(json.payments))
        setRequests(normalizeRequests(json.payment_requests))
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          setError(t('defaultError'))
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchDetails()

    return () => controller.abort()
  }, [language, locale, studentId, t, token])

  const paymentColumns: Array<DataTableColumn<PaymentRow>> = [
    { key: 'payment_id', label: t('paymentId') },
    { key: 'payment_concept_name', label: t('concept'), render: (row) => row.payment_concept_name ?? '—' },
    { key: 'payment_status_name', label: t('status') },
    { key: 'payment_date', label: t('date'), render: (row) => formatDate(row.payment_date, locale) },
    {
      key: 'amount',
      label: t('amount'),
      render: (row) => new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-MX', { style: 'currency', currency: 'MXN' }).format(row.amount),
    },
  ]

  const requestColumns: Array<DataTableColumn<PaymentRequestRow>> = [
    { key: 'payment_request_id', label: t('paymentRequestId') },
    { key: 'concept_name', label: t('concept'), render: (row) => row.concept_name ?? '—' },
    { key: 'pr_status_name', label: t('status') },
    { key: 'due_date', label: t('dueDate'), render: (row) => formatDate(row.due_date, locale) },
    {
      key: 'total_amount',
      label: t('amount'),
      render: (row) => new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-MX', { style: 'currency', currency: 'MXN' }).format(row.total_amount),
    },
  ]

  const statusChipClass = student?.status ? 'chip--success' : 'chip--warning'

  if (!hydrated) {
    return (
      <Layout onNavigate={onNavigate} pageTitle={t('studentDetail')} breadcrumbItems={breadcrumbItems}>
        <LoadingSkeleton variant="dashboard" cardCount={6} />
      </Layout>
    )
  }

  return (
    <Layout onNavigate={onNavigate} pageTitle={t('studentDetail')} breadcrumbItems={breadcrumbItems}>
      {isLoading ? (
        <LoadingSkeleton variant="dashboard" cardCount={6} />
      ) : error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : student ? (
        <div className="student-detail-page">
          <header className="student-detail-page__header">
            <div className="student-detail-page__heading">
              <div className="student-detail-page__identity">
                <div className="student-detail-page__avatar" aria-hidden="true">
                  {student.full_name?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="student-detail-page__sub">{student.register_id}</p>
                  <h1 className="h4 mb-0">{student.full_name}</h1>
                  <div className="student-detail-page__meta">
                    {student.grade_group ? <span className="student-detail-page__chip chip--info">{student.grade_group}</span> : null}
                    {student.scholar_level_name ? (
                      <span className="student-detail-page__chip chip--light">{student.scholar_level_name}</span>
                    ) : null}
                    {student.generation ? (
                      <span className="student-detail-page__chip chip--muted">{student.generation}</span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
            <div className="student-detail-page__meta">
              <span className={`student-detail-page__chip ${statusChipClass}`}>
                {student.user_status || t('status')}
              </span>
              {student.payment_reference ? (
                <span className="student-detail-page__chip chip--light">{student.payment_reference}</span>
              ) : null}
            </div>
          </header>

          <section className="row g-4">
            <div className="col-lg-6">
              <div className="card h-100 shadow-sm border-0">
                <div className="card-body">
                  <h2 className="h6 text-uppercase text-muted mb-3">{t('contactInformation')}</h2>
                  <div className="d-flex flex-column gap-2 text-muted">
                    <div><strong>{t('email')}:</strong> {student.email ?? '—'}</div>
                    <div><strong>{t('personalEmail')}:</strong> {student.personal_email ?? '—'}</div>
                    <div><strong>{t('phone')}:</strong> {student.phone_number ?? '—'}</div>
                    <div><strong>{t('birthDate')}:</strong> {formatDate(student.birth_date, locale) || '—'}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card h-100 shadow-sm border-0">
                <div className="card-body">
                  <h2 className="h6 text-uppercase text-muted mb-3">{t('address')}</h2>
                  <p className="mb-0 text-muted">{student.address ?? '—'}</p>
                  {student.school_description ? (
                    <p className="mb-0 mt-3 text-muted"><strong>{t('school')}:</strong> {student.school_description}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <section className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <p className="text-muted text-uppercase small mb-1">{t('payments')}</p>
                <h2 className="h5 mb-0">{t('paymentHistory')}</h2>
              </div>
            </div>
            <DataTable
              columns={paymentColumns}
              data={payments}
              isLoading={isLoading}
              emptyMessage={t('tableNoData')}
            />
          </section>

          <section className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <p className="text-muted text-uppercase small mb-1">{t('paymentRequests')}</p>
                <h2 className="h5 mb-0">{t('paymentRequests')}</h2>
              </div>
            </div>
            <DataTable
              columns={requestColumns}
              data={requests}
              isLoading={isLoading}
              emptyMessage={t('tableNoData')}
            />
          </section>
        </div>
      ) : (
        <div className="alert alert-warning" role="alert">
          {t('tableNoData')}
        </div>
      )}
    </Layout>
  )
}
