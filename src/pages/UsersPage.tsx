import { useMemo, useState } from 'react'
import { Layout } from '../layout/Layout'
import { useLanguage } from '../context/LanguageContext'
import type { BreadcrumbItem } from '../components/Breadcrumb'
import Tabs from '../components/ui/Tabs'
import { StaffUsersTab } from './users/StaffUsersTab'
import { ProfessorsUsersTab } from './users/ProfessorsUsersTab'
import './UsersPage.css'

interface UsersPageProps {
  onNavigate: (path: string) => void
}

export function UsersPage({ onNavigate }: UsersPageProps) {
  const { locale, t } = useLanguage()
  const [activeTab, setActiveTab] = useState<'staff' | 'professors'>('staff')

  const tabs = [
    { key: 'staff', label: t('staff') },
    { key: 'professors', label: t('professors') },
  ]

  const breadcrumbItems: BreadcrumbItem[] = useMemo(
    () => [
      {
        label: t('portalTitle'),
        onClick: () => onNavigate(`/${locale}`),
      },
      { label: t('users') },
    ],
    [locale, onNavigate, t],
  )

  return (
    <Layout onNavigate={onNavigate} pageTitle={t('users')} breadcrumbItems={breadcrumbItems}>
      <div className="users-page d-flex flex-column gap-3">
        <div className="users-page__header border-0">
          <div className="card-body d-flex flex-column gap-3 flex-lg-row align-items-lg-center justify-content-lg-between">
            <Tabs
              tabs={tabs}
              activeKey={activeTab}
              onSelect={(key) => setActiveTab(key as 'staff' | 'professors')}
            />
          </div>
        </div>

        {activeTab === 'staff' ? <StaffUsersTab /> : <ProfessorsUsersTab />}
      </div>
    </Layout>
  )
}
