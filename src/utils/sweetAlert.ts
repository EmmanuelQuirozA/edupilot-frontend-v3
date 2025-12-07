export type SweetAlertIcon = 'success' | 'error' | 'info'

interface SweetAlertOptions {
  title: string
  text: string
  icon?: SweetAlertIcon
}

export function showSweetAlert({ title, text, icon = 'success' }: SweetAlertOptions) {
  const overlay = document.createElement('div')
  overlay.className = 'sweet-alert-overlay'

  const card = document.createElement('div')
  card.className = 'sweet-alert'

  const iconWrapper = document.createElement('div')
  iconWrapper.className = `sweet-alert__icon sweet-alert__icon--${icon}`
  iconWrapper.textContent = icon === 'error' ? '!' : icon === 'info' ? 'i' : '✓'

  const titleElement = document.createElement('h3')
  titleElement.className = 'sweet-alert__title'
  titleElement.textContent = title

  const textElement = document.createElement('pre')
  textElement.className = 'sweet-alert__text'
  textElement.textContent = text

  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'btn btn-primary sweet-alert__button'
  button.textContent = 'Entendido'

  const cleanup = () => {
    document.removeEventListener('keydown', handleKeyDown)
    if (overlay.parentElement) {
      overlay.parentElement.removeChild(overlay)
    }
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      cleanup()
    }
  }

  button.addEventListener('click', cleanup)
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      cleanup()
    }
  })
  document.addEventListener('keydown', handleKeyDown)

  card.append(iconWrapper, titleElement, textElement, button)
  overlay.append(card)
  document.body.append(overlay)
}
