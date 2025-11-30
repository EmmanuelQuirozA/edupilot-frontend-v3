import { Layout } from '../layout/Layout'
import { useLanguage, type Locale } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { LoadingSkeleton } from '../components/LoadingSkeleton'

type StatusVariant = 'success' | 'warning' | 'critical' | 'info'

interface SummaryCard {
  helper: string
  label: string
  tag?: string
  value: string
}

interface PaymentInfo {
  amount: string
  dueDate: string
  school: string
  status: string
}

interface InvoiceInfo {
  age: string
  amount: string
  school: string
  status: string
}

interface UserMixInfo {
  helper: string
  label: string
  percentage: string
}

interface SystemHealthInfo {
  helper: string
  label: string
  status: string
  statusVariant: StatusVariant
}

interface QuickLink {
  description: string
  hint?: string
  title: string
}

interface BillingInfo {
  monthLabel?: string
  nextCharge?: string
}

interface AdminDashboardCopy {
  actionsHelper: string
  actionsLabel: string
  actionsTitle: string
  actionsEyebrow: string
  badge?: string
  billing: BillingInfo
  collectionsEyebrow: string
  collectionsHelper: string
  collectionsTitle: string
  helper: string
  healthEyebrow: string
  healthHelper: string
  healthTitle: string
  keyMetricsHelper: string
  keyMetricsLabel: string
  keyMetricsTitle: string
  nextChargeLabel: string
  pendingInvoices: InvoiceInfo[]
  pendingInvoicesHelper: string
  pendingInvoicesTitle: string
  quickLinks: QuickLink[]
  subtitle: string
  summaryCards: SummaryCard[]
  systemHealth: SystemHealthInfo[]
  upcomingPayments: PaymentInfo[]
  upcomingPaymentsHelper: string
  upcomingPaymentsTitle: string
  userMix: UserMixInfo[]
  userMixEyebrow: string
  userMixHelper: string
  userMixTitle: string
}

const STATUS_VARIANT_MAP: Record<StatusVariant, string> = {
  critical: 'danger',
  info: 'info',
  success: 'success',
  warning: 'warning',
}

const DASHBOARD_COPY: Record<Locale, AdminDashboardCopy> = {
  es: {
    subtitle: 'Panel de administración',
    helper: 'Aquí tienes un resumen ejecutivo de cobros, salud del sistema y próximas acciones.',
    badge: 'Versión preliminar',
    billing: {
      monthLabel: 'Ciclo de marzo',
      nextCharge: '$12,500 • 15/03',
    },
    keyMetricsLabel: 'Indicadores clave',
    keyMetricsTitle: 'Resumen de operación',
    keyMetricsHelper: 'Datos actualizados cada 15 minutos.',
    summaryCards: [
      {
        label: 'Escuelas activas',
        value: '64',
        helper: 'Conectadas en los últimos 30 días',
        tag: '+4 vs mes anterior',
      },
      {
        label: 'Usuarios totales',
        value: '18,240',
        helper: 'Incluye estudiantes y personal',
      },
      {
        label: 'Índice de cobranza',
        value: '92%',
        helper: 'Cobrado al corte del mes',
        tag: 'Objetivo: 95%',
      },
      {
        label: 'Tickets abiertos',
        value: '14',
        helper: 'Promedio de resolución 6h',
        tag: 'SLA 8h',
      },
    ],
    actionsLabel: 'Gestión y acciones',
    collectionsEyebrow: 'Cobranza',
    collectionsTitle: 'Movimientos y compromisos',
    collectionsHelper: 'Monitorea los próximos cargos y facturas pendientes.',
    nextChargeLabel: 'Próximo cargo',
    upcomingPaymentsTitle: 'Próximos pagos',
    upcomingPaymentsHelper: 'Semana actual',
    upcomingPayments: [
      {
        school: 'Colegio Horizonte',
        dueDate: '15 Mar • Débito automático',
        amount: '$4,200',
        status: 'Confirmado',
      },
      {
        school: 'Instituto Alameda',
        dueDate: '16 Mar • Transferencia',
        amount: '$3,100',
        status: 'Pendiente',
      },
      {
        school: 'Liceo del Sol',
        dueDate: '18 Mar • Tarjeta',
        amount: '$2,850',
        status: 'Revisión',
      },
    ],
    pendingInvoicesTitle: 'Facturas pendientes',
    pendingInvoicesHelper: 'Últimos 30 días',
    pendingInvoices: [
      {
        school: 'Academia Norte',
        age: '15 días',
        amount: '$1,200',
        status: 'Vencida',
      },
      {
        school: 'Colegio Central',
        age: '22 días',
        amount: '$980',
        status: 'Recordatorio enviado',
      },
      {
        school: 'Instituto Pampero',
        age: '5 días',
        amount: '$1,750',
        status: 'En negociación',
      },
    ],
    userMixEyebrow: 'Audiencias',
    userMixTitle: 'Distribución de usuarios',
    userMixHelper: 'Revisa la participación por perfil para equilibrar las campañas.',
    userMix: [
      { label: 'Estudiantes', helper: '12,400 usuarios', percentage: '68%' },
      { label: 'Familias', helper: '3,800 usuarios', percentage: '21%' },
      { label: 'Docentes', helper: '1,620 usuarios', percentage: '9%' },
      { label: 'Administrativos', helper: '420 usuarios', percentage: '2%' },
    ],
    healthEyebrow: 'Estado del sistema',
    healthTitle: 'Monitoreo en tiempo real',
    healthHelper: 'Servicios observados por región y proveedor.',
    systemHealth: [
      {
        label: 'API principal',
        helper: 'Latencia promedio 210 ms',
        status: 'Operativo',
        statusVariant: 'success',
      },
      {
        label: 'Procesamiento de pagos',
        helper: 'Tareas en cola moderada',
        status: 'Atención',
        statusVariant: 'warning',
      },
      {
        label: 'Entrega de notificaciones',
        helper: '85% de mensajes en <1 min',
        status: 'Degradado',
        statusVariant: 'critical',
      },
      {
        label: 'Paneles regionales',
        helper: 'Sin incidencias en los últimos despliegues',
        status: 'Normal',
        statusVariant: 'info',
      },
    ],
    actionsEyebrow: 'Acciones sugeridas',
    actionsTitle: 'Qué puedes hacer ahora',
    actionsHelper: 'Prioriza tareas críticas para mantener la operación estable.',
    quickLinks: [
      {
        title: 'Configurar nuevos perfiles',
        description: 'Define roles, permisos y accesos temporales para personal externo.',
        hint: 'Recomendado antes del próximo ciclo',
      },
      {
        title: 'Revisar contratos activos',
        description: 'Valida vigencia, condiciones y fechas de renovación por escuela.',
        hint: 'Pendiente de firma digital',
      },
      {
        title: 'Publicar novedades',
        description: 'Envía un boletín breve con cambios en calendarios y cobros.',
      },
      {
        title: 'Ver reportes de uso',
        description: 'Detecta adopción temprana y planifica entrenamientos.',
      },
    ],
  },
  en: {
    subtitle: 'Admin dashboard',
    helper: 'Here is an executive snapshot of billing, system health, and next actions.',
    badge: 'Preview build',
    billing: {
      monthLabel: 'March cycle',
      nextCharge: '$12,500 • Mar 15',
    },
    keyMetricsLabel: 'Key metrics',
    keyMetricsTitle: 'Operational overview',
    keyMetricsHelper: 'Data refreshes every 15 minutes.',
    summaryCards: [
      {
        label: 'Active schools',
        value: '64',
        helper: 'Connected in the last 30 days',
        tag: '+4 vs previous month',
      },
      {
        label: 'Total users',
        value: '18,240',
        helper: 'Students and staff',
      },
      {
        label: 'Collection rate',
        value: '92%',
        helper: 'Collected this month to date',
        tag: 'Target: 95%',
      },
      {
        label: 'Open tickets',
        value: '14',
        helper: 'Avg. resolution 6h',
        tag: 'SLA 8h',
      },
    ],
    actionsLabel: 'Management and actions',
    collectionsEyebrow: 'Billing',
    collectionsTitle: 'Movements and commitments',
    collectionsHelper: 'Keep track of upcoming charges and pending invoices.',
    nextChargeLabel: 'Next charge',
    upcomingPaymentsTitle: 'Upcoming payments',
    upcomingPaymentsHelper: 'Current week',
    upcomingPayments: [
      {
        school: 'Horizon School',
        dueDate: 'Mar 15 • Auto-debit',
        amount: '$4,200',
        status: 'Confirmed',
      },
      {
        school: 'Alameda Institute',
        dueDate: 'Mar 16 • Bank transfer',
        amount: '$3,100',
        status: 'Pending',
      },
      {
        school: 'Sunrise High',
        dueDate: 'Mar 18 • Card',
        amount: '$2,850',
        status: 'Reviewing',
      },
    ],
    pendingInvoicesTitle: 'Pending invoices',
    pendingInvoicesHelper: 'Last 30 days',
    pendingInvoices: [
      {
        school: 'Northern Academy',
        age: '15 days',
        amount: '$1,200',
        status: 'Overdue',
      },
      {
        school: 'Central School',
        age: '22 days',
        amount: '$980',
        status: 'Reminder sent',
      },
      {
        school: 'Pampero Institute',
        age: '5 days',
        amount: '$1,750',
        status: 'In negotiation',
      },
    ],
    userMixEyebrow: 'Audiences',
    userMixTitle: 'User distribution',
    userMixHelper: 'Balance outreach campaigns based on role participation.',
    userMix: [
      { label: 'Students', helper: '12,400 users', percentage: '68%' },
      { label: 'Families', helper: '3,800 users', percentage: '21%' },
      { label: 'Teachers', helper: '1,620 users', percentage: '9%' },
      { label: 'Admin staff', helper: '420 users', percentage: '2%' },
    ],
    healthEyebrow: 'System health',
    healthTitle: 'Real-time monitoring',
    healthHelper: 'Services observed by region and provider.',
    systemHealth: [
      {
        label: 'Core API',
        helper: 'Average latency 210 ms',
        status: 'Operational',
        statusVariant: 'success',
      },
      {
        label: 'Payment processing',
        helper: 'Moderate queue depth',
        status: 'Attention',
        statusVariant: 'warning',
      },
      {
        label: 'Notification delivery',
        helper: '85% of messages <1 min',
        status: 'Degraded',
        statusVariant: 'critical',
      },
      {
        label: 'Regional dashboards',
        helper: 'No incidents on recent releases',
        status: 'Normal',
        statusVariant: 'info',
      },
    ],
    actionsEyebrow: 'Suggested actions',
    actionsTitle: 'What you can do now',
    actionsHelper: 'Prioritize critical tasks to keep operations stable.',
    quickLinks: [
      {
        title: 'Configure new profiles',
        description: 'Set roles, permissions, and temporary access for vendors.',
        hint: 'Recommended before the next cycle',
      },
      {
        title: 'Review active contracts',
        description: 'Validate terms, renewals, and sign-off dates per school.',
        hint: 'Pending digital signature',
      },
      {
        title: 'Publish updates',
        description: 'Send a short bulletin with calendar and billing changes.',
      },
      {
        title: 'View usage reports',
        description: 'Spot early adoption patterns and plan training sessions.',
      },
    ],
  },
}

interface DashboardAdminPageProps {
  onNavigate: (path: string) => void
}

export function DashboardAdminPage({ onNavigate }: DashboardAdminPageProps) {
  const { locale, t } = useLanguage()
  const { user, hydrated } = useAuth()

  const strings = DASHBOARD_COPY[locale] ?? DASHBOARD_COPY.es
  const displayName =
    user?.first_name || user?.full_name || user?.username || user?.email || t('welcome')

  if (!hydrated) {
    return (
      <Layout onNavigate={onNavigate} pageTitle={t('portalTitle')}>
        <LoadingSkeleton variant="dashboard" cardCount={8} />
      </Layout>
    )
  }

  return (
    <Layout onNavigate={onNavigate} pageTitle={t('portalTitle')}>
      <div className="d-flex flex-column gap-4">
        <section className="card border-0 shadow-sm" aria-labelledby="admin-dashboard-hero">
          <div className="card-body p-4">
            <p id="admin-dashboard-hero" className="text-uppercase text-secondary fw-semibold small mb-1">
              {strings.subtitle}
            </p>
            <p className="lead mb-3">
              Hi {displayName}. {strings.helper}
            </p>
            <div className="d-flex flex-wrap align-items-center gap-2">
              {strings.badge ? (
                <span className="badge text-bg-primary px-3 py-2">{strings.badge}</span>
              ) : null}
              {strings.billing?.monthLabel ? (
                <span className="badge text-bg-light text-primary border border-primary px-3 py-2">
                  {strings.billing.monthLabel}
                </span>
              ) : null}
            </div>
          </div>
        </section>

        <section aria-label={strings.keyMetricsLabel} className="d-flex flex-column gap-3">
          <div className="row g-3">
            {strings.summaryCards.map((card) => (
              <div key={card.label} className="col-12 col-sm-6 col-lg-3">
                <article className="card h-100 shadow-sm border-0">
                  <div className="card-body d-flex flex-column gap-2">
                    <div className="d-flex justify-content-between align-items-start">
                      <p className="text-body-secondary text-uppercase small fw-semibold mb-0">{card.label}</p>
                      {card.tag ? (
                        <span className="badge text-bg-light text-primary border border-primary">{card.tag}</span>
                      ) : null}
                    </div>
                    <p className="h4 mb-0">{card.value}</p>
                    <p className="text-body-secondary mb-0">{card.helper}</p>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </section>

        <section aria-label={strings.actionsLabel} className="row g-3">
          <div className="col-12 col-lg-8 d-flex flex-column gap-3">
            <div className="card h-100 shadow-sm border-0">
              <div className="card-body p-4 d-flex flex-column gap-3">
                <div className="d-flex flex-column flex-lg-row justify-content-between gap-2">
                  <div>
                    <p className="text-uppercase text-secondary fw-semibold small mb-1">{strings.collectionsEyebrow}</p>
                    <h3 className="h5 mb-1">{strings.collectionsTitle}</h3>
                    <p className="text-body-secondary mb-0">{strings.collectionsHelper}</p>
                  </div>
                  {strings.billing?.nextCharge ? (
                    <div className="d-flex align-items-center gap-2 bg-light border rounded px-3 py-2">
                      <span className="text-body-secondary small">{strings.nextChargeLabel}</span>
                      <strong>{strings.billing.nextCharge}</strong>
                    </div>
                  ) : null}
                </div>

                <div className="row g-3">
                  <div className="col-12 col-lg-6 d-flex flex-column gap-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <p className="fw-semibold mb-0">{strings.upcomingPaymentsTitle}</p>
                      <span className="badge text-bg-light text-secondary border border-secondary">
                        {strings.upcomingPaymentsHelper}
                      </span>
                    </div>
                    <ul className="list-group list-group-flush">
                      {strings.upcomingPayments.map((payment) => (
                        <li
                          key={`${payment.school}-${payment.dueDate}`}
                          className="list-group-item d-flex justify-content-between align-items-start gap-3 px-0"
                        >
                          <div>
                            <p className="fw-semibold mb-0">{payment.school}</p>
                            <p className="text-body-secondary mb-0">{payment.dueDate}</p>
                          </div>
                          <div className="d-flex flex-column align-items-end gap-1">
                            <span className="badge text-bg-primary">{payment.amount}</span>
                            <span className="badge text-bg-warning text-dark">{payment.status}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="col-12 col-lg-6 d-flex flex-column gap-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <p className="fw-semibold mb-0">{strings.pendingInvoicesTitle}</p>
                      <span className="badge text-bg-light text-secondary border border-secondary">
                        {strings.pendingInvoicesHelper}
                      </span>
                    </div>
                    <ul className="list-group list-group-flush">
                      {strings.pendingInvoices.map((invoice) => (
                        <li
                          key={`${invoice.school}-${invoice.amount}`}
                          className="list-group-item d-flex justify-content-between align-items-start gap-3 px-0"
                        >
                          <div>
                            <p className="fw-semibold mb-0">{invoice.school}</p>
                            <p className="text-body-secondary mb-0">{invoice.age}</p>
                          </div>
                          <div className="d-flex flex-column align-items-end gap-1">
                            <span className="badge text-bg-primary">{invoice.amount}</span>
                            <span className="badge text-bg-danger">{invoice.status}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-4 d-flex flex-column gap-3">
            <div className="card h-100 shadow-sm border-0">
              <div className="card-body p-4">
                <p className="text-uppercase text-secondary fw-semibold small mb-1">{strings.userMixEyebrow}</p>
                <h3 className="h5 mb-1">{strings.userMixTitle}</h3>
                <p className="text-body-secondary">{strings.userMixHelper}</p>
                <ul className="list-group list-group-flush">
                  {strings.userMix.map((item) => (
                    <li key={item.label} className="list-group-item px-0">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="fw-semibold">{item.label}</span>
                        <span className="text-body-secondary small">{item.helper}</span>
                      </div>
                      <div className="progress" role="presentation" aria-hidden="true">
                        <div className="progress-bar" style={{ width: item.percentage }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section aria-label={strings.actionsLabel} className="row g-3">
          <div className="col-12 col-lg-6 d-flex flex-column gap-3">
            <div className="card h-100 shadow-sm border-0">
              <div className="card-body p-4">
                <p className="text-uppercase text-secondary fw-semibold small mb-1">{strings.healthEyebrow}</p>
                <h3 className="h5 mb-1">{strings.healthTitle}</h3>
                <p className="text-body-secondary">{strings.healthHelper}</p>
                <ul className="list-group list-group-flush">
                  {strings.systemHealth.map((item) => (
                    <li
                      key={item.label}
                      className="list-group-item px-0 d-flex justify-content-between align-items-start"
                    >
                      <div>
                        <p className="fw-semibold mb-0">{item.label}</p>
                        <p className="text-body-secondary mb-0">{item.helper}</p>
                      </div>
                      <span className={`badge text-bg-${STATUS_VARIANT_MAP[item.statusVariant] ?? 'secondary'}`}>
                        {item.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <div className="card h-100 shadow-sm border-0">
              <div className="card-body p-4">
                <p className="text-uppercase text-secondary fw-semibold small mb-1">{strings.actionsEyebrow}</p>
                <h3 className="h5 mb-1">{strings.actionsTitle}</h3>
                <p className="text-body-secondary">{strings.actionsHelper}</p>
                <div className="row g-3 mt-2">
                  {strings.quickLinks.map((link) => (
                    <div key={link.title} className="col-12 col-md-6">
                      <article className="card h-100 border shadow-sm">
                        <div className="card-body d-flex flex-column gap-2">
                          <p className="fw-semibold mb-0">{link.title}</p>
                          <p className="text-body-secondary mb-0">{link.description}</p>
                          {link.hint ? <p className="text-body-secondary small mb-0">{link.hint}</p> : null}
                        </div>
                      </article>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  )
}
