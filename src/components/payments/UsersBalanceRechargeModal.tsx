import { useCallback, useEffect, useMemo, useState } from 'react'
import UsersBalanceSearchDropdown, { type UsersBalanceSearchItem } from '../UsersBalanceSearchDropdown'
import { API_BASE_URL } from '../../config'
import { useAuth } from '../../context/AuthContext'
import { createCurrencyFormatter } from '../../utils/currencyFormatter'
import { useLanguage } from '../../context/LanguageContext'
import './balance-recharge-modal.css'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Swal: any

interface RechargeResponse {
  type?: string
  title?: string
  message?: string
  success?: boolean
  newBalance?: number
  rechargeId?: number
}

export interface UsersBalanceRechargeModalProps {
  isOpen: boolean
  close?: () => void
  onClose: () => void
  user?: UsersBalanceSearchItem | null
  currency?: string
  suggestedAmounts?: number[]
  onSuccess?: (payload: { newBalance: number; rechargeId?: number }) => void
}

const isStudentRole = (roleName?: string | null) => {
  if (!roleName) return false
  const normalizedRole = roleName.toLowerCase()
  return normalizedRole.includes('student') || normalizedRole.includes('estudiante')
}

export function UsersBalanceRechargeModal({
  isOpen,
  close,
  onClose,
  user,
  currency = 'MXN',
  suggestedAmounts = [50, 100, 200, 500],
  onSuccess,
}: UsersBalanceRechargeModalProps) {
  const { token } = useAuth()
  const { t, locale } = useLanguage()
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UsersBalanceSearchItem | null>(user ?? null)

  const handleClose = useCallback(() => {
    if (submitting) return
    close?.()
    onClose()
  }, [close, onClose, submitting])

  const currencyFormatter = useMemo(
    () => createCurrencyFormatter(locale, currency),
    [currency, locale],
  )

  useEffect(() => {
    if (!isOpen) return
    setAmount('')
    setError(null)
    setSelectedUser(user ?? null)
  }, [isOpen, user])

  if (!isOpen) return null

  const handleSuggestedClick = (value: number) => {
    setAmount(String(value))
    setError(null)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!selectedUser?.user_id) {
      setError(t('selectRechargeUser'))
      return
    }

    if (!token) {
      setError(t('noActiveSession'))
      return
    }

    const amountValue = Number(amount)
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setError(t('enterValidAmount'))
      return
    }

    setSubmitting(true)
    try {
      const result = await fetch(`${API_BASE_URL}/balances/recharge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: String(selectedUser.user_id),
          amount: amountValue,
        }),
      })

      const payload: RechargeResponse = await result.json()

      if (!result.ok || payload?.success === false) {
        throw new Error(payload?.message || t('rechargeError'))
      }

      if (!payload?.success) {
        Swal.fire({
          icon: 'error',
          title: payload?.title || t('defaultError'),
          text: payload?.message || t('defaultError'),
        })
        return
      }

      Swal.fire({
        icon: 'success',
        title: payload?.title || '',
        text: payload?.message || '',
      })

      if (payload?.newBalance !== undefined) {
        setSelectedUser((prev) => (prev ? { ...prev, balance: payload.newBalance } : prev))
        onSuccess?.({ newBalance: payload.newBalance, rechargeId: payload.rechargeId })
        onClose()
      }
    } catch (submitError) {
      setError((submitError as Error)?.message || t('rechargeError'))
    } finally {
      setSubmitting(false)
    }
  }

  const student = isStudentRole(selectedUser?.role_name)

  return (
    <>
      <div className="modal-backdrop fade show" />
      <div
        className={`modal fade ${isOpen ? 'show d-block' : ''}`}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        onClick={handleClose}
      >
        <div
          className="modal-dialog modal-dialog-scrollable modal-lg modal-dialog-centered"
          onClick={(e) => e.stopPropagation()}
        >
            <div className="modal-content balance-modal">
            <div className="modal-header">
              <div>
                <h5 className="modal-title fw-semibold">{t('addBalance')}</h5>
                <p className="mb-0 text-muted">{t('createManualPaymentDescription')}</p>
              </div>
              <button type="button" className="btn-close" aria-label="Close" onClick={handleClose} />
            </div>
            <div className="modal-body">
              <p className="text-muted mb-3">{t('addBalanceDescription')}</p>

              <div className="mb-4">
                <UsersBalanceSearchDropdown
                  label={t('searchUserOrStudent')}
                  placeholder={t('searchByName')}
                  onSelect={(selected) => {
                    setSelectedUser(selected as UsersBalanceSearchItem)
                    setError(null)
                  }}
                  value={selectedUser ? [selectedUser] : []}
                  onClear={() => setSelectedUser(null)}
                  lang={locale || 'es'}
                />
              </div>

                {selectedUser ? (
                  <div className="balance-modal__user-card mb-4">
                  <h6 className="text-uppercase text-muted fw-semibold mb-3">{t('userData')}</h6>
                  <div className="row g-3">
                    <div className="col-6">
                      <p className="balance-modal__label">{t('name')}</p>
                      <p className="balance-modal__value">{selectedUser?.full_name || t('noInformation')}</p>
                    </div>
                    <div className="col-6 text-end">
                      <p className="balance-modal__label">{t('balance')}</p>
                      <p className="balance-modal__value">
                        {currencyFormatter.format(selectedUser?.balance ?? 0)}
                      </p>
                    </div>
                    {student ? (
                      <>
                        <div className="col-6">
                          <p className="balance-modal__label">{t('generation')}</p>
                          <p className="balance-modal__value">{selectedUser?.generation || t('noInformation')}</p>
                        </div>
                        <div className="col-6">
                          <p className="balance-modal__label">{t('scholarLevel')}</p>
                          <p className="balance-modal__value">{selectedUser?.scholar_level_name || t('noInformation')}</p>
                        </div>
                        <div className="col-6">
                          <p className="balance-modal__label">{t('class')}</p>
                          <p className="balance-modal__value">{selectedUser?.grade_group || t('noInformation')}</p>
                        </div>
                      </>
                    ) : (
                      <div className="col-6">
                        <p className="balance-modal__label">{t('role')}</p>
                        <p className="balance-modal__value">{selectedUser?.role_name || t('noInformation')}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              <form className="d-flex flex-column gap-3" onSubmit={handleSubmit}>
                <div className="balance-modal__user-card">
                  <div>
                    <label htmlFor="rechargeAmount" className="form-label fw-semibold">
                      {t('topUpAmount')}
                    </label>
                    <div className="balance-recharge-modal__input">
                      <span>$</span>
                      <input
                        id="rechargeAmount"
                        type="number"
                        min="0"
                        step="1"
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                        placeholder="0"
                        disabled={submitting}
                        inputMode="decimal"
                      />
                      <span>{currency}</span>
                    </div>
                  </div>

                  <div className="d-flex flex-wrap gap-2 mt-2">
                    {suggestedAmounts.map((value) => (
                      <button
                        key={value}
                        type="button"
                        className="btn btn-outline"
                        onClick={() => handleSuggestedClick(value)}
                        disabled={submitting}
                      >
                        {currencyFormatter.format(value)}
                      </button>
                    ))}
                  </div>

                  {error ? (
                    <div className="alert alert-danger mb-0" role="alert">
                      {error}
                    </div>
                  ) : null}
                </div>

                <div className="d-flex justify-content-between align-items-center mt-2">
                  <button type="button" className="btn btn-outline-secondary" onClick={handleClose} disabled={submitting}>
                    {t('cancel')}
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting || !selectedUser}>
                    {submitting ? t('processing') : t('confirmRecharge')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default UsersBalanceRechargeModal
