import type React from 'react'
import PaymentConceptSelect from '../../../components/catalog/PaymentConceptSelect'
import StudentSearchDropdown from '../../../components/StudentSearchDropdown'
import type { FilterField } from '../../../components/FilterSidebar'
import type { ApplyScope, SelectedStudent, TranslationFunction } from './CreatePaymentRequestModal'
import type { PaymentRequestScheduleFormState } from './paymentRequestsScheduleFormState'

interface CreatePaymentScheduleModalProps {
  isOpen: boolean
  applyScope: ApplyScope
  createError: string | null
  isSavingRequest: boolean
  locale: string
  onApplyScopeChange: (scope: ApplyScope) => void
  onClose: () => void
  onFormChange: <Key extends keyof PaymentRequestScheduleFormState>(
    key: Key,
    value: PaymentRequestScheduleFormState[Key],
  ) => void
  onStudentSelect: (student: SelectedStudent) => void
  onSubmit: React.FormEventHandler<HTMLFormElement>
  paymentRequestForm: PaymentRequestScheduleFormState
  schoolOptions: FilterField['options']
  groupOptions: FilterField['options']
  selectedStudent: SelectedStudent | null
  t: TranslationFunction
  periodOptions: FilterField['options']
  minExecutionDate: string
}

export function CreatePaymentScheduleModal({
  applyScope,
  createError,
  groupOptions,
  isOpen,
  isSavingRequest,
  locale,
  onApplyScopeChange,
  onClose,
  onFormChange,
  onStudentSelect,
  onSubmit,
  paymentRequestForm,
  schoolOptions,
  selectedStudent,
  t,
  periodOptions,
  minExecutionDate,
}: CreatePaymentScheduleModalProps) {
  if (!isOpen) return null

  return (
    <>
      <div className="modal fade show d-block" tabIndex={-1} role="dialog" onClick={onClose}>
        <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header border-0 pb-0">
              <div>
                <p className="text-muted mb-1">Agrega reglas para generar solicitudes de pago.</p>
                <h5 className="modal-title">Agendar solicitud de pago</h5>
              </div>
              <button type="button" className="btn-close" aria-label={t('close')} onClick={onClose}></button>
            </div>

            <div className="modal-body">
              {createError ? (
                <div className="alert alert-danger" role="alert">
                  {createError}
                </div>
              ) : null}

              <form className="d-flex flex-column gap-3" onSubmit={onSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold" htmlFor="apply_scope_schedule">
                      Aplicar a
                    </label>
                    <select
                      id="apply_scope_schedule"
                      className="form-select"
                      value={applyScope}
                      onChange={(event) => onApplyScopeChange(event.target.value as ApplyScope)}
                    >
                      <option value="school">Toda la escuela</option>
                      <option value="group">Grupo</option>
                      <option value="student">Estudiante</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold" htmlFor="payment_concept_id_schedule">
                      Concepto de pago
                    </label>
                    <PaymentConceptSelect
                      id="payment_concept_id_schedule"
                      lang={locale}
                      value={paymentRequestForm.payment_concept_id}
                      onChange={(value) => onFormChange('payment_concept_id', value)}
                      className="form-select"
                    />
                  </div>
                </div>

                {applyScope === 'school' ? (
                  <div className="row g-3">
                    <div className="col-md-12">
                      <label className="form-label fw-semibold" htmlFor="school_id_schedule">
                        Escuela
                      </label>
                      <select
                        id="school_id_schedule"
                        className="form-select"
                        value={paymentRequestForm.school_id}
                        onChange={(event) => onFormChange('school_id', event.target.value)}
                      >
                        <option value="">Selecciona una escuela</option>
                        {schoolOptions?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : null}

                {applyScope === 'group' ? (
                  <div className="row g-3">
                    <div className="col-md-12">
                      <label className="form-label fw-semibold" htmlFor="group_id_schedule">
                        Grupo
                      </label>
                      <select
                        id="group_id_schedule"
                        className="form-select"
                        value={paymentRequestForm.group_id}
                        onChange={(event) => onFormChange('group_id', event.target.value)}
                      >
                        <option value="">Selecciona un grupo</option>
                        {groupOptions?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : null}

                {applyScope === 'student' ? (
                  <div className="row g-3">
                    <div className="col-md-12">
                      <StudentSearchDropdown
                        label="Estudiante"
                        placeholder="Buscar alumno por nombre"
                        lang={locale}
                        onSelect={onStudentSelect}
                        value={selectedStudent ? [selectedStudent] : []}
                        onClear={() => onFormChange('student_id', '')}
                      />
                    </div>
                  </div>
                ) : null}

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold" htmlFor="rule_name_es">
                      Nombre de la regla (ES)
                    </label>
                    <input
                      id="rule_name_es"
                      className="form-control"
                      type="text"
                      value={paymentRequestForm.rule_name_es}
                      onChange={(event) => onFormChange('rule_name_es', event.target.value)}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold" htmlFor="rule_name_en">
                      Nombre de la regla (EN)
                    </label>
                    <input
                      id="rule_name_en"
                      className="form-control"
                      type="text"
                      value={paymentRequestForm.rule_name_en}
                      onChange={(event) => onFormChange('rule_name_en', event.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label fw-semibold" htmlFor="amount_schedule">
                      Monto solicitado
                    </label>
                    <input
                      id="amount_schedule"
                      className="form-control"
                      type="number"
                      inputMode="decimal"
                      placeholder="Ej. 1500.00"
                      value={paymentRequestForm.amount}
                      onChange={(event) =>
                        onFormChange('amount', event.target.value === '' ? '' : Number(event.target.value))
                      }
                      required
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-semibold" htmlFor="fee_type">
                      Tipo de recargo
                    </label>
                    <select
                      id="fee_type"
                      className="form-select"
                      value={paymentRequestForm.fee_type}
                      onChange={(event) => onFormChange('fee_type', event.target.value as PaymentRequestScheduleFormState['fee_type'])}
                    >
                      <option value="$">Monto fijo ($)</option>
                      <option value="%">Porcentaje (%)</option>
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-semibold" htmlFor="late_fee">
                      Recargo por mora
                    </label>
                    <input
                      id="late_fee"
                      className="form-control"
                      type="number"
                      inputMode="decimal"
                      placeholder="Ej. 50.00"
                      value={paymentRequestForm.late_fee}
                      onChange={(event) =>
                        onFormChange('late_fee', event.target.value === '' ? '' : Number(event.target.value))
                      }
                      required
                    />
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label fw-semibold" htmlFor="late_fee_frequency">
                      Frecuencia de recargo
                    </label>
                    <input
                      id="late_fee_frequency"
                      className="form-control"
                      type="number"
                      value={paymentRequestForm.late_fee_frequency}
                      onChange={(event) =>
                        onFormChange(
                          'late_fee_frequency',
                          event.target.value === '' ? '' : Number(event.target.value),
                        )
                      }
                      required
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-semibold" htmlFor="period_of_time_id">
                      Periodicidad
                    </label>
                    <select
                      id="period_of_time_id"
                      className="form-select"
                      value={paymentRequestForm.period_of_time_id}
                      onChange={(event) => onFormChange('period_of_time_id', Number(event.target.value))}
                    >
                      {periodOptions?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-semibold" htmlFor="interval_count">
                      Intervalo
                    </label>
                    <input
                      id="interval_count"
                      className="form-control"
                      type="number"
                      value={paymentRequestForm.interval_count}
                      onChange={(event) =>
                        onFormChange('interval_count', event.target.value === '' ? '' : Number(event.target.value))
                      }
                      required
                    />
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold" htmlFor="start_date">
                      Fecha de inicio
                    </label>
                    <input
                      id="start_date"
                      className="form-control"
                      type="date"
                      value={paymentRequestForm.start_date}
                      onChange={(event) => onFormChange('start_date', event.target.value)}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold" htmlFor="end_date">
                      Fecha de fin (opcional)
                    </label>
                    <input
                      id="end_date"
                      className="form-control"
                      type="date"
                      value={paymentRequestForm.end_date}
                      onChange={(event) => onFormChange('end_date', event.target.value)}
                    />
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold" htmlFor="next_execution_date">
                      Próxima ejecución
                    </label>
                    <input
                      id="next_execution_date"
                      className="form-control"
                      type="date"
                      value={paymentRequestForm.next_execution_date}
                      min={minExecutionDate}
                      onChange={(event) => onFormChange('next_execution_date', event.target.value)}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold" htmlFor="comments">
                      Comentarios (opcional)
                    </label>
                    <textarea
                      id="comments"
                      className="form-control"
                      rows={1}
                      value={paymentRequestForm.comments}
                      onChange={(event) => onFormChange('comments', event.target.value)}
                    ></textarea>
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2 pt-2">
                  <button type="button" className="btn btn-light" onClick={onClose}>
                    {t('cancel')}
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isSavingRequest}>
                    {isSavingRequest ? t('saving') : t('save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  )
}
