import { useMemo, type ChangeEvent, type ReactNode } from 'react'
import type { FormState } from '../types/FormState'
import type { Student, StudentCatalogs } from '../types/Student'
import { useLanguage } from '../../../context/LanguageContext'

interface StudentInstitutionCardProps {
  student: Student
  formValues: FormState
  formErrors: Partial<Record<keyof FormState, string>>
  isEditing: boolean
  catalogs: StudentCatalogs
  onChange: (field: keyof FormState, value: string | number | undefined) => void
}

interface SelectOption {
  value: string | number
  label: string
  meta?: {
    generation?: string
    gradeGroup?: string
    scholarLevel?: string
  }
}

export function StudentInstitutionCard({
  student,
  formValues,
  formErrors,
  isEditing,
  catalogs,
  onChange,
}: StudentInstitutionCardProps) {
  const emptyValue = '—'
  const { t } = useLanguage()

  const institutionStrings = {
    fields: {
      school: t('school') || 'Institución',
      groupId: t('groupId') || 'Grupo',
      curp: t('curp') || 'CURP',
      scholarLevel: t('scholarLevel') || 'Nivel escolar',
    },
  }

  const handleSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = event.target
    onChange(name as keyof FormState, value || undefined)
  }

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    onChange(name as keyof FormState, value)
  }

  const selectedSchoolId = formValues.school_id ?? student.school_id
  const selectedGroupId = formValues.group_id ?? student.group_id

  const schoolOptions: SelectOption[] = useMemo(
    () => catalogs.schools.map((school) => ({ value: school.id, label: school.label })),
    [catalogs.schools],
  )

  const groupOptions: SelectOption[] = useMemo(
    () =>
      catalogs.groups.map((group) => ({
        value: group.group_id,
        label: `${group.grade_group || 'Grupo'} - ${group.scholar_level_name || 'Nivel'}`.trim(),
        meta: {
          generation: group.generation,
          gradeGroup: group.grade_group,
          scholarLevel: group.scholar_level_name,
        },
      })),
    [catalogs.groups],
  )

  const selectedSchool = schoolOptions.find((item) => String(item.value) === String(selectedSchoolId))
  const selectedGroup = groupOptions.find((item) => String(item.value) === String(selectedGroupId))

  const renderEditableField = (
    label: string,
    name: keyof FormState,
    { placeholder = '', type = 'text', valueOverride, errorOverride, inputClassName = 'input' } = {},
  ) => {
    const value = valueOverride ?? formValues[name] ?? ''
    const error = errorOverride ?? formErrors[name]
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

  const renderSelectField = (
    label: string,
    name: keyof FormState,
    options: SelectOption[],
    { placeholder = '', displayValueOverride = null, helperContent = null }: { placeholder?: string; displayValueOverride?: string | null; helperContent?: ReactNode } = {},
  ) => {
    const value = formValues[name] ?? ''
    const error = formErrors[name]
    const displayValue =
      displayValueOverride ?? options.find((item) => String(item.value) === String(value))?.label ?? emptyValue

    return (
      <label className="field">
        <span>{label}</span>
        {isEditing ? (
          <>
            <select
              name={name}
              value={value as string | number}
              onChange={handleSelectChange}
              className={ error ? 'input select select--error' : 'input select'}
            >
              <option value="">{placeholder}</option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {helperContent}
          </>
        ) : (
          <p className="field__value">{displayValue}</p>
        )}
        {isEditing && error ? <span className="input__error">{error}</span> : null}
      </label>
    )
  }

  return (
    <div className="student-card__info">
      <div>
        <p className="info-card__label">{t('school')}</p>
        <h3>{student.business_name || student.commercial_name || emptyValue}</h3>
        <p className="info-card__meta">{t('metaSchoolCard')}</p>
      </div>
      {isEditing ? (
        <div className="row gy-3">
          <div className="col-md-4">
            {renderSelectField(institutionStrings.fields.school, 'school_id', schoolOptions, {
              placeholder: institutionStrings.fields.school,
              displayValueOverride:
                selectedSchool?.label || student.business_name || student.commercial_name || emptyValue,
            })}
          </div>
          <div className="col-md-4">
            {renderSelectField(institutionStrings.fields.groupId, 'group_id', groupOptions, {
              placeholder: institutionStrings.fields.groupId,
              displayValueOverride:
                selectedGroup?.label ||
                student.grade_group ||
                `${student.grade || ''} ${student.group || ''}`.trim() ||
                emptyValue,
              helperContent: (
                <p className="form-text text-muted mb-0">
                  {t('generation')}: {selectedGroup?.meta?.generation || student.generation || emptyValue} · {t('class')}: {selectedGroup?.meta?.gradeGroup || student.grade_group || emptyValue} · {t('level')}: {selectedGroup?.meta?.scholarLevel || student.scholar_level_name || emptyValue}
                </p>
              ),
            })}
          </div>
          <div className="col-md-4">
            {renderEditableField(institutionStrings.fields.curp, 'curp', {
              placeholder: institutionStrings.fields.curp,
              inputClassName: 'input',
            })}
          </div>
        </div>
      ) : (
        <div className="row gy-3">
          <div className="col-md-4">
            <div className="field">
              <span>{institutionStrings.fields.school}</span>
              <div className="field__value">{student.business_name || emptyValue}</div>
            </div>
          </div>
          <div className="col-md-8">
            <div className="field">
              <span>{institutionStrings.fields.scholarLevel}</span>
              <div className="field__value">
                {t('generation')}: {selectedGroup?.meta?.generation || student.generation || emptyValue} · {t('class')}: {selectedGroup?.meta?.gradeGroup || student.grade_group || emptyValue} · {t('level')}: {selectedGroup?.meta?.scholarLevel || student.scholar_level_name || emptyValue}
              </div>
            </div>
          </div>
          <div className="col-md-4">
            {renderEditableField(institutionStrings.fields.curp, 'curp', {
              placeholder: institutionStrings.fields.curp,
              inputClassName: 'input',
            })}
          </div>
        </div>
      )}
    </div>
  )
}
