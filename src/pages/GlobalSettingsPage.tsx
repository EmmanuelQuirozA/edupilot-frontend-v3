import { useCallback, useEffect, useMemo, useState } from 'react'
import './GlobalSettingsPage.css'
import type { BreadcrumbItem } from '../components/Breadcrumb'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { Layout } from '../layout/Layout'
import { API_BASE_URL } from '../config'
import { RolesPermissionsPage } from './RolesPermissionsPage'
import { PrinterSettingsSection } from '../components/PrinterSettingsSection'
import { PaymentConceptModal, type PaymentConcept } from '../components/PaymentConceptModal'

interface GlobalSettingsPageProps {
  onNavigate: (path: string) => void
  initialTab?: 'settings' | 'catalogs' | 'roles'
}

export function GlobalSettingsPage({ onNavigate, initialTab = 'catalogs' }: GlobalSettingsPageProps) {
  const { token } = useAuth()
  const { locale, t } = useLanguage()
  const [activeTab, setActiveTab] = useState<'settings' | 'catalogs' | 'roles'>(initialTab)
  const [paymentConcepts, setPaymentConcepts] = useState<PaymentConcept[]>([])
  const [paymentConceptsLoading, setPaymentConceptsLoading] = useState(false)
  const [isConceptModalOpen, setIsConceptModalOpen] = useState(false)
  const [conceptModalMode, setConceptModalMode] = useState<'create' | 'edit'>('create')
  const [selectedConcept, setSelectedConcept] = useState<PaymentConcept | null>(null)

  const breadcrumbItems: BreadcrumbItem[] = useMemo(
    () => [
      {
        label: t('portalTitle'),
        onClick: () => onNavigate(`/${locale}`),
      },
      { label: t('globalSettingsTitle') },
    ],
    [locale, onNavigate, t],
  )
  
  const fetchPaymentConcepts = useCallback(async () => {
    if (!token) {
      setPaymentConcepts([])
      return
    }
    setPaymentConceptsLoading(true)
    try {
      const params = new URLSearchParams({ lang: locale })
      const response = await fetch(`${API_BASE_URL}/catalog/payment-concepts?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('failed_request')
      const data = (await response.json()) as PaymentConcept[]
      setPaymentConcepts(data)
    } catch (error) {
      setPaymentConcepts([])
    } finally {
      setPaymentConceptsLoading(false)
    }
  }, [locale, token])

  useEffect(() => {
    fetchPaymentConcepts()
  }, [fetchPaymentConcepts])

  const handleOpenCreateConcept = () => {
    setConceptModalMode('create')
    setSelectedConcept(null)
    setIsConceptModalOpen(true)
  }

  const handleOpenEditConcept = (concept: PaymentConcept) => {
    setConceptModalMode('edit')
    setSelectedConcept(concept)
    setIsConceptModalOpen(true)
  }

  const handleCloseConceptModal = () => setIsConceptModalOpen(false)

  return (
    <Layout onNavigate={onNavigate} pageTitle={t('globalSettingsTitle')} breadcrumbItems={breadcrumbItems}>
      <div className="d-flex flex-column gap-4">
        <div className="card shadow-sm">
          <div className="card-body">
            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
              <div>
                <h2 className="h4 mb-1">{t('globalSettingsTitle')}</h2>
                <p className="text-muted mb-0">{t('globalSettingsSubtitle')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm">
          <div className="card-body">
            <div className="row g-0">
              <div className="col-12 col-lg-3 border-end pe-lg-4">
                <div className="global-settings__tabs">
                  <p className="text-uppercase text-muted fw-semibold small mb-3">{t('globalSettingsGeneralTitle')}</p>
                  <div className="nav flex-column nav-pills gap-2" role="tablist">
                    <button
                      type="button"
                      className={`nav-link text-start d-flex align-items-center gap-2 ${
                        activeTab === 'catalogs' ? 'active text-primary' : 'text-secondary'
                      }`}
                      role="tab"
                      onClick={() => setActiveTab('catalogs')}
                    >
                      <i className="bi bi-cash-stack" aria-hidden="true" />
                      <span>{t('globalSettingsFinancialCatalogsTab')}</span>
                    </button>
                    <button
                      type="button"
                      className={`nav-link text-start d-flex align-items-center gap-2 ${
                        activeTab === 'settings' ? 'active text-primary' : 'text-secondary'
                      }`}
                      role="tab"
                      onClick={() => setActiveTab('settings')}
                    >
                      <i className="bi bi-printer" aria-hidden="true" />
                      <span>{t('globalSettingsPrintersTab')}</span>
                    </button>
                    <button
                      type="button"
                      className={`nav-link text-start d-flex align-items-center gap-2 ${
                        activeTab === 'roles' ? 'active text-primary' : 'text-secondary'
                      }`}
                      role="tab"
                      onClick={() => setActiveTab('roles')}
                    >
                      <i className="bi bi-shield-lock" aria-hidden="true" />
                      <span>{t('globalSettingsRolesTab')}</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="col-12 col-lg-9 ps-lg-4 pt-4 pt-lg-0">
                {activeTab === 'settings' ? (
                  <>
                    <h3 className="h5 mb-3">{t('globalSettingsPrintersTab')}</h3>
                    <PrinterSettingsSection />
                  </>
                ) : activeTab === 'catalogs' ? (
                  <>
                    <h3 className="h5 mb-3">{t('globalSettingsFinancialCatalogsTab')}</h3>
                    <div className="row row-cols-1 row-cols-xl-2 g-4">
                      <div className="col">
                        <div className="card shadow-sm h-100 financial-catalog-card">
                          <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between mb-3">
                              <h4 className="h6 mb-0">{t('financialCatalogsConceptsTitle')}</h4>
                              <button type="button" className="btn btn-link p-0" onClick={handleOpenCreateConcept}>
                                <span className="text-primary fw-semibold">
                                  + {t('financialCatalogsNew')}
                                </span>
                              </button>
                            </div>
                            {paymentConceptsLoading ? (
                              <span className="badge bg-secondary">{t('tableLoading')}</span>
                            ) : paymentConcepts.length ? (
                              <div className="list-group list-group-flush">
                                {paymentConcepts.map((concept) => (
                                  <div
                                    key={concept.payment_concept_id}
                                    className="list-group-item d-flex align-items-center justify-content-between gap-3"
                                  >
                                    <div>
                                      <p className="fw-semibold mb-1">
                                        {locale === 'es' ? concept.name_es : concept.name_en}
                                      </p>
                                      <small className="text-muted">
                                        {locale === 'es' ? concept.description_es : concept.description_en}
                                      </small>
                                    </div>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-secondary"
                                      onClick={() => handleOpenEditConcept(concept)}
                                      aria-label={t('paymentConceptUpdateTitle')}
                                    >
                                      <i className="bi bi-pencil" aria-hidden="true" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-muted mb-0">{t('financialCatalogsEmptyConcepts')}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="col">
                        <div className="card shadow-sm h-100 financial-catalog-card">
                          <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between mb-3">
                              <h4 className="h6 mb-0">{t('financialCatalogsMethodsTitle')}</h4>
                            </div>
                            <p className="text-muted mb-0">{t('financialCatalogsEmptyMethods')}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <RolesPermissionsPage onNavigate={onNavigate} embedded />
                )}
              </div>
            </div>
          </div>
        </div>
        <PaymentConceptModal
          isOpen={isConceptModalOpen}
          mode={conceptModalMode}
          concept={selectedConcept}
          onClose={handleCloseConceptModal}
          onSaved={fetchPaymentConcepts}
        />
      </div>
    </Layout>
  )
}
