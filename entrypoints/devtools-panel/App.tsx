import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/integrations/theme/ThemeProvider'
import { Toolbar } from './Toolbar'
import { Editor } from './Editor'
import { OpenSettings } from './commands/OpenSettings'
import { OpenAbout } from './commands/OpenAbout'
import { ShadowProvider } from '@/integrations/shadow/ShadowProvider'

export function App() {
  return (
    <ShadowProvider container={document.body}>
      <ThemeProvider defaultTheme="system" storageKey="devtools-theme">
        <div className="w-full h-screen flex flex-col">
          <Toolbar />
          <Editor />
          <Toaster richColors />
          <OpenSettings />
          <OpenAbout />
        </div>
      </ThemeProvider>
    </ShadowProvider>
  )
}
