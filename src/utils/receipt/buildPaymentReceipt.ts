import { DEFAULT_PAPER_WIDTH_MM } from '../pos'

export interface PaymentReceiptLabels {
  address: string
  phone: string
  datetime: string
  student: string
  level: string
  gradeGroup: string
  paymentMethod: string
  paymentDate: string
  reference: string
  month: string
  cycle: string
  comments: string
}

export interface PaymentReceiptSchool {
  name: string
  address?: string | null
  phone?: string | null
}

export interface PaymentReceiptInfo {
  conceptLabel: string
  studentName: string
  scholarLevel?: string | null
  gradeGroup?: string | null
  paymentMethodLabel: string
  paymentDateLabel?: string
  reference?: string | null
  monthLabel?: string | null
  cycleLabel?: string | null
  comments?: string | null
  amountText: string
}

const LINE_WIDTH_FOR_PAPER_MM: Record<number, number> = {
  58: 32,
  57: 32,
  76: 40,
  80: 40,
  112: 48,
}

const getLineWidth = (paperWidthMm: number): number => {
  const rounded = Math.round(paperWidthMm)
  if (rounded in LINE_WIDTH_FOR_PAPER_MM) return LINE_WIDTH_FOR_PAPER_MM[rounded as keyof typeof LINE_WIDTH_FOR_PAPER_MM]
  if (rounded >= 110) return 48
  if (rounded >= 76) return 40
  return 32
}

const centerText = (text: string, width: number) => {
  if (!text) return ''.padStart(Math.max(0, Math.floor(width / 2)))
  if (text.length >= width) return text
  const padTotal = width - text.length
  const padStart = Math.floor(padTotal / 2)
  const padEnd = padTotal - padStart
  return `${' '.repeat(padStart)}${text}${' '.repeat(padEnd)}`
}

export const formatMexicoCityDateTime = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(date).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value
    return acc
  }, {})

  const year = parts.year ?? '0000'
  const month = parts.month ?? '00'
  const day = parts.day ?? '00'
  const hour = parts.hour ?? '00'
  const minute = parts.minute ?? '00'
  const second = parts.second ?? '00'

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

export const formatMonthLabel = (value?: string) => {
  if (!value) return ''
  const parsed = new Date(`${value}-01`)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
}

export function buildPaymentReceiptLines({
  school,
  payment,
  labels,
  paperWidthMm = DEFAULT_PAPER_WIDTH_MM,
  now,
}: {
  school: PaymentReceiptSchool
  payment: PaymentReceiptInfo
  labels: PaymentReceiptLabels
  paperWidthMm?: number
  now?: Date
}): string[] {
  const lineWidth = getLineWidth(paperWidthMm)
  const separator = '-'.repeat(lineWidth)
  const timestamp = formatMexicoCityDateTime(now)
  const paymentDate = payment.paymentDateLabel || timestamp

  const normalizeValue = (value?: string | null) => (value && value.trim() ? value.trim() : '-')

  return [
    centerText(school.name || '-', lineWidth),
    `${labels.address}: ${normalizeValue(school.address)}`,
    `${labels.phone}: ${normalizeValue(school.phone)}`,
    `${labels.datetime}: ${timestamp}`,
    separator,
    centerText(payment.conceptLabel || '-', lineWidth),
    `${labels.student}: ${normalizeValue(payment.studentName)}`,
    `${labels.level}: ${normalizeValue(payment.scholarLevel)}`,
    `${labels.gradeGroup}: ${normalizeValue(payment.gradeGroup)}`,
    `${labels.paymentMethod}: ${normalizeValue(payment.paymentMethodLabel)}`,
    `${labels.paymentDate}: ${normalizeValue(paymentDate)}`,
    `${labels.reference}: ${normalizeValue(payment.reference)}`,
    `${labels.month}: ${normalizeValue(payment.monthLabel)}`,
    `${labels.cycle}: ${normalizeValue(payment.cycleLabel)}`,
    payment.amountText.padStart(lineWidth),
    separator,
    `${labels.comments}: ${normalizeValue(payment.comments)}`,
  ]
}
