import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'

const LANGUAGES = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
]

export default function LanguageSelector() {
  const { i18n, t } = useTranslation()

  return (
    <div className="flex items-center gap-1">
      <Globe size={13} className="text-[#555566]" />
      {LANGUAGES.map(lang => (
        <button
          key={lang.code}
          onClick={() => i18n.changeLanguage(lang.code)}
          className={`text-xs px-2 py-1 rounded-lg font-mono transition-all ${
            i18n.language === lang.code
              ? 'bg-[#7c6aff]/20 text-[#7c6aff]'
              : 'text-[#555566] hover:text-[#888899]'
          }`}
          title={lang.label}
        >
          {lang.flag} {lang.code.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
