import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import Swal from 'sweetalert2'
import PaymentConceptSelect from '../../../components/catalog/PaymentConceptSelect'
import StudentSearchDropdown from '../../../components/StudentSearchDropdown'
import { type FilterField } from '../../../components/FilterSidebar'
import Tabs from '../../../components/ui/Tabs'
import { useAuth } from '../../../context/AuthContext'
import { useLanguage } from '../../../context/LanguageContext'
import { API_BASE_URL } from '../../../config'
import { PaymentRequestsHistory } from './PaymentRequestsHistory'
import { PaymentRequestsScheduled } from './PaymentRequestsScheduled'

interface PaymentRequestsTabProps {
  onNavigate: (path: string) => void
}

type ApplyScope = 'school' | 'group' | 'student'

interface CreationResponse {
  type?: 'success' | 'error'
  title?: string
  message?: string
  data?: {
    mass_upload?: number
    created_count?: number
    duplicate_count?: number
    created?: Array<{
      full_name: string
      student_id: number
      register_id: string
      payment_request_id: number
    }>
  }
}

const initialPaymentRequestFormState = {
  payment_concept_id: '' as number | '',
  amount: '' as number | '',
  pay_by: '',
  comments: '',
  late_fee: '' as number | '',
  fee_type: '$' as '$' | '%',
  late_fee_frequency: '' as number | '',
  payment_month: '',
  partial_payment: false,
  school_id: '',
  group_id: '',
  student_id: '',
}

export function PaymentRequestsTab({ onNavigate }: PaymentRequestsTabProps) {
  const { token } = useAuth()
  const { locale, t } = useLanguage()

  const [activeTab, setActiveTab] = useState<'history' | 'scheduled'>('history')

  const [schoolOptions, setSchoolOptions] = useState<FilterField['options']>([])
  const [groupOptions, setGroupOptions] = useState<FilterField['options']>([])

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [applyScope, setApplyScope] = useState<ApplyScope>('school')
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; name: string } | null>(null)
  const [isSavingRequest, setIsSavingRequest] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [paymentRequestForm, setPaymentRequestForm] = useState({ ...initialPaymentRequestFormState })

  const paymentRequestTabs = useMemo(
    () => [
      { key: 'history', label: t('historyTab') },
      { key: 'scheduled', label: t('scheduledTab') },
    ],
    [t],
  )

  useEffect(() => {
    if (!token) return

    const controller = new AbortController()

    const fetchSchools = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/schools/list?lang=${locale}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const data = (await response.json()) as Array<{ school_id?: number | string; commercial_name?: string }>
        setSchoolOptions(
          data.map((item) => ({
            value: String(item.school_id ?? ''),
            label: item.commercial_name ?? '',
          })),
        )
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          console.error('Unable to fetch schools list', fetchError)
        }
      }
    }

    fetchSchools()

    return () => controller.abort()
  }, [locale, token])

  useEffect(() => {
    if (!token) return

    const controller = new AbortController()

    const fetchGroups = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/groups/catalog?lang=${locale}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const data = (await response.json()) as Array<{ group_id?: number | string; grade_group?: string }>
        setGroupOptions(
          data.map((item) => ({
            value: String(item.group_id ?? ''),
            label: item.grade_group ?? '',
          })),
        )
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          console.error('Unable to fetch groups catalog', fetchError)
        }
      }
    }

    fetchGroups()

    return () => controller.abort()
  }, [locale, token])

  const handleOpenCreateModal = () => {
    setCreateError(null)
    setPaymentRequestForm({ ...initialPaymentRequestFormState })
    setApplyScope('school')
    setSelectedStudent(null)
    setIsCreateModalOpen(true)
  }

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false)
    setCreateError(null)
    setSelectedStudent(null)
    setPaymentRequestForm({ ...initialPaymentRequestFormState })
  }

  const handleApplyScopeChange = (scope: ApplyScope) => {
    setApplyScope(scope)

    setPaymentRequestForm((prev) => ({
      ...prev,
      school_id: scope === 'school' ? prev.school_id : '',
      group_id: scope === 'group' ? prev.group_id : '',
      student_id: scope === 'student' ? prev.student_id : '',
    }))

    if (scope !== 'student') {
      setSelectedStudent(null)
    }
  }

  const handleFormChange = <Key extends keyof typeof paymentRequestForm>(
    key: Key,
    value: (typeof paymentRequestForm)[Key],
  ) => {
    setPaymentRequestForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const persistCreationResult = (massUploadId: number, data: NonNullable<CreationResponse['data']>) => {
    const storageKey = `paymentRequestUploadResult:${massUploadId}`
    const payload = {
      ...data,
      stored_at: Date.now(),
    }

    try {
      localStorage.setItem(storageKey, JSON.stringify(payload))
    } catch (storageError) {
      console.error('Unable to persist creation result', storageError)
    }
  }

  const handleCreationSuccessNavigation = (
    responseData: NonNullable<CreationResponse['data']>,
  ) => {
    if (!responseData.mass_upload) return

    persistCreationResult(responseData.mass_upload, responseData)

    onNavigate(`/${locale}/finance/request-upload/${responseData.mass_upload}`)
  }

  const handleCreatePaymentRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!token) return

    const targetKey: keyof typeof paymentRequestForm =
      applyScope === 'school'
        ? 'school_id'
        : applyScope === 'group'
          ? 'group_id'
          : 'student_id'

    if (!paymentRequestForm[targetKey]) {
      setCreateError(t('applyScopeRequired') ?? 'Selecciona a quién aplica la solicitud')
      return
    }

    const payload = {
      payment_concept_id: paymentRequestForm.payment_concept_id === '' ? undefined : Number(paymentRequestForm.payment_concept_id),
      amount: paymentRequestForm.amount === '' ? undefined : Number(paymentRequestForm.amount),
      pay_by: paymentRequestForm.pay_by || undefined,
      comments: paymentRequestForm.comments || undefined,
      late_fee: paymentRequestForm.late_fee === '' ? undefined : Number(paymentRequestForm.late_fee),
      fee_type: paymentRequestForm.fee_type,
      late_fee_frequency: paymentRequestForm.late_fee_frequency === '' ? undefined : Number(paymentRequestForm.late_fee_frequency),
      payment_month: paymentRequestForm.payment_month || undefined,
      partial_payment: paymentRequestForm.partial_payment,
      [targetKey]: paymentRequestForm[targetKey] ? Number(paymentRequestForm[targetKey]) : undefined,
    }

    setIsSavingRequest(true)
    setCreateError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/payment-requests/create?lang=${locale}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('failed_request')
      }

      const statusResponse = (await response.json()) as CreationResponse

      if (statusResponse?.type === 'success' && statusResponse?.data?.mass_upload) {
        persistCreationResult(statusResponse.data.mass_upload, statusResponse.data)
      }

      const swalResult = await Swal.fire({
        icon: statusResponse?.type,
        title: statusResponse?.title,
        text: statusResponse?.message,
        showCancelButton: statusResponse?.type === 'success',
        confirmButtonText: statusResponse?.type === 'success' ? t('viewDetails') : t('accept'),
        cancelButtonText: t('close'),
      })

      if (statusResponse?.type === 'success' && statusResponse?.data?.mass_upload) {
        handleCloseCreateModal()
        if (swalResult.isConfirmed) {
          handleCreationSuccessNavigation(statusResponse.data)
        }
      }
    } catch (requestError) {
      console.error('Unable to create payment request', requestError)
      setCreateError(t('defaultError'))
    } finally {
      setIsSavingRequest(false)
    }
  }

  return (
    <>
      <div className="students-page d-flex flex-column gap-3">
        {error ? (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        ) : null}

        <div className="card shadow-sm border-0">
          <div className="card-body">
            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
              <Tabs
                tabs={paymentRequestTabs}
                activeKey={activeTab}
                onSelect={(key) => setActiveTab(key as 'history' | 'scheduled')}
              />

              <div className="dropdown payment-requests__create-dropdown">
                <button
                  className="btn payment-requests__create-dropdown-toggle dropdown-toggle"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span className="payment-requests__create-icon" aria-hidden="true">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 5v14M5 12h14"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span className="fw-semibold">{t('createPaymentRequest')}</span>
                </button>

                <ul className="dropdown-menu dropdown-menu-end shadow-sm">
                  <li>
                    <button
                      type="button"
                      className="dropdown-item payment-requests__create-option"
                      onClick={handleOpenCreateModal}
                    >
                      <span
                        className="payment-requests__option-icon payment-requests__option-icon--single"
                        aria-hidden="true"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none">
                          <rect x="4" y="4" width="16" height="16" rx="4" fill="currentColor" />
                          <path
                            d="M12 8v8M8 12h8"
                            stroke="white"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <div className="d-flex flex-column text-start">
                        <span className="fw-semibold">{t('singleRequest')}</span>
                        <small className="text-muted">{t('singleRequestDescription')}</small>
                      </div>
                    </button>
                  </li>

                  <li>
                    <button type="button" className="dropdown-item payment-requests__create-option">
                      <span
                        className="payment-requests__option-icon payment-requests__option-icon--scheduled"
                        aria-hidden="true"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none">
                          <rect x="4" y="4" width="16" height="16" rx="4" fill="currentColor" />
                          <path
                            d="M9 10h6M9 14h3"
                            stroke="white"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M15 4v2m-6-2v2M8 8h8"
                            stroke="white"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <div className="d-flex flex-column text-start">
                        <span className="fw-semibold">{t('scheduledRequest')}</span>
                        <small className="text-muted">{t('scheduledRequestDescription')}</small>
                      </div>
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {activeTab === 'history' ? (
          <PaymentRequestsHistory
            onNavigate={onNavigate}
            schoolOptions={schoolOptions}
            active={activeTab === 'history'}
            tabs={paymentRequestTabs}
            onTabChange={setActiveTab}
          />
        ) : (
          <PaymentRequestsScheduled
            schoolOptions={schoolOptions}
            groupOptions={groupOptions}
            active={activeTab === 'scheduled'}
            tabs={paymentRequestTabs}
            onTabChange={setActiveTab}
          />
        )}
      </div>

      {isCreateModalOpen ? (
        <>
          <div className="modal fade show d-block" tabIndex={-1} role="dialog">
            <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header border-0 pb-0">
                  <div>
                    <p className="text-muted mb-1">Agrega solicitudes de pago para tus estudiantes.</p>
                    <h5 className="modal-title">Agregar solicitud de pago</h5>
                  </div>
                  <button type="button" className="btn-close" aria-label={t('close')} onClick={handleCloseCreateModal}></button>
                </div>

                <div className="modal-body">
                  {createError ? (
                    <div className="alert alert-danger" role="alert">
                      {createError}
                    </div>
                  ) : null}

                  <form className="d-flex flex-column gap-3" onSubmit={handleCreatePaymentRequest}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold" htmlFor="apply_scope">
                          Aplicar a
                        </label>
                        <select
                          id="apply_scope"
                          className="form-select"
                          value={applyScope}
                          onChange={(event) => handleApplyScopeChange(event.target.value as ApplyScope)}
                        >
                          <option value="school">Toda la escuela</option>
                          <option value="group">Grupo</option>
                          <option value="student">Estudiante</option>
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold" htmlFor="payment_concept_id">
                          Concepto de pago
                        </label>
                        <PaymentConceptSelect
                          id="payment_concept_id"
                          lang={locale}
                          value={paymentRequestForm.payment_concept_id}
                          onChange={(value) => handleFormChange('payment_concept_id', value)}
                          className="form-select"
                        />
                      </div>
                    </div>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold" htmlFor="amount">
                          Monto solicitado
                        </label>
                        <input
                          id="amount"
                          className="form-control"
                          type="number"
                          inputMode="decimal"
                          placeholder="Ej. 1200.00"
                          value={paymentRequestForm.amount}
                          onChange={(event) =>
                            handleFormChange(
                              'amount',
                              event.target.value === '' ? '' : Number(event.target.value),
                            )
                          }
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold" htmlFor="pay_by">
                          Fecha límite de pago
                        </label>
                        <input
                          id="pay_by"
                          className="form-control"
                          type="date"
                          value={paymentRequestForm.pay_by}
                          onChange={(event) => handleFormChange('pay_by', event.target.value)}
                        />
                      </div>
                    </div>

                    {applyScope === 'school' ? (
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label fw-semibold" htmlFor="school_id">
                            Escuela
                          </label>
                          <select
                            id="school_id"
                            className="form-select"
                            value={paymentRequestForm.school_id}
                            onChange={(event) => handleFormChange('school_id', event.target.value)}
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
                        <div className="col-md-6">
                          <label className="form-label fw-semibold" htmlFor="group_id">
                            Grupo
                          </label>
                          <select
                            id="group_id"
                            className="form-select"
                            value={paymentRequestForm.group_id}
                            onChange={(event) => handleFormChange('group_id', event.target.value)}
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
                        <div className="col-md-8">
                          <StudentSearchDropdown
                            label="Estudiante"
                            placeholder="Buscar alumno por nombre"
                            lang={locale}
                            onSelect={(student) => {
                              handleFormChange('student_id', String(student.student_id))
                              setSelectedStudent({ id: String(student.student_id), name: student.full_name })
                            }}
                          />
                          {selectedStudent ? (
                            <div className="d-flex align-items-center justify-content-between mt-2">
                              <span className="small text-muted">Seleccionado: {selectedStudent.name}</span>
                              <button
                                type="button"
                                className="btn btn-link btn-sm text-decoration-none"
                                onClick={() => {
                                  setSelectedStudent(null)
                                  handleFormChange('student_id', '')
                                }}
                              >
                                Limpiar
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}

                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold" htmlFor="late_fee">
                          Recargo
                        </label>
                        <input
                          id="late_fee"
                          className="form-control"
                          type="number"
                          inputMode="decimal"
                          placeholder="Ej. 1.00"
                          value={paymentRequestForm.late_fee}
                          onChange={(event) =>
                            handleFormChange(
                              'late_fee',
                              event.target.value === '' ? '' : Number(event.target.value),
                            )
                          }
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold" htmlFor="fee_type">
                          Tipo de recargo
                        </label>
                        <select
                          id="fee_type"
                          className="form-select"
                          value={paymentRequestForm.fee_type}
                          onChange={(event) => handleFormChange('fee_type', event.target.value as '$' | '%')}
                        >
                          <option value="$">$</option>
                          <option value="%">%</option>
                        </select>
                      </div>
                    </div>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold" htmlFor="late_fee_frequency">
                          Frecuencia de recargo (días)
                        </label>
                        <input
                          id="late_fee_frequency"
                          className="form-control"
                          type="number"
                          inputMode="numeric"
                          placeholder="Ej. 1"
                          value={paymentRequestForm.late_fee_frequency}
                          onChange={(event) =>
                            handleFormChange(
                              'late_fee_frequency',
                              event.target.value === '' ? '' : Number(event.target.value),
                            )
                          }
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold" htmlFor="payment_month">
                          Mes de pago
                        </label>
                        <input
                          id="payment_month"
                          className="form-control"
                          type="month"
                          value={paymentRequestForm.payment_month}
                          onChange={(event) => handleFormChange('payment_month', event.target.value)}
                        />
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <input
                        id="partial_payment"
                        className="form-check-input"
                        type="checkbox"
                        checked={paymentRequestForm.partial_payment}
                        onChange={(event) => handleFormChange('partial_payment', event.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="partial_payment">
                        Permitir pago parcial
                      </label>
                    </div>

                    <div>
                      <label className="form-label fw-semibold" htmlFor="comments">
                        Comentarios
                      </label>
                      <textarea
                        id="comments"
                        className="form-control"
                        rows={3}
                        placeholder="Ej. Colegiatura junio nuevo"
                        value={paymentRequestForm.comments}
                        onChange={(event) => handleFormChange('comments', event.target.value)}
                      />
                    </div>

                    <div className="d-flex align-items-center justify-content-end gap-2">
                      <button type="button" className="btn btn-link" onClick={handleCloseCreateModal}>
                        Cancelar
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={isSavingRequest}>
                        {isSavingRequest ? t('saving') : 'Crear solicitudes'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show"></div>
        </>
      ) : null}
    </>
  )
}
