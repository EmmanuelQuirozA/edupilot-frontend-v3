import type { ChangeEvent } from 'react'
import { InfoCard } from './InfoCard'
import type { FormState } from '../types/FormState'
import type { Student } from '../types/Student'
import { formatDate } from "../../../utils/formatDate";

interface StudentContactCardProps {
  student: Student
  formValues: FormState
  formErrors: Partial<Record<keyof FormState, string>>
  isEditing: boolean
  onChange: (field: keyof FormState, value: string) => void
}

export function StudentContactCard({
  student,
  formValues,
  formErrors,
  isEditing,
  onChange,
}: StudentContactCardProps) {
  const emptyValue = '—'

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    onChange(name as keyof FormState, value)
  }

  return (
    <div className='col-md-12'>
      <div className="info-card">
        <div className="info-card__header">
          <div>
            <p className="info-card__label">{contactStrings.label}</p>
            <h3>{student.username}</h3>
            <p className="info-card__meta">{student.email || contactStrings.meta}</p>
          </div>
          <div className="info-card__status">
            <span className="student-detail-page__chip chip--info">
              {student.role_name || contactStrings.roleChip || roleFallback}
            </span>
            <span
              className={`student-detail-page__chip ${
                (isEditing ? userStatusDraft : student.user_enabled) ? 'chip--success' : 'chip--warning'
              }`}
            >
              {isEditing
                ? userStatusDraft
                  ? userStatusLabels.active
                  : userStatusLabels.inactive
                : student.user_status || contactStrings.roleStatusChip || contactStrings.emptyValue}
            </span>
          </div>
        </div>
        {isEditing ? (
          <>
            <div className="row">
              <div className='col-md-4'>
                {renderEditableField(contactStrings.fields.firstName, 'first_name', {
                  placeholder: contactStrings.fields.firstName,
                  inputClassName: 'input',
                })}
              </div>
              <div className='col-md-4'>
                {renderEditableField(contactStrings.fields.lastNameFather, 'last_name_father', {
                  placeholder: contactStrings.fields.lastNameFather,
                  inputClassName: 'input',
                })}
              </div>
              <div className='col-md-4'>
                {renderEditableField(contactStrings.fields.lastNameMother, 'last_name_mother', {
                  placeholder: contactStrings.fields.lastNameMother,
                  inputClassName: 'input',
                })}
              </div>
              <div className='col-md-4'>
                {renderEditableField(contactStrings.fields.birthDate, 'birth_date', {
                  placeholder: contactStrings.fields.birthDate,
                  type: 'date',
                  inputClassName: 'input',
                })}
              </div>
              <div className='col-md-4'>
                {renderEditableField(contactStrings.fields.phoneNumber, 'phone_number', {
                  placeholder: contactStrings.fields.phoneNumber,
                  inputClassName: 'input',
                })}
              </div>
              <div className='col-md-4'>
                {renderEditableField(contactStrings.fields.taxId, 'tax_id', {
                  placeholder: contactStrings.fields.taxId,
                  inputClassName: 'input',
                })}
              </div>
              <div className='col-md-4'>
                {renderEditableField(contactStrings.fields.email, 'email', {
                  placeholder: contactStrings.fields.email,
                  inputClassName: 'input',
                })}
              </div>
              <div className='col-md-4'>
                {renderEditableField(contactStrings.fields.personalEmail, 'personal_email', {
                  placeholder: contactStrings.fields.personalEmail,
                  inputClassName: 'input',
                })}
              </div>
            </div>
            <div className="row">
              <div className='col-md-4'>
                {renderEditableField(contactStrings.fields.street, 'street', {
                  placeholder: contactStrings.fields.street,
                  inputClassName: 'input',
                })}
              </div>
              <div className='col-md-4'>
                {renderEditableField(contactStrings.fields.extNumber, 'ext_number', {
                  placeholder: contactStrings.fields.extNumber,
                  inputClassName: 'input',
                })}
              </div>
              <div className='col-md-4'>
                {renderEditableField(contactStrings.fields.intNumber, 'int_number', {
                  placeholder: contactStrings.fields.intNumber,
                  inputClassName: 'input',
                })}
              </div>
              <div className='col-md-4'>
                {renderEditableField(contactStrings.fields.suburb, 'suburb', {
                  placeholder: contactStrings.fields.suburb,
                  inputClassName: 'input',
                })}
              </div>
              <div className='col-md-4'>
                {renderEditableField(contactStrings.fields.locality, 'locality', {
                  placeholder: contactStrings.fields.locality,
                  inputClassName: 'input',
                })}
              </div>
              <div className='col-md-4'>
                {renderEditableField(contactStrings.fields.municipality, 'municipality', {
                  placeholder: contactStrings.fields.municipality,
                  inputClassName: 'input',
                })}
              </div>
              <div className='col-md-4'>
                {renderEditableField(contactStrings.fields.state, 'state', {
                  placeholder: contactStrings.fields.state,
                  inputClassName: 'input',
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="info-card__summary">
            <p className="info-card__summary-title">{contactStrings.summaryTitle}</p>
            <div className="row">
              <div className='col-md-4'>
                <dt>{contactStrings.fields.firstName}:</dt>{' '}
                {student.full_name}
              </div>
              <div className='col-md-4'>
                <dt>{contactStrings.summary.phone}:</dt>{' '}
                {whatsappLink ? (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="payment-request-detail__phone-link"
                  >
                    <WhatsappIcon />
                    <span className='text-black'>{normalizedStudentPhone}</span>
                  </a>
                ) : (
                  student.phone_number || emptyValue
                )}
                {/* <dt>{contactStrings.summary.phone}:</dt>{' '}
                {student.phone_number || emptyValue} */}
              </div>
              <div className='col-md-4'>
                <dt>{contactStrings.summary.birthDate}:</dt>{' '}
                {formatDateValue(student.birth_date, language) || emptyValue}
              </div>
              <div className='col-md-4'>
                <dt>{contactStrings.summary.taxId}:</dt>{' '}
                {student.tax_id || emptyValue}
              </div>
              <div className='col-md-4'>
                <dt>{contactStrings.summary.institutionalEmail}:</dt>{' '}
                {normalizedEmail ? (
                  <button
                    type="button"
                    className="student-detail-page__email-button"
                    onClick={handleEmailClick}
                  >
                    <EmailIcon />
                    <span className='text-black'>{normalizedEmail}</span>
                  </button>
                ) : (
                  <span>—</span>
                )}
                {/* {student.email || emptyValue} */}
              </div>
              <div className='col-md-4'>
                <dt>{contactStrings.summary.personalEmail}:</dt>{' '}
                {normalizedPersonalEmail ? (
                  <button
                    type="button"
                    className="student-detail-page__email-button"
                    onClick={handlePersonalEmailClick}
                  >
                    <EmailIcon />
                    <span className='text-black'>{normalizedPersonalEmail}</span>
                  </button>
                ) : (
                  <span>—</span>
                )}
                {/* <dt>{contactStrings.summary.personalEmail}:</dt>{' '}
                {student.personal_email || emptyValue} */}
              </div>
            </div>
            <div className="info-card__address">
              <p className="info-card__summary-title">{contactStrings.summary.address}</p>
              <p className="info-card__meta">{contactStrings.addressHelper}</p>
              <p className="field__value">{buildAddressString(student, emptyValue)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
