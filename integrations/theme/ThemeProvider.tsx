import { ThemeProvider as NextThemeProvider, useTheme as useNextTheme } from 'next-themes'
import { useEffect } from 'react'
import { getShadowRoot } from '../shadow/ShadowProvider'

type Theme = 'dark' | 'light' | 'system'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

function ThemeClassSetter() {
  const { resolvedTheme } = useNextTheme()

  useEffect(() => {
    if (!resolvedTheme) {
      return
    }
    const root = getShadowRoot()
    root.classList.remove('light', 'dark')
    root.classList.add(resolvedTheme)
  }, [resolvedTheme])
  return <></>
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme',
  ...props
}: ThemeProviderProps) {
  return (
    <NextThemeProvider defaultTheme={defaultTheme} storageKey={storageKey} attribute="class" enableSystem {...props}>
      <ThemeClassSetter />
      {children}
    </NextThemeProvider>
  )
}

export const useTheme = useNextTheme
