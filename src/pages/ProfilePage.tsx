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

  const profileInitials = useMemo(() => {
    const fallback = details?.username ?? ''
    const name = (details?.full_name ?? fallback).trim()
    if (!name) return 'U'
    const initials = name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('')
    return initials || 'U'
  }, [details?.full_name, details?.username])

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

  const statusClass = (status: string | null | undefined) => {
    if (!status) return 'chip--muted'
    const normalized = status.toLowerCase()
    if (normalized.includes('activo') || normalized.includes('active')) return 'chip--success'
    if (normalized.includes('inactivo') || normalized.includes('inactive')) return 'chip--warning'
    return 'chip--muted'
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
      <div className="profile-detail-page">
        <header className="profile-detail-page__header">
          <div className="profile-detail-page__identity">
            <div className="profile-detail-page__avatar">{profileInitials}</div>
            <div className="profile-detail-page__heading">
              <p className="profile-detail-page__sub">{t('profileSubtitle')}</p>
              <h2 className="profile-detail-page__title">{displayValue(details?.full_name)}</h2>
              <p className="profile-detail-page__meta">
                <span className="profile-detail-page__chip chip--info">{displayValue(details?.role_name)}</span>
                <span className={`profile-detail-page__chip ${statusClass(details?.user_status)}`}>
                  {displayValue(details?.user_status)}
                </span>
                <span className="profile-detail-page__chip chip--light">{formattedBalance}</span>
              </p>
            </div>
          </div>
          <div className="profile-detail-page__actions">
            {isLoading ? <span className="profile-detail-page__chip chip--muted">{t('profileLoading')}</span> : null}
          </div>
        </header>

        {loadError ? <div className="profile-detail-page__feedback">{loadError}</div> : null}

        <div className="profile-detail-page__grid">
          <section className="profile-card">
            <div className="profile-card__header">
              <h3 className="profile-card__title">{t('profilePersonalSection')}</h3>
            </div>
            <div className="profile-card__grid">
              <div className="profile-field">
                <span className="profile-field__label">{t('profileFullName')}</span>
                <p className="profile-field__value">{displayValue(details?.full_name)}</p>
              </div>
              <div className="profile-field">
                <span className="profile-field__label">{t('profileUsername')}</span>
                <p className="profile-field__value">{displayValue(details?.username)}</p>
              </div>
              <div className="profile-field">
                <span className="profile-field__label">{t('profileRole')}</span>
                <p className="profile-field__value">{displayValue(details?.role_name)}</p>
              </div>
              <div className="profile-field">
                <span className="profile-field__label">{t('profileBirthDate')}</span>
                <p className="profile-field__value">{displayValue(details?.birth_date)}</p>
              </div>
            </div>
          </section>

          <section className="profile-card">
            <div className="profile-card__header">
              <h3 className="profile-card__title">{t('profileContactSection')}</h3>
            </div>
            <div className="profile-card__grid">
              <div className="profile-field">
                <span className="profile-field__label">{t('profileEmail')}</span>
                <p className="profile-field__value">{displayValue(details?.email)}</p>
              </div>
              <div className="profile-field">
                <span className="profile-field__label">{t('profilePersonalEmail')}</span>
                <p className="profile-field__value">{displayValue(details?.personal_email)}</p>
              </div>
              <div className="profile-field">
                <span className="profile-field__label">{t('profilePhone')}</span>
                <p className="profile-field__value">{displayValue(details?.phone_number)}</p>
              </div>
              <div className="profile-field profile-field--full">
                <span className="profile-field__label">{t('profileAddress')}</span>
                <p className="profile-field__value">{fullAddress}</p>
              </div>
            </div>
          </section>

          <section className="profile-card">
            <div className="profile-card__header">
              <h3 className="profile-card__title">{t('profileSchoolSection')}</h3>
            </div>
            <div className="profile-card__grid">
              <div className="profile-field">
                <span className="profile-field__label">{t('profileCommercialName')}</span>
                <p className="profile-field__value">{displayValue(details?.commercial_name)}</p>
              </div>
              <div className="profile-field">
                <span className="profile-field__label">{t('profileBusinessName')}</span>
                <p className="profile-field__value">{displayValue(details?.business_name)}</p>
              </div>
              <div className="profile-field">
                <span className="profile-field__label">{t('profileTaxId')}</span>
                <p className="profile-field__value">{displayValue(details?.tax_id)}</p>
              </div>
              <div className="profile-field">
                <span className="profile-field__label">{t('profileSchoolStatus')}</span>
                <p className="profile-field__value">{displayValue(details?.school_status)}</p>
              </div>
            </div>
          </section>

          <section className="profile-card">
            <div className="profile-card__header">
              <h3 className="profile-card__title">{t('profileAccessSection')}</h3>
            </div>
            <div className="profile-card__grid">
              <div className="profile-field">
                <span className="profile-field__label">{t('profileUserStatus')}</span>
                <p className="profile-field__value">{displayValue(details?.user_status)}</p>
              </div>
              <div className="profile-field">
                <span className="profile-field__label">{t('profileRoleStatus')}</span>
                <p className="profile-field__value">{displayValue(details?.role_status)}</p>
              </div>
              <div className="profile-field">
                <span className="profile-field__label">{t('profileBalance')}</span>
                <p className="profile-field__value">{formattedBalance}</p>
              </div>
            </div>
          </section>
        </div>

        <section className="profile-card">
          <div className="profile-card__header">
            <h3 className="profile-card__title">{t('profilePasswordSection')}</h3>
            <p className="profile-card__subtitle">{t('profilePasswordHelper')}</p>
          </div>
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
        </section>
      </div>
    </Layout>
  )
}
