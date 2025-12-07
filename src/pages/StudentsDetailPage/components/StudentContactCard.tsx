import { useCallback, type ChangeEvent } from 'react'
import type { FormState } from '../types/FormState'
import type { Student } from '../types/Student'
import { formatDate } from "../../../utils/formatDate";
import { useLanguage } from '../../../context/LanguageContext'

interface StudentContactCardProps {
  student: Student
  formValues: FormState
  formErrors: Partial<Record<keyof FormState, string>>
  isEditing: boolean
  onChange: (field: keyof FormState, value: string) => void
}

const EmailIcon = () => (
  <svg
    className="contact-icon"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm0 2v.01L12 13l8-5.99V7H4zm0 10h16V9.24l-7.553 5.65a1 1 0 0 1-1.194 0L4 9.24V17z" />
  </svg>
);

const WhatsappIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-whatsapp" viewBox="0 0 16 16">
    <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
  </svg>
);

export function StudentContactCard({
  student,
  formValues,
  formErrors,
  isEditing,
  onChange,
}: StudentContactCardProps) {
  const { t, locale } = useLanguage()
  const emptyValue = '—'

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    onChange(name as keyof FormState, value)
  }

  const studentPhone = student?.phone_number;
  const normalizedStudentPhone = typeof studentPhone === 'string' ? student?.phone_number.trim() : '';
  const whatsappPhoneNumber = normalizedStudentPhone.replace(/\D+/g, '');
  const whatsappLink = whatsappPhoneNumber ? `https://wa.me/${whatsappPhoneNumber}` : '';

  const studentEmail = student?.email;
  const normalizedEmail = typeof studentEmail === 'string' ? student.email.trim() : '';

  const handleEmailClick = useCallback(() => {
    if (!normalizedEmail) {
      return;
    }

    const mailto = `mailto:${encodeURIComponent(normalizedEmail)}`;
    if (typeof window !== 'undefined') {
      window.location.href = mailto;
    }
  }, [normalizedEmail]);

  const renderEditableField = (
    label: string,
    name: keyof FormState,
    { placeholder = '', type = 'text', valueOverride, inputClassName = 'input' } = {},
  ) => {
    const value = valueOverride ?? formValues[name] ?? ''
    const error = formErrors[name]
    const displayValue = value || emptyValue

    return (
      <label className="field">
        <span>{label}</span>
        {isEditing ? (
          <input
            type={type}
            name={name}
            value={value as string | number}
            onChange={handleInputChange}
            className={error ? `${inputClassName} input--error` : inputClassName}
            placeholder={placeholder}
          />
        ) : (
          <p className="field__value">{displayValue}</p>
        )}
        {isEditing && error ? <span className="input__error">{error}</span> : null}
      </label>
    )
  }

  return (
    <div className="col-md-12">
      <div className="card gap-3">
        <div className="info-card__header">
          <div>
            <p className="info-card__label">{t('contactInfoTitle')}</p>
            <h3>{student.username}</h3>
            <p className="info-card__meta">
              {student.email || t('contactInfoSubtitle')}
            </p>
          </div>
          <div className="info-card__status">
            <span className="student-detail-page__chip chip--info">
              {student.role_name || t('roleFallback')}
            </span>
            <span
              className={`student-detail-page__chip ${
                (isEditing ? student.user_enabled : student.user_enabled)
                  ? 'chip--success'
                  : 'chip--warning'
              }`}
            >
              {student.user_status || t('statusFallback')}
            </span>
          </div>
        </div>

        {isEditing ? (
          <>
            <div className="row">
              <div className="col-md-4">
                {renderEditableField(t('firstName'), 'first_name', {
                  placeholder: t('firstName'),
                })}
              </div>
              <div className="col-md-4">
                {renderEditableField(t('lastNameFather'), 'last_name_father', {
                  placeholder: t('lastNameFather'),
                })}
              </div>
              <div className="col-md-4">
                {renderEditableField(t('lastNameMother'), 'last_name_mother', {
                  placeholder: t('lastNameMother'),
                })}
              </div>

              <div className="col-md-4">
                {renderEditableField(t('birthDate'), 'birth_date', {
                  placeholder: t('birthDate'),
                  type: 'date',
                })}
              </div>
              <div className="col-md-4">
                {renderEditableField(t('phoneNumber'), 'phone_number', {
                  placeholder: t('phoneNumber'),
                })}
              </div>
              <div className="col-md-4">
                {renderEditableField(t('taxId'), 'tax_id', {
                  placeholder: t('taxId'),
                })}
              </div>

              <div className="col-md-4">
                {renderEditableField(t('institutionalEmail'), 'email', {
                  placeholder: t('institutionalEmail'),
                })}
              </div>
              <div className="col-md-4">
                {renderEditableField(t('personalEmail'), 'personal_email', {
                  placeholder: t('personalEmail'),
                })}
              </div>
            </div>

            <div className="row">
              <div className="col-md-4">
                {renderEditableField(t('street'), 'street', { placeholder: t('street') })}
              </div>
              <div className="col-md-4">
                {renderEditableField(t('extNumber'), 'ext_number', { placeholder: t('extNumber') })}
              </div>
              <div className="col-md-4">
                {renderEditableField(t('intNumber'), 'int_number', { placeholder: t('intNumber') })}
              </div>
              <div className="col-md-4">
                {renderEditableField(t('suburb'), 'suburb', { placeholder: t('suburb') })}
              </div>
              <div className="col-md-4">
                {renderEditableField(t('locality'), 'locality', { placeholder: t('locality') })}
              </div>
              <div className="col-md-4">
                {renderEditableField(t('municipality'), 'municipality', {
                  placeholder: t('municipality'),
                })}
              </div>
              <div className="col-md-4">
                {renderEditableField(t('state'), 'state', { placeholder: t('state') })}
              </div>
            </div>
          </>
        ) : (
          <div className="info-card__summary">
            <p className="info-card__summary-title">{t('mainData')}</p>
            <div className="row">
              <div className="col-md-4">
                <dt>{t('name')}:</dt> {student.full_name}
              </div>
              <div className="col-md-4">
                <dt>{t('phone')}:</dt>{' '}
                {whatsappLink ? (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="phone-link"
                  >
                    <WhatsappIcon />
                    <span className='text-black'>{normalizedStudentPhone}</span>
                  </a>
                ) : (
                  student.phone_number || emptyValue
                )}
              </div>
              <div className="col-md-4">
                <dt>{t('birthDate')}:</dt>{' '}
                {formatDate(student.birth_date, locale) || emptyValue}
              </div>
              <div className="col-md-4">
                <dt>{t('taxId')}:</dt> {student.tax_id || emptyValue}
              </div>
              <div className="col-md-4">
                <dt>{t('institutionalEmail')}:</dt>{' '}
                {normalizedEmail ? (
                  <button
                    type="button"
                    className="email-button"
                    onClick={handleEmailClick}
                  >
                    <EmailIcon />
                    <span className='text-black'>{normalizedEmail}</span>
                  </button>
                ) : (
                  <span>—</span>
                )}
              </div>
              <div className="col-md-4">
                <dt>{t('personalEmail')}:</dt> {student.personal_email || emptyValue}
              </div>
            </div>

            <div className="info-card__address">
              <p className="info-card__summary-title">{t('address')}</p>
              <p className="info-card__meta">{t('addressHelper')}</p>
              <p className="field__value">
                {[
                  student.street,
                  student.ext_number,
                  student.int_number,
                  student.suburb,
                  student.locality,
                  student.municipality,
                  student.state,
                ]
                  .filter(Boolean)
                  .join(', ') || emptyValue}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}