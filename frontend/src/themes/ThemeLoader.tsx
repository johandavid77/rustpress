import { useState, useEffect, lazy, Suspense } from 'react'
import { apiClient } from '../api/client'

// Lazy load de cada theme
const themes: Record<string, { BlogIndex: React.LazyExoticComponent<any>, BlogPost: React.LazyExoticComponent<any> }> = {
  dark: {
    BlogIndex: lazy(() => import('./dark/BlogIndex')),
    BlogPost: lazy(() => import('./dark/BlogPost')),
  },
  minimal: {
    BlogIndex: lazy(() => import('./minimal/BlogIndex')),
    BlogPost: lazy(() => import('./minimal/BlogPost')),
  },
  bold: {
    BlogIndex: lazy(() => import('./bold/BlogIndex')),
    BlogPost: lazy(() => import('./bold/BlogPost')),
  },
  magazine: {
    BlogIndex: lazy(() => import('./magazine/BlogIndex')),
    BlogPost: lazy(() => import('./magazine/BlogPost')),
  },
}

// Fallback mientras carga el theme
function ThemeLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#7c6aff] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// Hook para obtener el theme activo desde el backend
export function useActiveTheme() {
  const [theme, setTheme] = useState<string>('dark')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    apiClient.get('/settings/active-theme')
      .then((res: any) => {
        const active = res?.value ?? res?.theme ?? 'dark'
        setTheme(themes[active] ? active : 'dark')
      })
      .catch(() => setTheme('dark'))
      .finally(() => setLoaded(true))
  }, [])

  return { theme, loaded }
}

// Componente para BlogIndex con theme dinámico
export function ThemedBlogIndex() {
  const { theme, loaded } = useActiveTheme()

  if (!loaded) return <ThemeLoading />

  const Component = themes[theme]?.BlogIndex ?? themes.dark.BlogIndex

  return (
    <Suspense fallback={<ThemeLoading />}>
      <Component />
    </Suspense>
  )
}

// Componente para BlogPost con theme dinámico
export function ThemedBlogPost() {
  const { theme, loaded } = useActiveTheme()

  if (!loaded) return <ThemeLoading />

  const Component = themes[theme]?.BlogPost ?? themes.dark.BlogPost

  return (
    <Suspense fallback={<ThemeLoading />}>
      <Component />
    </Suspense>
  )
}