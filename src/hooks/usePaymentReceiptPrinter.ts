import { useCallback } from 'react'
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

const sendTicketToBridge = async (payload: PosTicketPayload) => {
  if (typeof window === 'undefined' || !window.pos) {
    return { ok: false, message: 'POS bridge not available' }
  }

  const bridge = window.pos

  if (typeof bridge.printTicket === 'function') {
    const response = await bridge.printTicket(payload)
    const normalized =
      typeof response === 'boolean'
        ? { success: response }
        : response ?? { success: false }
    const ok = normalized.success ?? normalized.ok ?? false
    return { ok, message: normalized.error || normalized.message || null }
  }

  if (typeof (bridge as Record<string, unknown>).send === 'function') {
    try {
      await (bridge as unknown as { send: (channel: string, data: unknown) => void }).send('print-ticket', payload)
      return { ok: true }
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : 'Unknown print error'
      return { ok: false, message }
    }
  }

  return { ok: false, message: 'Print ticket is not supported in this environment.' }
}

export function usePaymentReceiptPrinter() {
  const { t, locale } = useLanguage()

  const promptAndPrintReceipt = useCallback(
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

      if (!result.ok) {
        Swal.fire({
          icon: 'error',
          title: t('defaultError'),
          text: result.message || 'Could not send print job.',
        })
      }
    },
    [locale, t],
  )

  return { promptAndPrintReceipt }
}

export default usePaymentReceiptPrinter
