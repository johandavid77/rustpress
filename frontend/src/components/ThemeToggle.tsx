import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button onClick={toggle}
      className="w-9 h-9 rounded-xl bg-[#111118] border border-[#2a2a3a] flex items-center justify-center hover:border-[#7c6aff]/50 transition-all"
      title={theme === 'dark' ? 'Cambiar a claro' : 'Cambiar a oscuro'}>
      {theme === 'dark'
        ? <Sun size={15} className="text-[#888899]" />
        : <Moon size={15} className="text-[#888899]" />
      }
    </button>
  )
}
