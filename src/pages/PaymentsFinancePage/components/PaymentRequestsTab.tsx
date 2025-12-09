import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { type FilterField } from '../../../components/FilterSidebar'
import Tabs from '../../../components/ui/Tabs'
import { useAuth } from '../../../context/AuthContext'
import { useLanguage } from '../../../context/LanguageContext'
import { API_BASE_URL } from '../../../config'
import {
  CreatePaymentRequestModal,
  type ApplyScope,
  type SelectedStudent,
} from './CreatePaymentRequestModal'
import { initialPaymentRequestFormState } from './paymentRequestsFormState'
import { PaymentRequestsHistory } from './PaymentRequestsHistory'
import { PaymentRequestsScheduled } from './PaymentRequestsScheduled'

interface PaymentRequestsTabProps {
  onNavigate: (path: string) => void
}

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

export function PaymentRequestsTab({ onNavigate }: PaymentRequestsTabProps) {
  const { token } = useAuth()
  const { locale, t } = useLanguage()

  const [activeTab, setActiveTab] = useState<'history' | 'scheduled'>('history')

  const [schoolOptions, setSchoolOptions] = useState<FilterField['options']>([])
  const [groupOptions, setGroupOptions] = useState<FilterField['options']>([])

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [applyScope, setApplyScope] = useState<ApplyScope>('school')
  const [selectedStudent, setSelectedStudent] = useState<SelectedStudent | null>(null)
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
    }

    setIsSavingRequest(true)
    setCreateError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/payment-requests/create?lang=${locale}&${[targetKey]}=${paymentRequestForm[targetKey] ? Number(paymentRequestForm[targetKey]) : undefined}`, {
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

        <div className='d-flex justify-content-between'>
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
                  <span className="d-flex flex-column align-items-start">
                    <span className="fw-semibold">{t('createSingleRequest')}</span>
                    <small className="text-muted">{t('createSingleRequestDescription')}</small>
                  </span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="dropdown-item payment-requests__create-option"
                  onClick={() => onNavigate(`/${locale}/finance/request-upload`)}
                >
                  <span
                    className="payment-requests__option-icon payment-requests__option-icon--mass"
                    aria-hidden="true"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="3" width="11" height="11" rx="3" fill="currentColor" />
                      <rect x="10" y="10" width="11" height="11" rx="3" fill="currentColor" fillOpacity="0.7" />
                      <path
                        d="M9 8.5h6m-3 3V5.5"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span className="d-flex flex-column align-items-start">
                    <span className="fw-semibold">{t('massUpload')}</span>
                    <small className="text-muted">{t('massUploadDescription')}</small>
                  </span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {activeTab === 'history' ? (
          <PaymentRequestsHistory active={activeTab === 'history'} tabs={paymentRequestTabs} onTabChange={setActiveTab} />
        ) : (
          <PaymentRequestsScheduled
            active={activeTab === 'scheduled'}
            tabs={paymentRequestTabs}
            onTabChange={setActiveTab}
          />
        )}
      </div>

      <CreatePaymentRequestModal
        applyScope={applyScope}
        createError={createError}
        groupOptions={groupOptions}
        isOpen={isCreateModalOpen}
        isSavingRequest={isSavingRequest}
        locale={locale}
        onApplyScopeChange={handleApplyScopeChange}
        onClose={handleCloseCreateModal}
        onFormChange={handleFormChange}
        onStudentSelect={(student) => {
          handleFormChange('student_id', String(student.student_id))
          setSelectedStudent({
            id: String(student.student_id),
            name: student.full_name,
            register_id: String(student.register_id),
            grade_group: String(student.grade_group),
            generation: String(student.generation),
            scholar_level_name: String(student.scholar_level_name),
          })
        }}
        onSubmit={handleCreatePaymentRequest}
        paymentRequestForm={paymentRequestForm}
        schoolOptions={schoolOptions}
        selectedStudent={selectedStudent}
        t={t}
      />
    </>
  )
}
