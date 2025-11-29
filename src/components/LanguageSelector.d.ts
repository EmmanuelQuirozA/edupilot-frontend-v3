import type { Locale } from '../context/LanguageContext'
import type { FC } from 'react'

export interface LanguageSelectorProps {
  value: Locale
  onChange: (locale: Locale) => void
}

declare const LanguageSelector: FC<LanguageSelectorProps>
export default LanguageSelector
