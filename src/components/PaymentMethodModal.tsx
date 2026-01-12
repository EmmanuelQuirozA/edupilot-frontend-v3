import { useEffect, useMemo, useState } from 'react'
import { API_BASE_URL } from '../config'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export interface PaymentMethod {
  id: number
  name: string
  name_es: string
  name_en: string
}

interface PaymentMethodModalProps {
  isOpen: boolean
  mode: 'create' | 'edit'
  method: PaymentMethod | null
  onClose: () => void
  onSaved: () => void
}

const emptyForm = {
  name_es: '',
  name_en: '',
}

export function PaymentMethodModal({ isOpen, mode, method, onClose, onSaved }: PaymentMethodModalProps) {
  const { token } = useAuth()
  const { locale, t } = useLanguage()
  const [form, setForm] = useState(emptyForm)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const title = useMemo(
    () => (mode === 'edit' ? t('paymentMethodUpdateTitle') : t('paymentMethodCreateTitle')),
    [mode, t],
  )

  useEffect(() => {
    if (!isOpen) return
    if (mode === 'edit' && method) {
      setForm({
        name_es: method.name_es ?? '',
        name_en: method.name_en ?? '',
      })
    } else {
      setForm(emptyForm)
    }
  }, [isOpen, method, mode])

  if (!isOpen) return null

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!token) return

    setIsSubmitting(true)
    try {
      const url = new URL(`${API_BASE_URL}/catalog/payment-through`)
      const options: RequestInit = {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      }

      if (mode === 'edit' && method) {
        url.searchParams.set('lang', locale)
        url.searchParams.set('payment_through_id', String(method.id))
      }

      const response = await fetch(url.toString(), options)
      if (!response.ok) throw new Error('failed_request')
      const result = await response.json()

      if (!result?.success) {
        Swal.fire({
          icon: 'error',
          title: result?.title || t('defaultError'),
          text: result?.message || t('defaultError'),
        })
        return
      }

      Swal.fire({
        icon: 'success',
        title: result?.title || '',
        text: result?.message || '',
      })

      onSaved()
      onClose()
    } catch (error) {
      // no-op
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="modal-backdrop fade show" />
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        onClick={onClose}
      >
        <div
          className="modal-dialog modal-lg modal-dialog-centered"
          role="document"
          onClick={(event) => event.stopPropagation()}
        >
          <form className="modal-content" onSubmit={handleSubmit}>
            <div className="modal-header">
              <h5 className="modal-title fw-semibold">{title}</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
            </div>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label">{t('paymentMethodNameEs')}</label>
                  <input
                    className="form-control"
                    value={form.name_es}
                    onChange={(event) => setForm((prev) => ({ ...prev, name_es: event.target.value }))}
                    required
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label">{t('paymentMethodNameEn')}</label>
                  <input
                    className="form-control"
                    value={form.name_en}
                    onChange={(event) => setForm((prev) => ({ ...prev, name_en: event.target.value }))}
                    required
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={isSubmitting}>
                {t('paymentMethodCancel')}
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {t('paymentMethodSave')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
