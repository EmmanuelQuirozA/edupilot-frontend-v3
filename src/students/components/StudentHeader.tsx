import type { FormEventHandler } from 'react'

export type StatusTone = 'success' | 'warning' | 'neutral'

export interface StatusLabels {
  active: string
  inactive: string
}

export interface StudentHeaderProps {
  isLoading: boolean
  initials: string
  studentName: string
  activeInGroupLabel: string
  statusChipLabel: string
  roleChipLabel: string
  statusTone?: StatusTone
  isEditing: boolean
  isSaving: boolean
  isStatusActive: boolean
  statusLabels: StatusLabels
  onStatusToggle: (nextValue: boolean) => void
  onStartEdit: () => void
  onCancelEdit: () => void
  onSave?: () => void
  onResetPassword?: () => void
  formId?: string
  editButtonLabel: string
  cancelButtonLabel: string
  saveButtonLabel: string
  savingLabel?: string
  resetPasswordLabel: string
  disableActions?: boolean
}

function getStatusToneClass(statusTone: StatusTone = 'neutral') {
  if (statusTone === 'success') return 'bg-success'
  if (statusTone === 'warning') return 'bg-warning text-dark'
  return 'bg-secondary'
}

function getAvatarInitials(initials: string) {
  const trimmed = initials.trim()
  return trimmed.length ? trimmed : '??'
}

export function StudentHeader({
  isLoading,
  initials,
  studentName,
  activeInGroupLabel,
  statusChipLabel,
  roleChipLabel,
  statusTone = 'neutral',
  isEditing,
  isSaving,
  isStatusActive,
  statusLabels,
  onStatusToggle,
  onStartEdit,
  onCancelEdit,
  onSave,
  onResetPassword,
  formId,
  editButtonLabel,
  cancelButtonLabel,
  saveButtonLabel,
  savingLabel,
  resetPasswordLabel,
  disableActions = false,
}: StudentHeaderProps) {
  if (isLoading) {
    return (
      <div className="card p-3">
        <div className="d-flex align-items-center gap-3">
          <span className="placeholder rounded-circle" style={{ width: 56, height: 56 }} />
          <div className="flex-grow-1">
            <div className="placeholder col-3 mb-2" />
            <div className="placeholder col-6 mb-2" />
            <div className="d-flex gap-2">
              <span className="placeholder rounded-pill col-2" />
              <span className="placeholder rounded-pill col-2" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const statusToneClass = getStatusToneClass(statusTone)

  const handleSave: FormEventHandler<HTMLButtonElement> = (event) => {
    if (!formId && onSave) {
      event.preventDefault()
      onSave()
    }
  }

  return (
    <div className="card p-3">
      <div className="d-flex flex-column flex-md-row align-items-start justify-content-between gap-3">
        <div className="d-flex align-items-center gap-3">
          <div
            className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white fw-semibold"
            style={{ width: 56, height: 56 }}
            aria-hidden="true"
          >
            {getAvatarInitials(initials)}
          </div>
          <div>
            <p className="text-muted mb-1 small">{activeInGroupLabel}</p>
            <h2 className="h5 mb-2">{studentName}</h2>
            <div className="d-flex flex-wrap align-items-center gap-2">
              {isEditing ? (
                <div className="d-flex align-items-center gap-2">
                  <div className="form-check form-switch m-0">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      checked={isStatusActive}
                      onChange={(event) => onStatusToggle(event.target.checked)}
                      disabled={disableActions || isSaving}
                    />
                  </div>
                  <span className="small">
                    {isStatusActive ? statusLabels.active : statusLabels.inactive}
                  </span>
                </div>
              ) : (
                <span className={`badge rounded-pill ${statusToneClass}`}>{statusChipLabel}</span>
              )}
              <span className="badge rounded-pill bg-light text-body">{roleChipLabel}</span>
            </div>
          </div>
        </div>

        <div className="d-flex flex-wrap gap-2">
          {isEditing ? (
            <>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onCancelEdit}
                disabled={disableActions || isSaving}
              >
                {cancelButtonLabel}
              </button>
              <button
                type={formId ? 'submit' : 'button'}
                form={formId}
                className="btn btn-primary"
                onClick={handleSave}
                disabled={disableActions || isSaving}
              >
                {isSaving ? savingLabel ?? saveButtonLabel : saveButtonLabel}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onResetPassword}
                disabled={disableActions}
              >
                {resetPasswordLabel}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onStartEdit}
                disabled={disableActions}
              >
                {editButtonLabel}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
