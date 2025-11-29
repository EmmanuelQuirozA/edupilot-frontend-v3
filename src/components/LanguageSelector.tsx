import type { Locale } from '../context/LanguageContext'
import './LanguageSelector.css'
 
const languages: Array<{ code: Locale; label: string }> = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
]
 
interface LanguageSelectorProps {
  value: Locale
  onChange?: (locale: Locale) => void
}

const LanguageSelector = ({ value, onChange }: LanguageSelectorProps) => (
  <div className="language-selector align-content-center d-inline" role="group" aria-label="Language selector">
    {languages.map(({ code, label }) => (
      <button
        key={code}
        type="button"
        className={`language-selector__button${value === code ? ' is-active' : ''}`}
        onClick={() => onChange?.(code)}
      >
        {label}
      </button>
    ))}
  </div>
)
 
export default LanguageSelector
