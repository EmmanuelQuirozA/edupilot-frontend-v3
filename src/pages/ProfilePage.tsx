import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Layout } from '../layout/Layout'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { API_BASE_URL } from '../config'
import type { BreadcrumbItem } from '../components/Breadcrumb'
import './ProfilePage.css'

declare const Swal: any

interface ProfilePageProps {
  onNavigate: (path: string) => void
}

interface SelfDetails {
  user_id: number
  person_id: number
  school_id: number | null
  role_id: number | null
  email: string | null
  username: string | null
  role_name: string | null
  full_name: string | null
  address: string | null
  commercial_name: string | null
  business_name: string | null
  first_name: string | null
  last_name_father: string | null
  last_name_mother: string | null
  birth_date: string | null
  phone_number: string | null
  tax_id: string | null
  street: string | null
  ext_number: string | null
  int_number: string | null
  suburb: string | null
  locality: string | null
  municipality: string | null
  state: string | null
  personal_email: string | null
  user_enabled: boolean
  role_enabled: boolean
  school_enabled: boolean
  user_status: string | null
  role_status: string | null
  school_status: string | null
  balance: number | null
}

interface PasswordFormState {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

export function ProfilePage({ onNavigate }: ProfilePageProps) {
  const { token } = useAuth()
  const { locale, t } = useLanguage()
  const [details, setDetails] = useState<SelfDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const formattedBalance = useMemo(() => {
    if (details?.balance == null) return t('notAvailable')
    const formatter = new Intl.NumberFormat(locale === 'es' ? 'es-MX' : 'en-US', {
      style: 'currency',
      currency: 'MXN',
    })
    return formatter.format(details.balance)
  }, [details?.balance, locale, t])

  useEffect(() => {
    if (!token) return

    const controller = new AbortController()
    const fetchDetails = async () => {
      try {
        setIsLoading(true)
        setLoadError(null)

        const response = await fetch(`${API_BASE_URL}/users/self-details`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const data = (await response.json()) as SelfDetails
        setDetails(data)
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setLoadError(t('defaultError'))
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchDetails()

    return () => controller.abort()
  }, [token, t])

  const breadcrumbItems: BreadcrumbItem[] = useMemo(
    () => [
      { label: t('portalTitle'), onClick: () => onNavigate(`/${locale}`) },
      { label: t('profileTitle') },
    ],
    [locale, onNavigate, t],
  )

  const handlePasswordChange = (field: keyof PasswordFormState, value: string) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }))
  }

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!token || isSubmitting) return

    if (passwordForm.newPassword.trim() !== passwordForm.confirmPassword.trim()) {
      setPasswordError(t('passwordMismatch'))
      return
    }

    try {
      setPasswordError(null)
      setIsSubmitting(true)

      const response = await fetch(`${API_BASE_URL}/users/password`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword,
        }),
      })

      const responseData = await response.json().catch(() => null)

      if (!response.ok) {
        await Swal.fire({
          icon: 'error',
          title: responseData?.title ?? t('defaultError'),
          text: responseData?.message ?? t('defaultError'),
        })
        throw new Error('failed_request')
      }

      await Swal.fire({
        icon: responseData?.type === 'success' ? 'success' : 'info',
        title: responseData?.title ?? t('success'),
        text: responseData?.message ?? '',
      })

      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        setPasswordError(t('defaultError'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayValue = (value: string | number | null | undefined) => {
    if (value == null || value === '') return t('notAvailable')
    return String(value)
  }

  const fullAddress =
    details?.street || details?.suburb || details?.municipality || details?.state
      ? [
          details?.street,
          details?.ext_number,
          details?.int_number,
          details?.suburb,
          details?.locality,
          details?.municipality,
          details?.state,
        ]
          .filter((item) => item && item.trim().length > 0)
          .join(', ')
      : t('notAvailable')

  return (
    <Layout onNavigate={onNavigate} pageTitle={t('profileTitle')} breadcrumbItems={breadcrumbItems}>
      <div className="profile-page d-flex flex-column gap-4">
        <div className="card shadow-sm border-0">
          <div className="card-body">
            <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-lg-between gap-3">
              <div>
                <h2 className="h5 mb-1">{t('profileGreeting')}</h2>
                <p className="text-muted mb-0">{t('profileSubtitle')}</p>
              </div>
              {isLoading ? (
                <span className="badge text-bg-light">{t('profileLoading')}</span>
              ) : null}
            </div>
            {loadError ? <div className="alert alert-danger mt-3 mb-0">{loadError}</div> : null}
          </div>
        </div>

        <div className="profile-page__grid">
          <section className="card shadow-sm border-0">
            <div className="card-body">
              <h3 className="h6 mb-3">{t('profilePersonalSection')}</h3>
              <div className="profile-page__details">
                <div>
                  <span className="text-muted small">{t('profileFullName')}</span>
                  <p className="mb-0">{displayValue(details?.full_name)}</p>
                </div>
                <div>
                  <span className="text-muted small">{t('profileUsername')}</span>
                  <p className="mb-0">{displayValue(details?.username)}</p>
                </div>
                <div>
                  <span className="text-muted small">{t('profileRole')}</span>
                  <p className="mb-0">{displayValue(details?.role_name)}</p>
                </div>
                <div>
                  <span className="text-muted small">{t('profileBirthDate')}</span>
                  <p className="mb-0">{displayValue(details?.birth_date)}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="card shadow-sm border-0">
            <div className="card-body">
              <h3 className="h6 mb-3">{t('profileContactSection')}</h3>
              <div className="profile-page__details">
                <div>
                  <span className="text-muted small">{t('profileEmail')}</span>
                  <p className="mb-0">{displayValue(details?.email)}</p>
                </div>
                <div>
                  <span className="text-muted small">{t('profilePersonalEmail')}</span>
                  <p className="mb-0">{displayValue(details?.personal_email)}</p>
                </div>
                <div>
                  <span className="text-muted small">{t('profilePhone')}</span>
                  <p className="mb-0">{displayValue(details?.phone_number)}</p>
                </div>
                <div className="profile-page__full-width">
                  <span className="text-muted small">{t('profileAddress')}</span>
                  <p className="mb-0">{fullAddress}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="card shadow-sm border-0">
            <div className="card-body">
              <h3 className="h6 mb-3">{t('profileSchoolSection')}</h3>
              <div className="profile-page__details">
                <div>
                  <span className="text-muted small">{t('profileCommercialName')}</span>
                  <p className="mb-0">{displayValue(details?.commercial_name)}</p>
                </div>
                <div>
                  <span className="text-muted small">{t('profileBusinessName')}</span>
                  <p className="mb-0">{displayValue(details?.business_name)}</p>
                </div>
                <div>
                  <span className="text-muted small">{t('profileTaxId')}</span>
                  <p className="mb-0">{displayValue(details?.tax_id)}</p>
                </div>
                <div>
                  <span className="text-muted small">{t('profileSchoolStatus')}</span>
                  <p className="mb-0">{displayValue(details?.school_status)}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="card shadow-sm border-0">
            <div className="card-body">
              <h3 className="h6 mb-3">{t('profileAccessSection')}</h3>
              <div className="profile-page__details">
                <div>
                  <span className="text-muted small">{t('profileUserStatus')}</span>
                  <p className="mb-0">{displayValue(details?.user_status)}</p>
                </div>
                <div>
                  <span className="text-muted small">{t('profileRoleStatus')}</span>
                  <p className="mb-0">{displayValue(details?.role_status)}</p>
                </div>
                <div>
                  <span className="text-muted small">{t('profileBalance')}</span>
                  <p className="mb-0">{formattedBalance}</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="card shadow-sm border-0">
          <div className="card-body">
            <h3 className="h6 mb-3">{t('profilePasswordSection')}</h3>
            <p className="text-muted">{t('profilePasswordHelper')}</p>
            <form className="profile-page__password-form" onSubmit={handlePasswordSubmit}>
              <div>
                <label className="form-label" htmlFor="oldPassword">
                  {t('profileOldPassword')}
                </label>
                <input
                  id="oldPassword"
                  type="password"
                  className="form-control"
                  value={passwordForm.oldPassword}
                  onChange={(event) => handlePasswordChange('oldPassword', event.target.value)}
                  required
                />
              </div>
              <div>
                <label className="form-label" htmlFor="newPassword">
                  {t('profileNewPassword')}
                </label>
                <input
                  id="newPassword"
                  type="password"
                  className="form-control"
                  value={passwordForm.newPassword}
                  onChange={(event) => handlePasswordChange('newPassword', event.target.value)}
                  required
                />
              </div>
              <div>
                <label className="form-label" htmlFor="confirmPassword">
                  {t('profileConfirmPassword')}
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="form-control"
                  value={passwordForm.confirmPassword}
                  onChange={(event) => handlePasswordChange('confirmPassword', event.target.value)}
                  required
                />
              </div>
              {passwordError ? (
                <div className="alert alert-danger mb-0" role="alert">
                  {passwordError}
                </div>
              ) : null}
              <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? t('profileSaving') : t('profileUpdatePassword')}
              </button>
            </form>
          </div>
        </section>
      </div>
    </Layout>
  )
}
