declare const Swal: {
  fire: (options: {
    icon?: 'success' | 'error' | 'warning' | 'info' | 'question'
    title?: string
    text?: string
  }) => void
}

declare const $: (selector: string) => unknown

