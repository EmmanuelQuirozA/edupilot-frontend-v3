import { useMemo, type ChangeEvent } from 'react'
import { InfoCard } from './InfoCard'
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

  const renderSelectField = (
    label,
    name,
    options,
    { placeholder = '', displayValueOverride = null, helperContent = null } = {},
  ) => {
    const value = formValues[name] ?? '';
    const error = formErrors[name];
    const displayValue = displayValueOverride ?? options.find((item) => String(item.value) === String(value))?.label;

  const groupOptions = useMemo(
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
    [groupsCatalog],
  );

  return (
    <div>
      <div>
        <p className="info-card__label">{t('institute')}</p>
        <h3>{student.business_name || student.commercial_name || '—'}</h3>
        <p className="info-card__meta">{t('metaSchoolCard')}</p>
      </div>
      {isEditing ? (
          <>
            <div className='col-md-4'>
              {renderSelectField(
                institutionStrings.fields.schoolId,
                'school_id',
                schoolOptions,
                {
                  placeholder: institutionStrings.fields.schoolId,
                  displayValueOverride:
                    selectedSchool?.label ||
                    student.school_name ||
                    student.business_name ||
                    student.commercial_name,
                },
              )}
            </div>
            <div className='col-md-4'>
              {renderSelectField(
                institutionStrings.fields.groupId,
                'group_id',
                groupOptions,
                {
                  placeholder: institutionStrings.fields.groupId,
                  displayValueOverride:
                    selectedGroup?.label ||
                    student.grade_group ||
                    `${student.grade || ''} ${student.group || ''}`.trim(),
                  helperContent: (
                    <p className="form-text text-muted mb-0">
                      Generación: {selectedGroup?.meta?.generation || student.generation || emptyValue} · Grupo: {selectedGroup?.meta?.gradeGroup || student.grade_group || emptyValue} · Nivel: {selectedGroup?.meta?.scholarLevel || student.scholar_level_name || emptyValue}
                    </p>
                  ),
                },
              )}
            </div>
            <div className='col-md-4'>
              {renderEditableField(institutionStrings.fields.curp, 'curp', {
                placeholder: institutionStrings.fields.curp,
                inputClassName: 'input',
              })}
            </div>
          </>
        ) : (
          <>
            <div className='col-md-4'>
              <div className="field">
                <span>{institutionStrings.fields.schoolId}</span>
                <div className='field__value'>{student.business_name}</div>
              </div>
            {/* {renderEditableField(institutionStrings.fields.schoolId, 'business_name', {
              placeholder: institutionStrings.fields.schoolId,
              inputClassName: 'input',
            })} */}
            </div>
            <div className='col-md-8'>
              <div className="field">
                <span>{institutionStrings.fields.scholarLevel}</span>
                <div className='field__value'>Generación: {selectedGroup?.meta?.generation || student.generation || emptyValue} · Grupo: {selectedGroup?.meta?.gradeGroup || student.grade_group || emptyValue} · Nivel: {selectedGroup?.meta?.scholarLevel || student.scholar_level_name || emptyValue}</div>
              </div>
            </div>
            <div className='col-md-4'>
            {renderEditableField(institutionStrings.fields.curp, 'curp', {
              placeholder: institutionStrings.fields.curp,
              inputClassName: 'input',
            })}
            </div>
          </>
        )}
    </div>
  )
}
