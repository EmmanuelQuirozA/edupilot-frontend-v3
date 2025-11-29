import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

type Locale = 'es' | 'en'

type TranslationMap = Record<Locale, Record<string, string>>

const translations: TranslationMap = {
  es: {
    homeTitle: 'Bienvenido a EduPilot',
    homeSubtitle:
      'Una plataforma moderna preparada para múltiples portales y accesos basados en roles.',
    homeCta: 'Iniciar sesión',
    languageLabel: 'Idioma',
    loginTitle: 'Iniciar sesión',
    loginSubtitle: 'Accede con tu usuario o correo electrónico para continuar.',
    usernameLabel: 'Usuario o correo',
    passwordLabel: 'Contraseña',
    rememberMe: 'Recordarme',
    signIn: 'Entrar',
    forgotPassword: '¿Olvidaste tu contraseña?',
    portalTitle: 'Portal principal',
    portalSubtitle:
      'Estructura lista para mostrar módulos dinámicos por rol y configuraciones de menú.',
    logout: 'Cerrar sesión',
    welcome: 'Bienvenido',
    heroCta: 'Explorar portales',
    footerText: 'EduPilot © 2025. Todos los derechos reservados.',
    wrongCredentials: 'Credenciales incorrectas. Verifica tus datos.',
    serviceUnavailable: 'El servicio no está disponible en este momento.',
    defaultError: 'Ocurrió un error inesperado.',
  },
  en: {
    homeTitle: 'Welcome to EduPilot',
    homeSubtitle:
      'A modern platform prepared for multiple portals and role-based access.',
    homeCta: 'Log in',
    languageLabel: 'Language',
    loginTitle: 'Sign in',
    loginSubtitle: 'Use your username or email address to continue.',
    usernameLabel: 'Username or email',
    passwordLabel: 'Password',
    rememberMe: 'Remember me',
    signIn: 'Sign in',
    forgotPassword: 'Forgot password?',
    portalTitle: 'Main portal',
    portalSubtitle:
      'Layout ready to display dynamic role-based modules and menu configuration.',
    logout: 'Log out',
    welcome: 'Welcome',
    heroCta: 'Explore portals',
    footerText: 'EduPilot © 2025. All rights reserved.',
    wrongCredentials: 'Wrong credentials. Please try again.',
    serviceUnavailable: 'The service is unavailable right now.',
    defaultError: 'An unexpected error occurred.',
  },
}

interface LanguageContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: keyof typeof translations['en']) => string
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('es')

  const value = useMemo<LanguageContextValue>(() => {
    const t = (key: keyof typeof translations['en']) => translations[locale][key] || key
    return { locale, setLocale, t }
  }, [locale])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return ctx
}
