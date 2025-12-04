import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export type Locale = 'es' | 'en'

type TranslationMap = Record<Locale, Record<string, string>>

const translations: TranslationMap = {
  es: {
    homeTitle: 'Bienvenido a EduPilot',
    homeSubtitle:
      'Una plataforma moderna preparada para múltiples dashboards y accesos basados en roles.',
    homeCta: 'Iniciar sesión',
    languageLabel: 'Idioma',
    loginTitle: 'Iniciar sesión',
    loginSubtitle: 'Accede con tu usuario o correo electrónico para continuar.',
    usernameLabel: 'Usuario o correo',
    passwordLabel: 'Contraseña',
    rememberMe: 'Recordarme',
    signIn: 'Entrar',
    forgotPassword: '¿Olvidaste tu contraseña?',
    portalTitle: 'Dashboard',
    portalSubtitle:
      'Estructura lista para mostrar módulos dinámicos por rol y configuraciones de menú.',
    logout: 'Cerrar sesión',
    welcome: 'Bienvenido',
    heroCta: 'Explorar dashboards',
    footerText: 'EduPilot © 2025. Todos los derechos reservados.',
    wrongCredentials: 'Credenciales incorrectas. Verifica tus datos.',
    serviceUnavailable: 'El servicio no está disponible en este momento.',
    defaultError: 'Ocurrió un error inesperado.',
    loginPageTitle: 'Una nueva forma de vivir la experiencia escolar.',
    schoolsTitle: 'Escuelas',
    schoolsSubtitle: 'Consulta el catálogo de escuelas y navega a los detalles.',
    schoolsBreadcrumbLabel: 'Escuelas',
    schoolDetailsBreadcrumbLabel: 'Detalle de escuela',
    schoolsIdColumn: 'ID',
    schoolsNameColumn: 'Nombre comercial',
    schoolsPlanColumn: 'Plan',
    schoolsStatusColumn: 'Estatus',
    schoolsTypeColumn: 'Tipo',
    schoolsParentType: 'Escuela matriz',
    schoolsChildType: 'Sede',
    tableResults: 'Resultados',
    tablePageLabel: 'Página',
    tablePageOf: 'de',
    tablePageSize: 'Tamaño',
    tableRowsPerPage: 'Filas por página',
    tableLoading: 'Cargando información...',
    tableNoData: 'No hay registros para mostrar',
    tablePrev: 'Anterior',
    tableNext: 'Siguiente',
    tableActions: 'Acciones',
    viewDetails: 'Ver detalles',
    renew: 'Renueva',
    students: 'Alumnos',
    classes: 'Grupos',
    schoolOverviewTab: 'Visión General',
    schoolDetailsTab: 'Detalles de la escuela',
    schoolBillingTab: 'Plan y facturación',
    schoolSettingsTab: 'Configuración',
    schoolStructureTab: 'Estructura (Sedes)',
    schoolPlanBadge: 'Plan',
    schoolStatusBadge: 'Estatus',
    schoolAccessLabel: 'Acceso a plataforma',
    schoolEditButton: 'Editar detalles',
    schoolTeachersCard: 'Profesores',
    schoolAdminsCard: 'Administradores',
    schoolCampusesCard: 'Escuelas hijas',
    schoolBaseLimit: 'Límite base',
    schoolOverviewTitle: 'Información de contacto',
    schoolPlanTitle: 'Plan contratado',
    schoolNextBilling: 'Próxima facturación',
    schoolPreviousPeriods: 'Periodos previos',
    schoolPaymentsEmpty: 'No hay registros de pago.',
    schoolModulesTitle: 'Módulos habilitados',
    schoolRolesTitle: 'Roles creados por la escuela',
    schoolStructureTitle: 'Escuelas hijas (Campus)',
    schoolViewDetail: 'Ver detalle',
    schoolStatusActive: 'Activo',
    schoolStatusInactive: 'Inactivo',
    schoolLocationLabel: 'Ubicación',
    schoolIdLabel: 'ID',
    schoolPlanStatusLabel: 'Estatus del plan',
    schoolDetailsTitle: 'Información general de la escuela',
    schoolDetailsLocationTitle: 'Ubicación y contacto',
    schoolCommercialNameLabel: 'Nombre comercial',
    schoolBusinessNameLabel: 'Razón social',
    schoolTaxIdLabel: 'RFC',
    schoolDescriptionLabel: 'Descripción',
    schoolCreationDateLabel: 'Fecha de creación',
    schoolMaxDebtLabel: 'Deuda máxima permitida',
    schoolDefaultTuitionLabel: 'Colegiatura base',
    schoolContactEmail: 'Correo',
    schoolContactPhone: 'Teléfono',
    schoolAddressLabel: 'Dirección',
    schoolNoData: 'Sin información',
    schoolStudentsCard: 'Alumnos',
    ocupied: 'Ocupado',
    email: 'Correo Electrónico',
    main_contact: 'Contacto Principal',
    startDate: 'Fecha inicial',
    results: 'Resultados',
    searchStudentByName: 'Buscar estudiante por nombre',
    searchByGroup: 'Buscar por grupo',
    studentsGroups: 'Alumnos y Grupos',
    tuitions: 'Colegiaturas',
    paymentRequests: 'Solicitudes de Pago',
    payments: 'Pagos',
    student: 'Estudiante',
    paymentType: 'Concepto',
    amount: 'Monto',

  },
  en: {
    homeTitle: 'Welcome to EduPilot',
    homeSubtitle:
      'A modern platform prepared for multiple dashboards and role-based access.',
    homeCta: 'Log in',
    languageLabel: 'Language',
    loginTitle: 'Sign in',
    loginSubtitle: 'Use your username or email address to continue.',
    usernameLabel: 'Username or email',
    passwordLabel: 'Password',
    rememberMe: 'Remember me',
    signIn: 'Sign in',
    forgotPassword: 'Forgot password?',
    portalTitle: 'Main dashboard',
    portalSubtitle:
      'Layout ready to display dynamic role-based modules and menu configuration.',
    logout: 'Log out',
    welcome: 'Welcome',
    heroCta: 'Explore dashboards',
    footerText: 'EduPilot © 2025. All rights reserved.',
    wrongCredentials: 'Wrong credentials. Please try again.',
    serviceUnavailable: 'The service is unavailable right now.',
    defaultError: 'An unexpected error occurred.',
    loginPageTitle: 'A new way to live the school experience.',
    schoolsTitle: 'Schools',
    schoolsSubtitle: 'Browse the school catalog and open their details.',
    schoolsBreadcrumbLabel: 'Schools',
    schoolDetailsBreadcrumbLabel: 'School detail',
    schoolsIdColumn: 'ID',
    schoolsNameColumn: 'Commercial name',
    schoolsPlanColumn: 'Plan',
    schoolsStatusColumn: 'Status',
    schoolsTypeColumn: 'Type',
    schoolsParentType: 'Main school',
    schoolsChildType: 'Campus',
    tableResults: 'Results',
    tablePageLabel: 'Page',
    tablePageOf: 'of',
    tablePageSize: 'Size',
    tableRowsPerPage: 'Rows per page',
    tableLoading: 'Loading data...',
    tableNoData: 'No records to display',
    tablePrev: 'Previous',
    tableNext: 'Next',
    tableActions: 'Actions',
    viewDetails: 'View details',
    renew: 'Renew',
    students: 'Students',
    classes: 'Classes',
    schoolOverviewTab: 'Overview',
    schoolDetailsTab: 'School details',
    schoolBillingTab: 'Plan & billing',
    schoolSettingsTab: 'Configuration',
    schoolStructureTab: 'Structure (Campuses)',
    schoolPlanBadge: 'Plan',
    schoolStatusBadge: 'Status',
    schoolAccessLabel: 'Platform access',
    schoolEditButton: 'Edit details',
    schoolTeachersCard: 'Teachers',
    schoolAdminsCard: 'Admins',
    schoolCampusesCard: 'Child schools',
    schoolBaseLimit: 'Base limit',
    schoolOverviewTitle: 'Contact information',
    schoolPlanTitle: 'Current plan',
    schoolNextBilling: 'Next billing',
    schoolPreviousPeriods: 'Previous periods',
    schoolPaymentsEmpty: 'There are no payment records.',
    schoolModulesTitle: 'Enabled modules',
    schoolRolesTitle: 'School roles created',
    schoolStructureTitle: 'Child schools (Campuses)',
    schoolViewDetail: 'View detail',
    schoolStatusActive: 'Active',
    schoolStatusInactive: 'Inactive',
    schoolLocationLabel: 'Location',
    schoolIdLabel: 'ID',
    schoolPlanStatusLabel: 'Plan status',
    schoolDetailsTitle: 'School general information',
    schoolDetailsLocationTitle: 'Location & contact',
    schoolCommercialNameLabel: 'Commercial name',
    schoolBusinessNameLabel: 'Business name',
    schoolTaxIdLabel: 'Tax ID',
    schoolDescriptionLabel: 'Description',
    schoolCreationDateLabel: 'Creation date',
    schoolMaxDebtLabel: 'Maximum allowed debt',
    schoolDefaultTuitionLabel: 'Base tuition',
    schoolContactEmail: 'Email',
    schoolContactPhone: 'Phone',
    schoolAddressLabel: 'Address',
    schoolNoData: 'No information',
    schoolStudentsCard: 'Students',
    ocupied: 'Ocupied',
    email: 'Email',
    main_contact: 'Main contact',
    startDate: 'Start date',
    results: 'Resultados',
    searchStudentByName: 'Search student by name',
    searchByGroup: 'Search by group',
    studentsGroups: 'Students and Classes',
    tuitions: 'Tuitions',
    paymentRequests: 'Payment Requests',
    payments: 'Payments',
    student: 'Student',
    paymentType: 'Concept',
    amount: 'Amount',

  },
}

interface LanguageContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: keyof typeof translations['en']) => string
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

function getInitialLocale(): Locale {
  const match = window.location.pathname.match(/^\/(es|en)(?:\/|$)/)
  if (match) {
    return match[1] as Locale
  }
  return 'es'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(getInitialLocale())

  const value = useMemo<LanguageContextValue>(() => {
    const t = (key: keyof typeof translations['en']) => translations[locale][key] || key
    return { locale, setLocale, t }
  }, [locale])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return ctx
}
