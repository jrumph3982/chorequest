'use client'

import { createContext, useContext, useEffect } from 'react'
import { THEMES, getTheme, type ThemeConfig } from '@/lib/constants/themes'

const ThemeContext = createContext<ThemeConfig>(THEMES.zombie)

export function ThemeProvider({
  themeId,
  children,
}: {
  themeId: string
  children: React.ReactNode
}) {
  const theme = getTheme(themeId)

  useEffect(() => {
    const root = document.documentElement
    Object.entries(theme.colors).forEach(([key, value]) => {
      // Convert camelCase to kebab-case for CSS var name
      const cssVar = '--theme-' + key.replace(/([A-Z])/g, (m) => '-' + m.toLowerCase())
      root.style.setProperty(cssVar, value)
    })
    root.dataset.theme = theme.id
  }, [theme])

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeConfig {
  return useContext(ThemeContext)
}
