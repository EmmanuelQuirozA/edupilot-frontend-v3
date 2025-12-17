import { useEffect, useMemo, useState } from 'react'
import Tabs from '../../components/ui/Tabs'
import { Layout } from '../../layout/Layout'
import { Role, useAuth } from '../../context/AuthContext'
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

function decodeRoleFromToken(token: string | null): Role {
  try {
    if (!token) return 'UNKNOWN'
    const payload = token.split('.')[1]
    const decoded = JSON.parse(atob(payload))
    return (decoded.role as Role) || 'UNKNOWN'
  } catch (error) {
    console.error('Could not decode token', error)
    return 'UNKNOWN'
  }
}

export function PaymentsFinancePage({ onNavigate, currentPath }: PaymentsFinancePageProps) {
  const { hydrated, token } = useAuth()
  const isStudent = useMemo(() => decodeRoleFromToken(token) === 'STUDENT', [token])
  const { locale, t } = useLanguage()
  const { permissions: tuitionsPermissions, loading: tuitionsPermissionsLoading, error: tuitionsPermissionsError, loaded: tuitionsPermissionsLoaded } = useModulePermissions('tuitions')
  const { permissions: requestsPermissions, loading: requestsPermissionsLoading, error: requestsPermissionsError, loaded: requestsPermissionsLoaded } = useModulePermissions('requests')
  const { permissions: paymentsPermissions, loading: paymentsPermissionsLoading, error: paymentsPermissionsError, loaded: paymentsPermissionsLoaded } = useModulePermissions('payments')

  const defaultStudentPermissions = useMemo(
    () => (isStudent ? { c: false, r: true, u: false, d: false } : null),
    [isStudent],
  )

  const effectiveTuitionsPermissions = defaultStudentPermissions ?? tuitionsPermissions
  const effectiveRequestsPermissions = defaultStudentPermissions ?? requestsPermissions
  const effectivePaymentsPermissions = defaultStudentPermissions ?? paymentsPermissions

  const tuitionsLoading = isStudent ? false : tuitionsPermissionsLoading
  const requestsLoading = isStudent ? false : requestsPermissionsLoading
  const paymentsLoading = isStudent ? false : paymentsPermissionsLoading

  const tuitionsLoaded = isStudent ? true : tuitionsPermissionsLoaded
  const requestsLoaded = isStudent ? true : requestsPermissionsLoaded
  const paymentsLoaded = isStudent ? true : paymentsPermissionsLoaded

  const permissionsError = isStudent
    ? null
    : tuitionsPermissionsError || requestsPermissionsError || paymentsPermissionsError

  const [error] = useState<string | null>(null)

  // Tabs
  const [activeTab, setActiveTab] = useState<'tuitions' | 'paymentRequests' | 'payments'>('tuitions')

  const tabLabels = useMemo(
    () => ({
      tuitions: t('tuitions'),
      paymentRequests: t('paymentRequests'),
      payments: t('payments'),
    }),
    [t],
  )

  const availableTabs = useMemo(
    () => {
      const tabsList: { key: 'tuitions' | 'paymentRequests' | 'payments'; label: string }[] = []

      if (effectiveTuitionsPermissions?.r) {
        tabsList.push({ key: 'tuitions', label: tabLabels.tuitions })
      }

      if (effectiveRequestsPermissions?.r) {
        tabsList.push({ key: 'paymentRequests', label: tabLabels.paymentRequests })
      }

      if (effectivePaymentsPermissions?.r) {
        tabsList.push({ key: 'payments', label: tabLabels.payments })
      }

      return tabsList
    },
    [effectivePaymentsPermissions?.r, effectiveRequestsPermissions?.r, tabLabels, effectiveTuitionsPermissions?.r],
  )

  const breadcrumbItems: BreadcrumbItem[] = useMemo(
    () => [
      {
        label: t('portalTitle'),
        onClick: () => onNavigate(`/${locale}`),
      },
      { label: t('finance') },
      { label: tabLabels[activeTab] },
    ],
    [activeTab, locale, onNavigate, tabLabels, t],
  )

  useEffect(() => {
    if (!availableTabs.length) return

    const availableKeys = availableTabs.map((tab) => tab.key)

    if (currentPath.includes('/finance/payments') && availableKeys.includes('payments')) {
      setActiveTab('payments')
    } else if (currentPath.includes('/finance/request') && availableKeys.includes('paymentRequests')) {
      setActiveTab('paymentRequests')
    } else if (availableKeys.includes('tuitions')) {
      setActiveTab('tuitions')
    } else {
      setActiveTab(availableTabs[0].key)
    }
  }, [availableTabs, currentPath])

  const handleTabChange = (key: string) => {
    const nextTab = key as 'tuitions' | 'paymentRequests' | 'payments'

    if (!availableTabs.length) return

    if (!availableTabs.some((tab) => tab.key === nextTab)) {
      setActiveTab(availableTabs[0].key)
      return
    }

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
      tuitionsLoading || !tuitionsLoaded ||
      requestsLoading || !requestsLoaded ||
      paymentsLoading || !paymentsLoaded
    ) {
      return (
        <>
          <LoadingSkeleton variant="table" rowCount={10} />
        </>
      )
    }

    if (permissionsError) {
      return (
        <>
          <div className="alert alert-danger" role="alert">
            {t('defaultError')}
          </div>
        </>
      )
    }
      
    if (
      (tuitionsLoaded && effectiveTuitionsPermissions && !effectiveTuitionsPermissions.r)
      &&
      (requestsLoaded && effectiveRequestsPermissions && !effectiveRequestsPermissions.r)
      &&
      (paymentsLoaded && effectivePaymentsPermissions && !effectivePaymentsPermissions.r)
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
              tabs={availableTabs}
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
            <PaymentRequestsTab onNavigate={onNavigate} isStudent={isStudent} />
          </>
        )}
        {activeTab === 'payments' && (
          <>
            <PaymentsTab onNavigate={onNavigate} isStudent={isStudent} />
          </>
        )}
      </div>
    </Layout>
  )
}
