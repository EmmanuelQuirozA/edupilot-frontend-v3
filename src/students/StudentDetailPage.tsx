import { useEffect, useMemo, useState } from 'react'
import { Layout } from '../layout/Layout'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { API_BASE_URL } from '../config'
import type { BreadcrumbItem } from '../components/Breadcrumb'
import { LoadingSkeleton } from '../components/LoadingSkeleton'
import type { FormState, PaymentRow, RequestRow, Student, TopupRow, TuitionRow } from './types'
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
import type { StudentCatalogs } from './components/StudentInstitutionCard'

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

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [userStatusDraft, setUserStatusDraft] = useState(false)

  const [tuitionRows] = useState<TuitionRow[]>([])
  const [paymentRows] = useState<PaymentRow[]>([])
  const [requestRows] = useState<RequestRow[]>([])
  const [topupRows] = useState<TopupRow[]>([])
  const [formValues, setFormValues] = useState<FormState>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    institutionName: '',
    status: '',
  })
  const [formErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [catalogs] = useState<StudentCatalogs>({
    institutions: [],
    statuses: [],
  })

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

  useEffect(() => {
    setFormValues((previous) => ({
      ...previous,
      firstName: student?.firstName ?? '',
      lastName: student?.lastName ?? '',
      email: student?.email ?? '',
      phone: student?.phone ?? '',
      institutionName: student?.institutionName ?? '',
      status: student?.status ?? '',
    }))
  }, [student])

  const handleFormChange = (field: keyof FormState, value: FormState[keyof FormState]) => {
    setFormValues((previous) => ({
      ...previous,
      [field]: typeof value === 'string' ? value : value ?? '',
    }))
  }

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

  const statusLabels = useMemo(
    () => ({
      active: t('schoolStatusActive'),
      inactive: t('schoolStatusInactive'),
    }),
    [t],
  )

  const studentName = useMemo(() => {
    if (!student) {
      return t('student')
    }

    const parts = [student.firstName, student.lastName].filter(Boolean)
    if (parts.length) {
      return parts.join(' ')
    }

    return student.email ?? t('student')
  }, [student, t])

  const studentInitials = useMemo(() => {
    if (!student) return ''

    const names = [student.firstName, student.lastName].filter(Boolean)
    if (!names.length && student.email) {
      return student.email.substring(0, 2).toUpperCase()
    }

    return names
      .join(' ')
      .split(' ')
      .filter(Boolean)
      .map((namePart) => namePart[0]?.toUpperCase() ?? '')
      .join('')
      .slice(0, 2)
  }, [student])

  const normalizeStatus = (value?: string) => value?.toLowerCase().trim()

  useEffect(() => {
    setUserStatusDraft(normalizeStatus(student?.status) === normalizeStatus(statusLabels.active))
  }, [statusLabels.active, student])

  const activeInGroupLabel = locale === 'es' ? 'Activo en grupo' : 'Active in group'
  const resetPasswordLabel = locale === 'es' ? 'Restablecer contraseña' : 'Reset password'

  const handleStartEdit = () => setIsEditing(true)

  const handleCancelEdit = () => {
    setIsEditing(false)
    setUserStatusDraft(normalizeStatus(student?.status) === normalizeStatus(statusLabels.active))
  }

  const handleSave = () => {
    setIsSaving(true)
    setIsEditing(false)
    setIsSaving(false)
  }

  const statusTone =
    normalizeStatus(student?.status) === normalizeStatus(statusLabels.active) ? 'success' : 'warning'

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

        <StudentHeader
          isLoading={isLoading}
          initials={studentInitials}
          studentName={studentName}
          activeInGroupLabel={activeInGroupLabel}
          statusChipLabel={student?.status ?? statusLabels.inactive}
          roleChipLabel={student?.institutionName ?? t('student')}
          statusTone={statusTone}
          isEditing={isEditing}
          isSaving={isSaving}
          isStatusActive={userStatusDraft}
          statusLabels={statusLabels}
          onStatusToggle={setUserStatusDraft}
          onStartEdit={handleStartEdit}
          onCancelEdit={handleCancelEdit}
          onSave={handleSave}
          editButtonLabel={t('edit')}
          cancelButtonLabel={t('cancel')}
          saveButtonLabel={t('save')}
          savingLabel={t('saving')}
          resetPasswordLabel={resetPasswordLabel}
          disableActions={isLoading}
        />

        <div className="row g-3">
          <div className="col-12 col-lg-6">
            <StudentInstitutionCard
              student={student}
              formValues={formValues}
              formErrors={formErrors}
              isEditing={isEditing}
              onChange={handleFormChange}
              catalogs={catalogs}
            />
          </div>
          <div className="col-12 col-lg-6">
            <StudentContactCard
              student={student}
              formValues={formValues}
              formErrors={formErrors}
              isEditing={isEditing}
              onChange={handleFormChange}
            />
          </div>
        </div>

        <TabbedSection tabs={tabConfig} />
      </div>
    </Layout>
  )
}
