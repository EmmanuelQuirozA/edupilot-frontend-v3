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

type TabKey = 'tuitions' | 'paymentRequests' | 'payments'

interface PaymentsFinancePageProps {
  onNavigate: (path: string) => void
  currentPath: string
}

export function PaymentsFinancePage({ onNavigate, currentPath }: PaymentsFinancePageProps) {
  const { hydrated } = useAuth()
  const { locale, t } = useLanguage()
  const {
    permissions: tuitionsPermissions,
    loading: tuitionsPermissionsLoading,
    error: tuitionsPermissionsError,
    loaded: tuitionsPermissionsLoaded,
  } = useModulePermissions('tuitions')
  const {
    permissions: requestsPermissions,
    loading: requestsPermissionsLoading,
    error: requestsPermissionsError,
    loaded: requestsPermissionsLoaded,
  } = useModulePermissions('requests')
  const {
    permissions: paymentsPermissions,
    loading: paymentsPermissionsLoading,
    error: paymentsPermissionsError,
    loaded: paymentsPermissionsLoaded,
  } = useModulePermissions('payments')

  const [error] = useState<string | null>(null)

  const permissionsMap: Record<TabKey, typeof tuitionsPermissions> = useMemo(
    () => ({
      tuitions: tuitionsPermissions,
      paymentRequests: requestsPermissions,
      payments: paymentsPermissions,
    }),
    [paymentsPermissions, requestsPermissions, tuitionsPermissions],
  )

  const allTabs = useMemo(
    () => [
      { key: 'tuitions', label: t('tuitions'), path: `/${locale}/finance` },
      { key: 'paymentRequests', label: t('paymentRequests'), path: `/${locale}/finance/request` },
      { key: 'payments', label: t('payments'), path: `/${locale}/finance/payments` },
    ] as const,
    [locale, t],
  )

  const visibleTabs = useMemo(
    () => allTabs.filter((tab) => permissionsMap[tab.key]?.r === true),
    [allTabs, permissionsMap],
  )

  const activeTab = useMemo(() => {
    if (!visibleTabs.length) return null

    const matchingTab = visibleTabs.find((tab) => currentPath.startsWith(tab.path))
    return (matchingTab ?? visibleTabs[0]).key
  }, [currentPath, visibleTabs])

  const breadcrumbItems: BreadcrumbItem[] = useMemo(
    () => {
      const activeTabLabel = visibleTabs.find((tab) => tab.key === activeTab)?.label

      return [
        {
          label: t('portalTitle'),
          onClick: () => onNavigate(`/${locale}`),
        },
        { label: t('paymentsFinance') },
        activeTabLabel ? { label: activeTabLabel } : null,
      ].filter(Boolean) as BreadcrumbItem[]
    },
    [activeTab, locale, onNavigate, t, visibleTabs],
  )

  useEffect(() => {
    if (!visibleTabs.length) return

    const matchingTab = visibleTabs.find((tab) => currentPath.startsWith(tab.path))
    if (matchingTab) return

    const fallbackTab = visibleTabs[0]
    if (!currentPath.startsWith(fallbackTab.path)) {
      onNavigate(fallbackTab.path)
    }
  }, [currentPath, onNavigate, visibleTabs])

  const handleTabChange = (key: string) => {
    const nextTab = visibleTabs.find((tab) => tab.key === key)
    if (!nextTab) return

    onNavigate(nextTab.path)
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

  if (!visibleTabs.length) {
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
            {activeTab ? (
              <Tabs
                tabs={visibleTabs}
                activeKey={activeTab}
                onSelect={handleTabChange}
              />
            ) : null}
          </div>
        </div>
        {activeTab === 'tuitions' && permissionsMap.tuitions?.r && (
          <>
            <TuitionTab onNavigate={onNavigate} />
          </>
        )}
        {activeTab === 'paymentRequests' && permissionsMap.paymentRequests?.r && (
          <>
            <PaymentRequestsTab onNavigate={onNavigate} />
          </>
        )}
        {activeTab === 'payments' && permissionsMap.payments?.r && (
          <>
            <PaymentsTab onNavigate={onNavigate} />
          </>
        )}
      </div>
    </Layout>
  )
}