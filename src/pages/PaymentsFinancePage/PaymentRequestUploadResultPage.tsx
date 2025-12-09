import { useMemo } from 'react'
import { Layout } from '../../layout/Layout'
import { useLanguage } from '../../context/LanguageContext'
import StudentTableCell from '../../components/ui/StudentTableCell'
import type { BreadcrumbItem } from '../../components/Breadcrumb'

interface PaymentRequestUploadResultPageProps {
  onNavigate: (path: string) => void
  massUploadId: number
}

interface CreationResultRow {
  full_name: string
  student_id: number
  register_id: string
  payment_request_id: number
}

interface CreationResultData {
  mass_upload?: number
  created_count?: number
  duplicate_count?: number
  created?: CreationResultRow[]
}

export function PaymentRequestUploadResultPage({ onNavigate, massUploadId }: PaymentRequestUploadResultPageProps) {
  const { locale, t } = useLanguage()

  const breadcrumbItems: BreadcrumbItem[] = useMemo(
    () => [
      {
        label: t('portalTitle'),
        onClick: () => onNavigate(`/${locale}`),
      },
      {
        label: t('paymentRequests'),
        onClick: () => onNavigate(`/${locale}/finance/request`),
      },
      { label: t('uploadResultTitle') },
    ],
    [locale, onNavigate, t],
  )

  const resultData: CreationResultData | null = useMemo(() => {
    const storageKey = `paymentRequestUploadResult:${massUploadId}`

    try {
      const stored = localStorage.getItem(storageKey)
      return stored ? (JSON.parse(stored) as CreationResultData) : null
    } catch (storageError) {
      console.error('Unable to load creation result', storageError)
      return null
    }
  }, [massUploadId])

  const rows = resultData?.created ?? []

  const handleDownloadReport = () => {
    if (!rows.length) return

    const headers = ['Resultado', 'Alumno', 'Solicitud']
    const csvRows = rows.map((row) => {
      return ['Creada', row.full_name, row.payment_request_id]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(',')
    })

    const csvContent = [headers.join(','), ...csvRows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `resultado-solicitudes-${massUploadId}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  return (
    <Layout onNavigate={onNavigate} pageTitle={t('uploadResultTitle')} breadcrumbItems={breadcrumbItems}>
      <div className="d-flex flex-column gap-3">
        <div className="d-flex align-items-center gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={() => onNavigate(`/${locale}/finance/request`)}>
            {t('goBack')}
          </button>
          <button type="button" className="btn btn-primary" onClick={handleDownloadReport} disabled={!rows.length}>
            {t('downloadReport')}
          </button>
        </div>

        <div className="card shadow-sm border-0">
          <div className="card-body">
            <h5 className="mb-3">{t('uploadResultSummary')}</h5>
            <div className="row g-3">
              <div className="col-md-4">
                <div className="p-3 rounded-3 bg-light border h-100">
                  <p className="text-muted mb-1">Mass upload ID</p>
                  <h5 className="mb-0">{resultData?.mass_upload ?? '-'} </h5>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 rounded-3 bg-light border h-100">
                  <p className="text-muted mb-1">{t('createdCount')}</p>
                  <h5 className="mb-0">{resultData?.created_count ?? 0}</h5>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 rounded-3 bg-light border h-100">
                  <p className="text-muted mb-1">{t('duplicateCount')}</p>
                  <h5 className="mb-0">{resultData?.duplicate_count ?? 0}</h5>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-0">
          <div className="card-body">
            <h5 className="mb-3">{t('uploadResultListTitle')}</h5>
            {!rows.length ? (
              <div className="alert alert-info mb-0" role="alert">
                {t('noResultsAvailable')}
              </div>
            ) : (
               <div className="table-responsive">
                 <table className="table align-middle">
                   <thead>
                     <tr>
                       <th scope="col">Resultado</th>
                       <th scope="col">Alumno</th>
                       <th scope="col">Solicitud</th>
                     </tr>
                   </thead>
                   <tbody>
                     {rows.map((row) => (
                       <tr key={`${row.payment_request_id}-${row.student_id}`}>
                         <td>
                           <span className="badge bg-success">Creada</span>
                         </td>
                         <td>
                           <StudentTableCell
                             name={row.full_name}
                             enrollment={row.register_id}
                             onClick={() => onNavigate(`/${locale}/students/${row.student_id}`)}
                             nameButtonProps={{ 'aria-label': row.full_name }}
                           />
                         </td>
                         <td>
                           <div className="d-flex align-items-center gap-2">
                             <span className="fw-semibold">#{row.payment_request_id}</span>
                             <button
                               type="button"
                               className="btn btn-link btn-sm p-0"
                               onClick={() => onNavigate(`/${locale}/finance/request/${row.payment_request_id}`)}
                             >
                               {t('viewDetails')}
                             </button>
                           </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default PaymentRequestUploadResultPage
