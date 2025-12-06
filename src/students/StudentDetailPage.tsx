import { useEffect, useMemo, useState } from 'react'
import { Layout } from '../layout/Layout'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { API_BASE_URL } from '../config'
import type { BreadcrumbItem } from '../components/Breadcrumb'
import { LoadingSkeleton } from '../components/LoadingSkeleton'
import type { PaymentRow, RequestRow, Student, TopupRow, TuitionRow } from './types'
import {
  StudentContactCard,
  StudentHeader,
  StudentInstitutionCard,
  StudentPaymentsTable,
  StudentRequestsTable,
  StudentTopupsTable,
  StudentTuitionTable,
  TabbedSection,
} from './components'

interface StudentDetailPageProps {
  onNavigate: (path: string) => void
  studentId: number
  language?: string
}

export default function StudentDetailPage({ onNavigate, studentId, language: _language }: StudentDetailPageProps) {
  const { token, hydrated } = useAuth()
  const { locale, t } = useLanguage()

  const [student, setStudent] = useState<Student | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [tuitionRows] = useState<TuitionRow[]>([])
  const [paymentRows] = useState<PaymentRow[]>([])
  const [requestRows] = useState<RequestRow[]>([])
  const [topupRows] = useState<TopupRow[]>([])

  const breadcrumbItems: BreadcrumbItem[] = useMemo(
    () => [
      {
        label: t('portalTitle'),
        onClick: () => onNavigate(`/${locale}`),
      },
      { label: t('studentsTitle') },
      { label: t('viewDetails') },
    ],
    [locale, onNavigate, t],
  )

  useEffect(() => {
    if (!token) return

    const controller = new AbortController()
    setIsLoading(true)
    setError(null)

    // Placeholder effect to be expanded with real data fetching in later steps
    ;(async () => {
      try {
        const params = new URLSearchParams({ lang: locale })
        void params
        void fetch
        void API_BASE_URL
        void controller
        setStudent((previous) => previous ?? null)
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          setError(t('defaultError'))
        }
      } finally {
        setIsLoading(false)
      }
    })()

    return () => controller.abort()
  }, [locale, studentId, t, token])

  const tabConfig = useMemo(
    () => [
      {
        key: 'tuition',
        label: t('tuitionLabel'),
        content: <StudentTuitionTable data={tuitionRows} isLoading={isLoading} />,
      },
      {
        key: 'payments',
        label: t('paymentsLabel'),
        content: <StudentPaymentsTable data={paymentRows} isLoading={isLoading} />,
      },
      {
        key: 'requests',
        label: t('requestsLabel'),
        content: <StudentRequestsTable data={requestRows} isLoading={isLoading} />,
      },
      {
        key: 'topups',
        label: t('topupsLabel'),
        content: <StudentTopupsTable data={topupRows} isLoading={isLoading} />,
      },
    ],
    [isLoading, paymentRows, requestRows, t, topupRows, tuitionRows],
  )

  if (!hydrated) {
    return (
      <Layout onNavigate={onNavigate} pageTitle={t('studentsTitle')} breadcrumbItems={breadcrumbItems}>
        <LoadingSkeleton variant="table" rowCount={10} />
      </Layout>
    )
  }

  return (
    <Layout onNavigate={onNavigate} pageTitle={t('studentsTitle')} breadcrumbItems={breadcrumbItems}>
      <div className="d-flex flex-column gap-3">
        {error ? (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        ) : null}

        <StudentHeader student={student} isLoading={isLoading} />

        <div className="row g-3">
          <div className="col-12 col-lg-6">
            <StudentInstitutionCard student={student} />
          </div>
          <div className="col-12 col-lg-6">
            <StudentContactCard student={student} />
          </div>
        </div>

        <TabbedSection tabs={tabConfig} />
      </div>
    </Layout>
  )
}
