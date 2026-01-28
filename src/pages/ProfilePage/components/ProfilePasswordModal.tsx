import type { FormEvent } from 'react'

interface PasswordFormState {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

interface ProfilePasswordModalProps {
  isOpen: boolean
  onClose: () => void
  formValues: PasswordFormState
  formError: string | null
  isSubmitting: boolean
  onChange: (field: keyof PasswordFormState, value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  title: string
  subtitle: string
  submitLabel: string
  submittingLabel: string
  oldPasswordLabel: string
  newPasswordLabel: string
  confirmPasswordLabel: string
}

export function ProfilePasswordModal({
  isOpen,
  onClose,
  formValues,
  formError,
  isSubmitting,
  onChange,
  onSubmit,
  title,
  subtitle,
  submitLabel,
  submittingLabel,
  oldPasswordLabel,
  newPasswordLabel,
  confirmPasswordLabel,
}: ProfilePasswordModalProps) {
  if (!isOpen) return null

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
          className="modal-dialog modal-dialog-centered"
          role="document"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h5 className="modal-title fw-semibold">{title}</h5>
                <p className="text-muted mb-0">{subtitle}</p>
              </div>
              <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
            </div>
            <div className="modal-body">
              <form className="profile-page__password-form" onSubmit={onSubmit}>
                <div>
                  <label className="form-label" htmlFor="oldPassword">
                    {oldPasswordLabel}
                  </label>
                  <input
                    id="oldPassword"
                    type="password"
                    className="form-control"
                    value={formValues.oldPassword}
                    onChange={(event) => onChange('oldPassword', event.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" htmlFor="newPassword">
                    {newPasswordLabel}
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    className="form-control"
                    value={formValues.newPassword}
                    onChange={(event) => onChange('newPassword', event.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" htmlFor="confirmPassword">
                    {confirmPasswordLabel}
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    className="form-control"
                    value={formValues.confirmPassword}
                    onChange={(event) => onChange('confirmPassword', event.target.value)}
                    required
                  />
                </div>
                {formError ? (
                  <div className="alert alert-danger mb-0" role="alert">
                    {formError}
                  </div>
                ) : null}
                <div className="d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-light" onClick={onClose}>
                    Cancelar
                  </button>
                  <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? submittingLabel : submitLabel}
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
