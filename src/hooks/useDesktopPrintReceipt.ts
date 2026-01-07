import { useCallback, useState } from 'react'
import type { PosTicketPayload } from '../types/pos'
import { useLanguage } from '../context/LanguageContext'
import { getPrintingAvailability, readPaperWidthFromBridge } from '../utils/pos'
import {
  buildPaymentReceiptLines,
  formatMexicoCityDateTime,
  type PaymentReceiptInfo,
  type PaymentReceiptLabels,
  type PaymentReceiptSchool,
} from '../utils/receipt/buildPaymentReceipt'

declare const Swal: {
  fire: (options: Record<string, unknown>) => Promise<{ isConfirmed?: boolean }>
}

export interface PaymentReceiptDetails {
  school: PaymentReceiptSchool
  payment: PaymentReceiptInfo
  labels?: Partial<PaymentReceiptLabels>
  now?: Date
}

const DEFAULT_LABELS: PaymentReceiptLabels = {
  address: 'Address',
  phone: 'Phone',
  datetime: 'Datetime',
  student: 'Student',
  level: 'Level',
  gradeGroup: 'Grade/Group',
  paymentMethod: 'Payment method',
  paymentDate: 'Payment date',
  reference: 'Reference',
  month: 'Month',
  cycle: 'School cycle',
  comments: 'Comments',
}

const isDesktopEnvironment = async () => {
  const availability = await getPrintingAvailability()
  if (availability.available) return true

  if (typeof window !== 'undefined' && typeof window.pos === 'object' && window.pos) {
    return true
  }

  return false
}

const resolvePrinterName = (settings: unknown): string | null => {
  if (!settings) return null
  if (typeof settings === 'string') return settings.trim() || null
  if (typeof settings === 'object') {
    const name =
      (settings as { selectedPrinterName?: unknown }).selectedPrinterName ??
      (settings as { printerName?: unknown }).printerName
    if (typeof name === 'string' && name.trim()) return name.trim()
  }
  return null
}

const readPrinterNameFromBridge = async (): Promise<string | null> => {
  if (typeof window === 'undefined' || !window.pos) return null
  const bridge = window.pos
  if (typeof bridge.getPrinterSettings !== 'function') return null
  try {
    const settings = await bridge.getPrinterSettings()
    return resolvePrinterName(settings)
  } catch (error) {
    console.error('Failed to read printer settings', error)
    return null
  }
}

const sendTicketToBridge = async (payload: PosTicketPayload) => {
  if (typeof window === 'undefined' || !window.pos) {
    return { success: false, failureReason: 'POS bridge not available' }
  }

  const bridge = window.pos

  if (typeof bridge.printTicket !== 'function') {
    return { success: false, failureReason: 'Print ticket is not supported in this environment.' }
  }

  const response = await bridge.printTicket(payload)
  const normalized =
    typeof response === 'boolean'
      ? { success: response }
      : response ?? { success: false }
  const success = normalized.success ?? normalized.ok ?? false
  const failureReason =
    (normalized as { failureReason?: string | null }).failureReason ??
    normalized.error ??
    normalized.message ??
    null
  return { success, failureReason }
}

export function useDesktopPrintReceipt() {
  const { t, locale } = useLanguage()
  const [isPrinting, setIsPrinting] = useState(false)
  const [printerName, setPrinterName] = useState<string | null>(null)

  const printReceipt = useCallback(
    async (details: PaymentReceiptDetails) => {
      const desktop = await isDesktopEnvironment()
      if (!desktop) return

      const confirmationTitle = locale === 'es' ? '¿Imprimir recibo?' : 'Print receipt?'
      const confirmationText =
        locale === 'es' ? '¿Deseas imprimir el recibo de pago?' : 'Do you want to print the payment receipt?'
      const confirmButtonText = locale === 'es' ? 'Imprimir' : 'Print'
      const cancelButtonText = locale === 'es' ? 'Ahora no' : 'Not now'

      const confirmation = await Swal.fire({
        icon: 'question',
        title: confirmationTitle,
        text: confirmationText,
        showCancelButton: true,
        confirmButtonText,
        cancelButtonText,
        reverseButtons: true,
      })

      if (!confirmation.isConfirmed) return

      setIsPrinting(true)
      setPrinterName(await readPrinterNameFromBridge())

      try {
        const paperWidthMm = await readPaperWidthFromBridge()
        const labels: PaymentReceiptLabels = {
          ...DEFAULT_LABELS,
          student: t('student'),
          level: t('scholarLevel'),
          gradeGroup: t('gradeGroup'),
          paymentMethod: t('paymentThrough'),
          paymentDate: t('paymentDate') || DEFAULT_LABELS.paymentDate,
          reference: t('reference'),
          month: t('paymentMonth') || DEFAULT_LABELS.month,
          cycle: t('schoolCycle') || DEFAULT_LABELS.cycle,
          comments: t('comments'),
          address: t('address') || DEFAULT_LABELS.address,
          phone: t('phoneNumber') || DEFAULT_LABELS.phone,
          datetime: t('date') || DEFAULT_LABELS.datetime,
          ...(details.labels ?? {}),
        }

        const lines = buildPaymentReceiptLines({
          school: details.school,
          payment: {
            ...details.payment,
            paymentDateLabel: details.payment.paymentDateLabel || formatMexicoCityDateTime(details.now),
          },
          labels,
          paperWidthMm,
          now: details.now,
        })

        const ticketPayload: PosTicketPayload = {
          title: details.school.name,
          lines,
          paperWidthMm,
        }

        const result = await sendTicketToBridge(ticketPayload)
        const successText = locale === 'es' ? 'Recibo impreso correctamente' : 'Ticket printed successfully'
        if (result.success) {
          await Swal.fire({
            icon: 'success',
            text: successText,
          })
          return
        }

        const baseErrorText = locale === 'es' ? 'Error al imprimir el recibo' : 'Failed to print ticket'
        const detail = result.failureReason
        await Swal.fire({
          icon: 'error',
          text: detail ? `${baseErrorText}: ${detail}` : baseErrorText,
        })
      } catch (error) {
        const baseErrorText = locale === 'es' ? 'Error al imprimir el recibo' : 'Failed to print ticket'
        const detail = error instanceof Error ? error.message : null
        await Swal.fire({
          icon: 'error',
          text: detail ? `${baseErrorText}: ${detail}` : baseErrorText,
        })
      } finally {
        setIsPrinting(false)
      }
    },
    [locale, t],
  )

  return { isPrinting, printerName, printReceipt }
}

export default useDesktopPrintReceipt
