import { useEffect, useMemo, useState } from 'react'
import Tabs from '../../components/ui/Tabs'
import { Layout } from '../../layout/Layout'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'

import { TuitionTab } from './components/TuitionTab'
import { PaymentsTab } from './components/PaymentsTab'
import { PaymentRequestsTab } from './components/PaymentRequestsTab'

import './PaymentsFinancePage.css'
import { LoadingSkeleton } from '../../components/LoadingSkeleton'
import type { BreadcrumbItem } from '../../components/Breadcrumb'
import { useModulePermissions } from '../../hooks/useModulePermissions'
import { NoPermission } from '../../components/NoPermission'

interface PaymentsFinancePageProps {
  onNavigate: (path: string) => void
  currentPath: string
}

export function PaymentsFinancePage({ onNavigate, currentPath }: PaymentsFinancePageProps) {
  const { hydrated } = useAuth()
  const { locale, t } = useLanguage()
    const { permissions: tuitionsPermissions, loading: tuitionsPermissionsLoading, error: tuitionsPermissionsError, loaded: tuitionsPermissionsLoaded } = useModulePermissions('tuitions')
    const { permissions: requestsPermissions, loading: requestsPermissionsLoading, error: requestsPermissionsError, loaded: requestsPermissionsLoaded } = useModulePermissions('requests')
    const { permissions: paymentsPermissions, loading: paymentsPermissionsLoading, error: paymentsPermissionsError, loaded: paymentsPermissionsLoaded } = useModulePermissions('payments')

  const [error] = useState<string | null>(null)

  // Tabs
  const [activeTab, setActiveTab] = useState<'tuitions' | 'paymentRequests' | 'payments'>('tuitions');
  const tabs = [
    { key: 'tuitions', label: t('tuitions') },
    { key: 'paymentRequests', label: t('paymentRequests') },
    { key: 'payments', label: t('payments') }
  ];

  const breadcrumbItems: BreadcrumbItem[] = useMemo(
    () => [
      {
        label: t('portalTitle'),
        onClick: () => onNavigate(`/${locale}`),
      },
      { label: t('studentsGroups') },
    ],
    [locale, onNavigate, t],
  )

  useEffect(() => {
    const setTabs = async () => {
      if (currentPath.includes('/finance/payments')) {
        setActiveTab('payments')
      } else if (currentPath.includes('/finance/request')) {
        setActiveTab('paymentRequests')
      } else {
        setActiveTab('tuitions')
      }
    }
    setTabs()
  }, [currentPath])

  const handleTabChange = (key: string) => {
    const nextTab = key as 'tuitions' | 'paymentRequests' | 'payments'
    setActiveTab(nextTab)

    if (nextTab === 'payments') {
      onNavigate(`/${locale}/finance/payments`)
    } else if (nextTab === 'paymentRequests') {
      onNavigate(`/${locale}/finance/request`)
    } else {
      onNavigate(`/${locale}/finance`)
    }
  }
    
    if (
      tuitionsPermissionsLoading || !tuitionsPermissionsLoaded || 
      requestsPermissionsLoading || !requestsPermissionsLoaded || 
      paymentsPermissionsLoading || !paymentsPermissionsLoaded
    ) {
      return (
        <>
          <LoadingSkeleton variant="table" rowCount={10} />
        </>
      )
    }
  
    if (
      tuitionsPermissionsError || 
      requestsPermissionsError || 
      paymentsPermissionsError) {
      return (
        <>
          <div className="alert alert-danger" role="alert">
            {t('defaultError')}
          </div>
        </>
      )
    }
      
    if (
      (tuitionsPermissionsLoaded && tuitionsPermissions && !tuitionsPermissions.r)
      &&
      (requestsPermissionsLoaded && requestsPermissions && !requestsPermissions.r)
      &&
      (paymentsPermissionsLoaded && paymentsPermissions && !paymentsPermissions.r)
    ) {
      return (
        <Layout onNavigate={onNavigate} pageTitle={t('portalTitle')} breadcrumbItems={breadcrumbItems}>
          <NoPermission />
        </Layout>
      )
    }

  if (!hydrated) {
    return (
      <Layout onNavigate={onNavigate} pageTitle={t('portalTitle')} breadcrumbItems={breadcrumbItems}>
        <LoadingSkeleton variant="table" rowCount={10} />
      </Layout>
    )
  }
  return (
    <Layout onNavigate={onNavigate} pageTitle={t('paymentsFinance')} breadcrumbItems={breadcrumbItems}>
      <div className="students-page d-flex flex-column gap-3">
        {error ? (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        ) : null}

        <div className="students-page__header  border-0">
          <div className="card-body d-flex flex-column gap-3 flex-md-row align-items-md-center justify-content-between">
            <Tabs
              tabs={tabs}
              activeKey={activeTab}
              onSelect={handleTabChange}
            />
          </div>
        </div>
        {activeTab === 'tuitions' && (
          <>
            <TuitionTab onNavigate={onNavigate} />
          </>
        )}
        {activeTab === 'paymentRequests' && (
          <>
            <PaymentRequestsTab onNavigate={onNavigate}/>
          </>
        )}
        {activeTab === 'payments' && (
          <>
            <PaymentsTab onNavigate={onNavigate}/>
          </>
        )}
      </div>
    </Layout>
  )
}