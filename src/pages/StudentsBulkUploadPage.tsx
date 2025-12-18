import { useEffect, useMemo, useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import './StudentsBulkUploadPage.css'
import { Layout } from '../layout/Layout'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { API_BASE_URL } from '../config'
import { type BreadcrumbItem } from '../components/Breadcrumb'
import { LoadingSkeleton } from '../components/LoadingSkeleton'

interface SchoolCatalogItem {
  school_id: number
  description: string
}

interface GroupCatalogItem {
  group_id?: number | string
  grade_group?: string
}

interface BulkStudentRow {
  rowNumber: number
  first_name?: string
  last_name_father?: string
  last_name_mother?: string
  birth_date?: string
  phone_number?: string
  tax_id?: string
  curp?: string
  street?: string
  ext_number?: string
  int_number?: string
  suburb?: string
  locality?: string
  municipality?: string
  state?: string
  personal_email?: string
  email?: string
  username?: string
  password?: string
  register_id?: string
  payment_reference?: string
  group_id?: string
  balance?: string
}

interface ValidationResult {
  [rowIndex: number]: string[]
}

type CsvFieldKey = Exclude<keyof BulkStudentRow, 'rowNumber'>

const REQUIRED_FIELDS: Array<keyof BulkStudentRow> = [
  'first_name',
  'last_name_father',
  'last_name_mother',
  'email',
  'username',
  'password',
  'register_id',
  'payment_reference',
  'group_id',
]

const UNIQUE_FIELDS: Array<keyof BulkStudentRow> = ['register_id', 'payment_reference', 'username']

const CSV_HEADERS: CsvFieldKey[] = [
  'first_name',
  'last_name_father',
  'last_name_mother',
  'birth_date',
  'phone_number',
  'tax_id',
  'curp',
  'street',
  'ext_number',
  'int_number',
  'suburb',
  'locality',
  'municipality',
  'state',
  'personal_email',
  'email',
  'username',
  'password',
  'register_id',
  'payment_reference',
  'group_id',
  'balance',
]

const CSV_HEADER_MAP = new Map(CSV_HEADERS.map((header) => [header.toLowerCase(), header]))

const MAX_ROWS = 100
const VALIDATION_DEBOUNCE_MS = 30000

export function StudentsBulkUploadPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { token } = useAuth()
  const { locale, t } = useLanguage()

  const [isLoading, setIsLoading] = useState(false)
  const [schools, setSchools] = useState<SchoolCatalogItem[]>([])
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('')
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')
  const [groups, setGroups] = useState<GroupCatalogItem[]>([])

  const [rows, setRows] = useState<BulkStudentRow[]>([])
  const [fileError, setFileError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationResult>({})
  const [isValidating, setIsValidating] = useState(false)
  const [hasValidated, setHasValidated] = useState(false)
  const [logExpanded, setLogExpanded] = useState(true)

  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [showToast, setShowToast] = useState(false)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingCreateRows, setPendingCreateRows] = useState<BulkStudentRow[]>([])
  const [isCreating, setIsCreating] = useState(false)

  const rowRefs = useRef<Record<number, HTMLTableRowElement | null>>({})
  const validationTimeoutRef = useRef<number | null>(null)

  const breadcrumbItems: BreadcrumbItem[] = useMemo(
    () => [
      {
        label: t('portalTitle'),
        onClick: () => onNavigate(`/${locale}`),
      },
      {
        label: t('studentsGroups'),
        onClick: () => onNavigate(`/${locale}/students&Classes`),
      },
      { label: t('studentsBulkUploadTitle') },
    ],
    [locale, onNavigate, t],
  )

  const formatMessage = (template: string, params: Record<string, string | number>) =>
    Object.entries(params).reduce(
      (acc, [key, value]) => acc.replace(`{${key}}`, String(value)),
      template,
    )

  useEffect(() => {
    if (!token) return
    const controller = new AbortController()

    const fetchSchools = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`${API_BASE_URL}/schools/list?lang=${locale}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const json = (await response.json()) as SchoolCatalogItem[]
        setSchools(json ?? [])
      } catch (error) {
        if ((error as DOMException).name !== 'AbortError') {
          setFileError(t('defaultError'))
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchSchools()
    return () => controller.abort()
  }, [locale, t, token])

  useEffect(() => {
    if (!token || !selectedSchoolId) {
      setGroups([])
      setSelectedGroupId('')
      setRows((prev) => {
        const updatedRows = prev.map((row) => ({
          ...row,
          group_id: '',
        }))
        triggerValidation(updatedRows)
        return updatedRows
      })
      setHasValidated(false)
      return
    }

    const controller = new AbortController()
    const fetchGroups = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/groups/catalog?lang=${locale}&school_id=${selectedSchoolId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          },
        )

        if (!response.ok) {
          throw new Error('failed_request')
        }

        const json = (await response.json()) as GroupCatalogItem[]
        setGroups(json ?? [])
      } catch (error) {
        if ((error as DOMException).name !== 'AbortError') {
          setFileError(t('defaultError'))
        }
      }
    }

    fetchGroups()
    return () => controller.abort()
  }, [locale, selectedSchoolId, t, token])

  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        window.clearTimeout(validationTimeoutRef.current)
      }
    }
  }, [])

  const scrollToRow = (rowIndex: number) => {
    const ref = rowRefs.current[rowIndex]
    if (ref) {
      ref.scrollIntoView({ behavior: 'smooth', block: 'center' })
      ref.classList.add('highlight-row')
      window.setTimeout(() => ref.classList.remove('highlight-row'), 2000)
    }
  }

  const handleFile = async (file: File) => {
    setFileError(null)
    setRows([])
    setValidationErrors({})
    setHasValidated(false)

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setFileError(t('studentsBulkUploadInvalidFile'))
      return
    }

    const text = await file.text()
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)

    if (!lines.length) {
      setFileError(t('studentsBulkUploadEmptyFile'))
      return
    }

    const headerValues = lines[0].split(',').map((value) => value.trim())
    const cleanedHeaders = headerValues.map((value) => value.replace(/^"|"$/g, ''))
    const normalizedHeaders = cleanedHeaders.map((value) => value.toLowerCase())
    const dataLines = lines.slice(1)

    if (!CSV_HEADERS.every((header) => normalizedHeaders.includes(header.toLowerCase()))) {
      setFileError(t('studentsBulkUploadHeaderError'))
      return
    }

    if (dataLines.length > MAX_ROWS) {
      setFileError(t('studentsBulkUploadLimitError'))
      return
    }

    const parsedRows: BulkStudentRow[] = dataLines.map((line, index) => {
      const values = line.split(',').map((value) => value.replace(/^"|"$/g, '').trim())
      const row: BulkStudentRow = { rowNumber: index + 1 }

      normalizedHeaders.forEach((header, headerIndex) => {
        const mappedKey = CSV_HEADER_MAP.get(header)
        if (mappedKey) {
          const value = values[headerIndex] ?? ''
          row[mappedKey] = value as BulkStudentRow[typeof mappedKey]
        }
      })

      return row
    })

    const rowsWithGroup = selectedGroupId
      ? parsedRows.map((row) => ({ ...row, group_id: selectedGroupId }))
      : parsedRows

    setRows(rowsWithGroup)
    triggerValidation(rowsWithGroup, { immediate: true })
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (!event.dataTransfer.files?.length) return
    const [file] = event.dataTransfer.files
    if (file) {
      void handleFile(file)
    }
  }

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      void handleFile(file)
    }
  }

  const handleCellChange = (index: number, field: keyof BulkStudentRow, value: string) => {
    setRows((prev) => {
      const updated = prev.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      )
      triggerValidation(updated)
      return updated
    })
    setHasValidated(false)
  }

  const triggerValidation = (nextRows: BulkStudentRow[], options?: { immediate?: boolean }) => {
    if (validationTimeoutRef.current) {
      window.clearTimeout(validationTimeoutRef.current)
    }

    if (options?.immediate) {
      void validateRows(nextRows)
      return
    }

    validationTimeoutRef.current = window.setTimeout(() => {
      void validateRows(nextRows)
    }, VALIDATION_DEBOUNCE_MS)
  }

  const validateRows = async (targetRows: BulkStudentRow[]) => {
    if (!token) return
    setIsValidating(true)

    const errors: ValidationResult = {}

    const duplicateTrackers: Record<string, Map<string, number>> = {}
    UNIQUE_FIELDS.forEach((field) => {
      duplicateTrackers[field] = new Map<string, number>()
    })

    targetRows.forEach((row, index) => {
      REQUIRED_FIELDS.forEach((field) => {
        if (!String(row[field] ?? '').trim()) {
          errors[index] = [
            ...(errors[index] ?? []),
            formatMessage(t('studentsBulkUploadRequired'), { field }),
          ]
        }
      })

      UNIQUE_FIELDS.forEach((field) => {
        const value = String(row[field] ?? '').trim()
        if (!value) return
        const map = duplicateTrackers[field]
        const count = map.get(value) ?? 0
        map.set(value, count + 1)
      })
    })

    UNIQUE_FIELDS.forEach((field) => {
      const map = duplicateTrackers[field]
      map.forEach((count, value) => {
        if (count > 1) {
          targetRows.forEach((row, index) => {
            if (String(row[field] ?? '').trim() === value) {
              errors[index] = [
                ...(errors[index] ?? []),
                formatMessage(t('studentsBulkUploadDuplicate'), { field }),
              ]
            }
          })
        }
      })
    })

    const validationPromises = targetRows.map(async (row, index) => {
      const registerId = String(row.register_id ?? '').trim()
      const paymentReference = String(row.payment_reference ?? '').trim()
      const username = String(row.username ?? '').trim()

      if (!registerId || !paymentReference || !username) {
        return
      }

      const params = new URLSearchParams({
        register_id: registerId,
        payment_reference: paymentReference,
        username,
      })

      try {
        const response = await fetch(`${API_BASE_URL}/students/validate-exist?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) {
          errors[index] = [...(errors[index] ?? []), t('studentsBulkUploadValidationError')]
          return
        }

        const result = (await response.json()) as { exists?: boolean; message?: string }
        if (result.exists) {
          const message = result.message ?? t('studentsBulkUploadExists')
          errors[index] = [...(errors[index] ?? []), message]
        }
      } catch (error) {
        if ((error as DOMException).name !== 'AbortError') {
          errors[index] = [...(errors[index] ?? []), t('studentsBulkUploadValidationError')]
        }
      }
    })

    await Promise.all(validationPromises)

    setValidationErrors(errors)
    setHasValidated(true)
    setIsValidating(false)
  }

  const handleCreate = () => {
    const validRows = rows.filter((_, index) => !(validationErrors[index]?.length))

    if (!validRows.length) {
      setToastMessage(t('studentsBulkUploadNoValid'))
      setShowToast(true)
      return
    }

    const invalidRows = rows.length - validRows.length
    if (invalidRows > 0) {
      setPendingCreateRows(validRows)
      setConfirmOpen(true)
      return
    }

    void sendCreateRequest(validRows)
  }

  const sendCreateRequest = async (payloadRows: BulkStudentRow[]) => {
    if (!token || !payloadRows.length) return
    setIsCreating(true)
    setConfirmOpen(false)
    try {
      const response = await fetch(`${API_BASE_URL}/students/create?lang=${locale}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payloadRows.map((row) => ({
          ...row,
          group_id: row.group_id ? Number(row.group_id) : null,
          balance: row.balance ? Number(row.balance) : '',
        }))),
      })

      if (!response.ok) {
        throw new Error('failed_request')
      }

      const result = (await response.json()) as { title?: string; message?: string }
      setToastMessage(result.message ?? t('studentsBulkUploadCreateSuccess'))
      setShowToast(true)
    } catch (error) {
      if ((error as DOMException).name !== 'AbortError') {
        setToastMessage(t('studentsBulkUploadCreateError'))
        setShowToast(true)
      }
    } finally {
      setIsCreating(false)
    }
  }

  const validRows = rows.filter((_, index) => !(validationErrors[index]?.length))
  const invalidRowsLog = useMemo(
    () =>
      Object.entries(validationErrors).flatMap(([index, messages]) =>
        messages.map((message: string) => ({ row: Number(index) + 1, message })),
      ),
    [validationErrors],
  )

  const downloadReport = () => {
    if (!rows.length) return

    const headers = ['row', 'status', 'messages', ...CSV_HEADERS]
    const lines = rows.map((row, index) => {
      const messages = validationErrors[index]?.join(' | ') ?? ''
      const status = messages ? 'invalid' : 'valid'
      const values = CSV_HEADERS.map((key) => `${row[key] ?? ''}`)
      return [String(index + 1), status, messages, ...values]
        .map((value) => `"${String(value).replace(/\"/g, '""')}"`)
        .join(',')
    })

    const csvContent = [headers.join(','), ...lines].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'students-bulk-report.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const dropContent = (
    <div
      className="upload-dropzone"
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="upload-dropzone__icon" aria-hidden="true">
        <i className="bi bi-cloud-arrow-up" />
      </div>
      <div className="upload-dropzone__text">{t('studentsBulkUploadDrag')}</div>
      <div className="upload-dropzone__helper">{t('studentsBulkUploadSelect')}</div>
      <input
        type="file"
        accept=".csv"
        className="upload-dropzone__input"
        onChange={handleFileInput}
      />
    </div>
  )

  const hasData = rows.length > 0

  return (
    <Layout pageTitle={t('studentsBulkUploadTitle')} onNavigate={onNavigate} breadcrumbItems={breadcrumbItems}>
      <div className='d-flex flex-column gap-3'>
        <div className="card">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
              <h1 className="h4 mb-0">{t('studentsBulkUploadTitle')}</h1>
              <p className="text-muted mb-0">{t('studentsBulkUploadSubtitle')}</p>
            </div>
          </div>
        </div>
        <div className="d-flex flex-column gap-3">
          <div className="card shadow-sm">
            <div className="card-body d-flex flex-column gap-3">

              <div className="row g-3">
                <div className="col-lg-12">
                  <h2>{t('studentsBulkUploadStepsTitle')}</h2>
                  <div>
                    <span className='fw-bold'>{t('studentsBulkUploadStepSchoolTitle')}</span>
                    <p>{t('studentsBulkUploadStepSchoolDescription')}</p>
                  </div>
                  <label className="form-label fw-semibold" htmlFor="schoolSelector">
                    {t('selectSchoolLabel')}
                  </label>
                  <select
                    id="schoolSelector"
                    className="form-select"
                    value={selectedSchoolId}
                    onChange={(event) => setSelectedSchoolId(event.target.value)}
                  >
                    <option value="">{isLoading ? t('tableLoading') : t('selectPlaceholder')}</option>
                    {schools.map((school) => (
                      <option key={school.school_id} value={school.school_id}>
                        {school.description}
                      </option>
                    ))}
                  </select>
                  <div className="mt-3">
                    <span className='fw-bold'>{t('studentsBulkUploadStepGroupTitle')}</span>
                    <p>{t('studentsBulkUploadStepGroupDescription')}</p>
                  </div>
                  <label className="form-label fw-semibold" htmlFor="groupSelector">
                    {t('selectGroupLabel')}
                  </label>
                  <select
                    id="groupSelector"
                    className="form-select"
                    value={selectedGroupId}
                    onChange={(event) => {
                      const value = event.target.value
                      setSelectedGroupId(value)
                      setRows((prev) => {
                        const updated = prev.map((row) => ({ ...row, group_id: value }))
                        triggerValidation(updated)
                        return updated
                      })
                      setHasValidated(false)
                    }}
                    disabled={!selectedSchoolId}
                  >
                    <option value="">{t('selectPlaceholder')}</option>
                    {groups.map((group) => (
                      <option key={group.group_id ?? String(group.grade_group)} value={group.group_id ?? ''}>
                        {group.grade_group}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-lg-12">
                  <div>
                    <span className='fw-bold'>{t('studentsBulkUploadStepTemplateTitle')}</span>
                    <p>{t('studentsBulkUploadStepTemplateDescription')}</p>
                    <div className="d-flex gap-2">
                      <a
                        className="btn btn-outline-secondary"
                        href={`${API_BASE_URL}/bulkfile/students_bulk_upload.csv`}
                        download
                      >
                        <i className="bi bi-filetype-csv" /> {t('studentsBulkUploadDownload')}
                      </a>
                      <button className="btn btn-outline-primary" type="button" onClick={downloadReport} disabled={!hasData}>
                        <i className="bi bi-download" />
                        <span className="ms-1">{t('studentsBulkUploadReport')}</span>
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className='fw-bold'>{t('studentsBulkUploadStepUploadTitle')}</span>
                    <p>{t('studentsBulkUploadStepUploadDescription')}</p>
                  </div>
                  {dropContent}
                  <p className="bulk-upload__helper">{t('studentsBulkUploadHelper')}</p>
                  {fileError ? <p className="text-danger mt-2 mb-0">{fileError}</p> : null}
                </div>
              </div>

              {isLoading && <LoadingSkeleton cardCount={2} />}

              {hasData && (
                <div className="border-0">
                  <div className="d-flex flex-wrap justify-content-between gap-2 align-items-center mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-success-subtle text-success">
                        {formatMessage(t('studentsBulkUploadValid'), { count: validRows.length })}
                      </span>
                      <span className="badge bg-danger-subtle text-danger">
                        {formatMessage(t('studentsBulkUploadInvalid'), { count: invalidRowsLog.length })}
                      </span>
                      {isValidating && <span className="text-muted small">{t('studentsBulkUploadValidating')}</span>}
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-success"
                        onClick={handleCreate}
                        disabled={isCreating || isValidating || !hasValidated}
                      >
                        {isCreating ? t('studentsBulkUploadCreating') : t('studentsBulkUploadCreate')}
                      </button>
                    </div>
                  </div>

                  <div className="table-responsive table-wrapper">
                    <table className="table align-middle upload__table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>{t('firstName')}</th>
                          <th>{t('lastNameFather')}</th>
                          <th>{t('lastNameMother')}</th>
                          <th>{t('birthDate')}</th>
                          <th>{t('phoneNumber')}</th>
                          <th>{t('taxId')}</th>
                          <th>{t('curp')}</th>
                          <th>{t('street')}</th>
                          <th>{t('extNumber')}</th>
                          <th>{t('intNumber')}</th>
                          <th>{t('suburb')}</th>
                          <th>{t('locality')}</th>
                          <th>{t('municipality')}</th>
                          <th>{t('state')}</th>
                          <th>{t('personalEmail')}</th>
                          <th>{t('institutionalEmail')}</th>
                          <th>{t('username')}</th>
                          <th>{t('password')}</th>
                          <th>{t('register')}</th>
                          <th>{t('paymentReference')}</th>
                          <th>{t('group')}</th>
                          <th>{t('balance')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, rowIndex) => (
                          <tr key={rowIndex} ref={(node) => { rowRefs.current[rowIndex] = node }}>
                            <td className="fw-semibold">{row.rowNumber}</td>
                            <td>
                              <input
                                className="form-control form-control-sm"
                                value={row.first_name ?? ''}
                                onChange={(event) => handleCellChange(rowIndex, 'first_name', event.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                className="form-control form-control-sm"
                                value={row.last_name_father ?? ''}
                                onChange={(event) => handleCellChange(rowIndex, 'last_name_father', event.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                className="form-control form-control-sm"
                                value={row.last_name_mother ?? ''}
                                onChange={(event) => handleCellChange(rowIndex, 'last_name_mother', event.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="date"
                                className="form-control form-control-sm"
                                value={row.birth_date ?? ''}
                                onChange={(event) => handleCellChange(rowIndex, 'birth_date', event.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                className="form-control form-control-sm"
                                value={row.phone_number ?? ''}
                                onChange={(event) => handleCellChange(rowIndex, 'phone_number', event.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                className="form-control form-control-sm"
                                value={row.tax_id ?? ''}
                                onChange={(event) => handleCellChange(rowIndex, 'tax_id', event.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                className="form-control form-control-sm"
                                value={row.curp ?? ''}
                                onChange={(event) => handleCellChange(rowIndex, 'curp', event.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                className="form-control form-control-sm"
                                value={row.street ?? ''}
                                onChange={(event) => handleCellChange(rowIndex, 'street', event.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                className="form-control form-control-sm"
                                value={row.ext_number ?? ''}
                                onChange={(event) => handleCellChange(rowIndex, 'ext_number', event.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                className="form-control form-control-sm"
                                value={row.int_number ?? ''}
                                onChange={(event) => handleCellChange(rowIndex, 'int_number', event.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                className="form-control form-control-sm"
                                value={row.suburb ?? ''}
                                onChange={(event) => handleCellChange(rowIndex, 'suburb', event.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                className="form-control form-control-sm"
                                value={row.locality ?? ''}
                                onChange={(event) => handleCellChange(rowIndex, 'locality', event.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                className="form-control form-control-sm"
                                value={row.municipality ?? ''}
                                onChange={(event) => handleCellChange(rowIndex, 'municipality', event.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                className="form-control form-control-sm"
                                value={row.state ?? ''}
                                onChange={(event) => handleCellChange(rowIndex, 'state', event.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                className="form-control form-control-sm"
                                value={row.personal_email ?? ''}
                                onChange={(event) => handleCellChange(rowIndex, 'personal_email', event.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                className="form-control form-control-sm"
                                value={row.email ?? ''}
                                onChange={(event) => handleCellChange(rowIndex, 'email', event.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                className="form-control form-control-sm"
                                value={row.username ?? ''}
                                onChange={(event) => handleCellChange(rowIndex, 'username', event.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                className="form-control form-control-sm"
                                value={row.password ?? ''}
                                onChange={(event) => handleCellChange(rowIndex, 'password', event.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                className="form-control form-control-sm"
                                value={row.register_id ?? ''}
                                onChange={(event) => handleCellChange(rowIndex, 'register_id', event.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                className="form-control form-control-sm"
                                value={row.payment_reference ?? ''}
                                onChange={(event) => handleCellChange(rowIndex, 'payment_reference', event.target.value)}
                              />
                            </td>
                            <td>
                              <select
                                className="form-select form-select-sm"
                                value={row.group_id ?? ''}
                                onChange={(event) => handleCellChange(rowIndex, 'group_id', event.target.value)}
                                disabled={!selectedSchoolId}
                              >
                                <option value="">{t('selectPlaceholder')}</option>
                                {groups.map((group) => (
                                  <option key={group.group_id ?? String(group.grade_group)} value={group.group_id ?? ''}>
                                    {group.grade_group}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={row.balance ?? ''}
                                onChange={(event) => handleCellChange(rowIndex, 'balance', event.target.value)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {invalidRowsLog.length > 0 && (
                    <div className="mt-3">
                      <button
                        type="button"
                        className="btn btn-link p-0"
                        onClick={() => setLogExpanded((prev) => !prev)}
                      >
                        {logExpanded ? t('studentsBulkUploadHideLog') : t('studentsBulkUploadShowLog')}
                      </button>
                      {logExpanded && (
                        <ul className="upload-log">
                          {invalidRowsLog.map((item, index) => (
                            <li key={`${item.row}-${index}`}>
                              <button type="button" onClick={() => scrollToRow(item.row - 1)}>
                                {formatMessage(t('studentsBulkUploadRow'), { row: item.row })}: {item.message}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {showToast && (
        <div className="toast align-items-center text-bg-primary border-0 show upload-toast" role="alert">
          <div className="d-flex">
            <div className="toast-body">{toastMessage}</div>
            <button
              type="button"
              className="btn-close btn-close-white me-2 m-auto"
              aria-label="Close"
              onClick={() => setShowToast(false)}
            />
          </div>
        </div>
      )}

      {confirmOpen && (
        <div className="sweet-alert-overlay">
          <div className="sweet-alert">
            <div className="sweet-alert__icon sweet-alert__icon--info">i</div>
            <div>
              <h3 className="sweet-alert__title">{t('studentsBulkUploadMixedTitle')}</h3>
              <p className="sweet-alert__text">{t('studentsBulkUploadMixedMessage')}</p>
            </div>
            <div className="sweet-alert__actions">
              <button type="button" className="btn btn-secondary" onClick={() => setConfirmOpen(false)}>
                {t('cancel')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void sendCreateRequest(pendingCreateRows)}
              >
                {t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
