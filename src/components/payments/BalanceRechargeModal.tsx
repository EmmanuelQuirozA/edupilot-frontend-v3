import { useEffect, useMemo, useState } from 'react'
import { API_BASE_URL } from '../../config'
import { useAuth } from '../../context/AuthContext'
import { createCurrencyFormatter } from '../../utils/currencyFormatter'
import './balance-recharge-modal.css'

export interface RechargeUserSummary {
  userId: number | string
  fullName: string
  group?: string
  level?: string
  balance: number
}

interface RechargeResponse {
  type?: string
  title?: string
  message?: string
  success?: boolean
  newBalance?: number
  rechargeId?: number
}

export interface BalanceRechargeModalProps {
  isOpen: boolean
  onClose: () => void
  user?: RechargeUserSummary | null
  currency?: string
  suggestedAmounts?: number[]
  onSuccess?: (payload: { newBalance: number; rechargeId?: number }) => void
}

export function BalanceRechargeModal({
  isOpen,
  onClose,
  user,
  currency = 'MXN',
  suggestedAmounts = [50, 100, 200, 500],
  onSuccess,
}: BalanceRechargeModalProps) {
  const { token } = useAuth()
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<RechargeResponse | null>(null)

  const currencyFormatter = useMemo(
    () => createCurrencyFormatter('es-MX', currency),
    [currency],
  )

  useEffect(() => {
    if (!isOpen) return
    setAmount('')
    setError(null)
    setResponse(null)
  }, [isOpen])

  if (!isOpen) return null

  const handleSuggestedClick = (value: number) => {
    setAmount(String(value))
    setError(null)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setResponse(null)

    if (!user?.userId) {
      setError('No se encontró el usuario para recargar.')
      return
    }

    if (!token) {
      setError('No hay sesión activa.')
      return
    }

    const amountValue = Number(amount)
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setError('Ingresa un monto válido.')
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
          userId: String(user.userId),
          amount: amountValue,
        }),
      })

      const payload: RechargeResponse = await result.json()

      if (!result.ok || payload?.success === false) {
        throw new Error(payload?.message || 'No se pudo procesar la recarga.')
      }

      setResponse(payload)
      if (payload?.newBalance !== undefined) {
        onSuccess?.({ newBalance: payload.newBalance, rechargeId: payload.rechargeId })
      }
    } catch (submitError) {
      setError((submitError as Error)?.message || 'No se pudo procesar la recarga.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal fade show d-block" role="dialog" aria-modal="true">
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content balance-modal">
          <div className="modal-header">
            <h5 className="modal-title">Añadir saldo a favor</h5>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
          </div>
          <div className="modal-body">
            <p className="text-muted mb-3">Ingresa el monto que deseas abonar al saldo del usuario.</p>

            <div className="balance-modal__user-card mb-4">
              <h6 className="text-uppercase text-muted fw-semibold mb-3">Datos del usuario</h6>
              <div className="row g-3">
                <div className="col-6">
                  <p className="balance-modal__label">Nombre</p>
                  <p className="balance-modal__value">{user?.fullName || 'N/D'}</p>
                </div>
                <div className="col-6 text-end">
                  <p className="balance-modal__label">Saldo actual</p>
                  <p className="balance-modal__value">{currencyFormatter.format(user?.balance ?? 0)}</p>
                </div>
                <div className="col-6">
                  <p className="balance-modal__label">Grupo</p>
                  <p className="balance-modal__value">{user?.group || 'N/D'}</p>
                </div>
                <div className="col-6">
                  <p className="balance-modal__label">Nivel escolar</p>
                  <p className="balance-modal__value">{user?.level || 'N/D'}</p>
                </div>
              </div>
            </div>

            <form className="d-flex flex-column gap-3" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="rechargeAmount" className="form-label fw-semibold">
                  Monto a abonar
                </label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input
                    id="rechargeAmount"
                    type="number"
                    min="0"
                    step="1"
                    className="form-control"
                    placeholder="0"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    required
                  />
                  <span className="input-group-text">{currency}</span>
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2">
                {suggestedAmounts.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() => handleSuggestedClick(value)}
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

              {response ? (
                <div className="alert alert-success mb-0" role="alert">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="mb-1">{response.title || 'Recarga exitosa'}</h6>
                      <p className="mb-1">{response.message || 'Recarga de saldo registrada.'}</p>
                      {response.newBalance !== undefined ? (
                        <p className="fw-semibold mb-0">
                          Nuevo saldo: {currencyFormatter.format(response.newBalance)}
                        </p>
                      ) : null}
                    </div>
                    {response.rechargeId ? (
                      <span className="badge bg-light text-dark">ID #{response.rechargeId}</span>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="d-flex justify-content-between align-items-center mt-2">
                <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Procesando...' : 'Confirmar recarga'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </div>
  )
}
