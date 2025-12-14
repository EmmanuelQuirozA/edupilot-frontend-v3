type SwalResult = {
  isConfirmed: boolean
  isDenied?: boolean
  isDismissed?: boolean
}

declare const Swal: {
  fire: (options: {
    icon?: 'success' | 'error' | 'warning' | 'info' | 'question'
    title?: string
    text?: string
    showCancelButton?: boolean
    confirmButtonText?: string
    cancelButtonText?: string
    [key: string]: unknown
  }) => Promise<SwalResult>
}

declare const $: (selector: string) => unknown

