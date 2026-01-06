import type React from 'react'
import PaymentConceptSelect from '../../../components/catalog/PaymentConceptSelect'
import StudentSearchDropdown from '../../../components/StudentSearchDropdown'
import type { FilterField } from '../../../components/FilterSidebar'
import { initialPaymentRequestFormState } from './paymentRequestsFormState'

export type ApplyScope = 'school' | 'group' | 'student'

export type SelectedStudent = {
  id: string;
  name: string;
  student_id: string;
  full_name: string;
  register_id: string;
  grade_group: string;
  generation: string;
  scholar_level_name: string;
}

export type TranslationFunction = (key: string) => string | undefined

interface CreatePaymentRequestModalProps {
  isOpen: boolean
  applyScope: ApplyScope
  createError: string | null
  isSavingRequest: boolean
  locale: string
  onApplyScopeChange: (scope: ApplyScope) => void
  onClose: () => void
  onFormChange: <Key extends keyof typeof initialPaymentRequestFormState>(
    key: Key,
    value: (typeof initialPaymentRequestFormState)[Key],
  ) => void
  onStudentSelect: (student: SelectedStudent) => void
  onSubmit: React.FormEventHandler<HTMLFormElement>
  paymentRequestForm: typeof initialPaymentRequestFormState
  schoolOptions: FilterField['options']
  groupOptions: FilterField['options']
  selectedStudent: SelectedStudent | null
  t: TranslationFunction
}

export function CreatePaymentRequestModal({
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
}: CreatePaymentRequestModalProps) {
  if (!isOpen) return null

  return (
    <>
      <div className="modal fade show d-block" tabIndex={-1} role="dialog" onClick={onClose}>
        <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="text-muted mb-1">{t('paymentRequestModalDescription')}</p>
                <h5 className="modal-title">{t('addPaymentRequest')}</h5>
                <h5 className="modal-title fw-semibold">Agregar solicitud de pago</h5>
                <p className="text-muted mb-1">Agrega solicitudes de pago para tus estudiantes.</p>
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
                    <label className="form-label fw-semibold" htmlFor="apply_scope">
                      {t('applyTo')}
                    </label>
                    <select
                      id="apply_scope"
                      className="form-select"
                      value={applyScope}
                      onChange={(event) => onApplyScopeChange(event.target.value as ApplyScope)}
                    >
                      <option value="school">{t('allSchool')}</option>
                      <option value="group">{t('class')}</option>
                      <option value="student">{t('student')}</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold" htmlFor="payment_concept_id">
                      {t('payment_concept_id')}
                    </label>
                    <PaymentConceptSelect
                      id="payment_concept_id"
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
                      <label className="form-label fw-semibold" htmlFor="school_id">
                        {t('school')}
                      </label>
                      <select
                        id="school_id"
                        className="form-select"
                        value={paymentRequestForm.school_id}
                        onChange={(event) => onFormChange('school_id', event.target.value)}
                      >
                        <option value="">{t('selectSchoolOption')}</option>
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
                      <label className="form-label fw-semibold" htmlFor="group_id">
                        {t('class')}
                      </label>
                      <select
                        id="group_id"
                        className="form-select"
                        value={paymentRequestForm.group_id}
                        onChange={(event) => onFormChange('group_id', event.target.value)}
                      >
                        <option value="">{t('selectGroupOption')}</option>
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
                        label={t('student')}
                        placeholder={t('searchStudentByName')}
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
                    <label className="form-label fw-semibold" htmlFor="amount">
                      {t('requestedAmount')}
                    </label>
                    <input
                      id="amount"
                      className="form-control"
                      type="number"
                      inputMode="decimal"
                      placeholder="1200.00"
                      value={paymentRequestForm.amount}
                      onChange={(event) =>
                        onFormChange('amount', event.target.value === '' ? '' : Number(event.target.value))
                      }
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold" htmlFor="pay_by">
                      {t('paymentDeadline')}
                    </label>
                    <input
                      id="pay_by"
                      className="form-control"
                      type="date"
                      value={paymentRequestForm.pay_by}
                      onChange={(event) => onFormChange('pay_by', event.target.value)}
                    />
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold" htmlFor="late_fee">
                      {t('late_fee')}
                    </label>
                    <input
                      id="late_fee"
                      className="form-control"
                      type="number"
                      inputMode="decimal"
                      placeholder="Ej. 1.00"
                      value={paymentRequestForm.late_fee}
                      onChange={(event) =>
                        onFormChange('late_fee', event.target.value === '' ? '' : Number(event.target.value))
                      }
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold" htmlFor="fee_type">
                      {t('fee_type')}
                    </label>
                    <select
                      id="fee_type"
                      className="form-select"
                      value={paymentRequestForm.fee_type}
                      onChange={(event) => onFormChange('fee_type', event.target.value as '$' | '%')}
                    >
                      <option value="$">$</option>
                      <option value="%">%</option>
                    </select>
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold" htmlFor="late_fee_frequency">
                      {t('late_fee_frequency')}
                    </label>
                    <input
                      id="late_fee_frequency"
                      className="form-control"
                      type="number"
                      inputMode="numeric"
                      placeholder="Ej. 1"
                      value={paymentRequestForm.late_fee_frequency}
                      onChange={(event) =>
                        onFormChange(
                          'late_fee_frequency',
                          event.target.value === '' ? '' : Number(event.target.value),
                        )
                      }
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold" htmlFor="payment_month">
                      {t('payment_month')}
                    </label>
                    <input
                      id="payment_month"
                      className="form-control"
                      type="month"
                      value={paymentRequestForm.payment_month}
                      onChange={(event) => onFormChange('payment_month', event.target.value)}
                    />
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <input
                    id="partial_payment"
                    className="form-check-input"
                    type="checkbox"
                    checked={paymentRequestForm.partial_payment}
                    onChange={(event) => onFormChange('partial_payment', event.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="partial_payment">
                    {t('allowPartialPayment')}
                  </label>
                </div>

                <div>
                  <label className="form-label fw-semibold" htmlFor="comments">
                    {t('comments')}
                  </label>
                  <textarea
                    id="comments"
                    className="form-control"
                    rows={3}
                    placeholder={t('commentsPlaceholder')}
                    value={paymentRequestForm.comments}
                    onChange={(event) => onFormChange('comments', event.target.value)}
                  />
                </div>

                <div className="d-flex align-items-center justify-content-end gap-2">
                  <button type="button" className="btn btn-link" onClick={onClose}>
                    {t('cancel')}
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isSavingRequest}>
                    {isSavingRequest ? t('saving') : t('createRequests')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show"></div>
    </>
  )
}
