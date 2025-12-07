import type { ChangeEvent } from 'react'
import { InfoCard } from './InfoCard'
import type { FormState } from '../types/FormState'
import type { Student, StudentCatalogs } from '../types/Student'

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
  const handleSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = event.target
    onChange(name as keyof FormState, value || undefined)
  }

  return (
    <InfoCard title="Institución" subtitle="Datos académicos">
      {isEditing ? (
        <div className="row gy-3">
          <section className="info-card h-100">
            <div className="info-card__header">
              <div>
                <p className="info-card__label">{institutionStrings.label}</p>
                <h3>{student.business_name || student.commercial_name || '—'}</h3>
                <p className="info-card__meta">{institutionStrings.meta}</p>
              </div>
              <div className="info-card__status">
                <span className="student-detail-page__chip chip--info">
                  {student.grade_group || institutionStrings.generationLabel}
                </span>
                <span className={`student-detail-page__chip ${student.group_enabled ? 'chip--success' : 'chip--warning'}`}>
                  {student.group_status || institutionStrings.groupStatus}
                </span>
              </div>
            </div>
            <div className="row">
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
          </section>
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          <div className="d-flex align-items-center justify-content-between">
            <span className="text-muted">Escuela</span>
            <span className="fw-semibold text-black">{student.institutionName || 'Sin escuela'}</span>
          </div>
          <div className="d-flex align-items-center justify-content-between">
            <span className="text-muted">Grupo</span>
            <span className="fw-semibold text-black">{student.groupName || 'Sin grupo'}</span>
          </div>
          <div className="d-flex align-items-center justify-content-between">
            <span className="text-muted">Referencia de pago</span>
            <span className="fw-semibold text-black">{student.paymentReference || 'No registrada'}</span>
          </div>
        </div>
      )}
    </InfoCard>
  )
}
