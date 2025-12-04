import { useMemo } from 'react'
import { Layout } from '../../layout/Layout'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import type { BreadcrumbItem } from '../../components/Breadcrumb'

interface PaymentRequestDetailPageProps {
  onNavigate: (path: string) => void
  paymentRequestId: number
}

export function PaymentRequestDetailPage({ onNavigate, paymentRequestId }: PaymentRequestDetailPageProps) {
  const { t, locale } = useLanguage()
  const { hydrated } = useAuth()

  const breadcrumbItems: BreadcrumbItem[] = useMemo(
    () => [
      {
        label: t('portalTitle'),
        onClick: () => onNavigate(`/${locale}`),
      },
      {
        label: t('paymentsFinance'),
        onClick: () => onNavigate(`/${locale}/finance/request`),
      },
      { label: `${t('paymentRequestDetail')} #${paymentRequestId}` },
    ],
    [locale, onNavigate, paymentRequestId, t],
  )

  if (!hydrated) {
    return (
      <Layout onNavigate={onNavigate} pageTitle={t('paymentRequestDetail')} breadcrumbItems={breadcrumbItems}>
        <div className="alert alert-info mb-0" role="alert">
          {t('loadingRequest')}
        </div>
      </Layout>
    )
  }

  return (
    <Layout onNavigate={onNavigate} pageTitle={t('paymentRequestDetail')} breadcrumbItems={breadcrumbItems}>
      <div className="card shadow-sm border-0">
        <div className="card-body">
          <h5 className="card-title mb-3">{t('paymentRequestDetail')}</h5>
          <p className="text-muted mb-0">{t('paymentRequestPlaceholder').replace('{id}', String(paymentRequestId))}</p>
        </div>
      </div>
    </Layout>
  )
}
