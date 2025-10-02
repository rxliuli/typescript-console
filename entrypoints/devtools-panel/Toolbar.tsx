import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from '@/components/ui/menubar'
import { em, useExecutionStore } from './store'
import { PlayIcon, Loader2Icon } from 'lucide-react'
import { FaDiscord } from 'react-icons/fa'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'

export function Toolbar() {
  const isExecuting = useExecutionStore((s) => s.isExecuting)
  const stop = useExecutionStore((s) => s.stop)

  const getIcon = () => {
    if (isExecuting) {
      return (
        <Button size="icon" variant="destructive">
          <Loader2Icon className="w-4 h-4 animate-spin text-muted-foreground" />
        </Button>
      )
    }
    return <PlayIcon className="w-4 h-4" />
  }

  const getTooltipText = () => {
    return isExecuting ? 'Stop execution' : 'Run ⌘S'
  }

  return (
    <Menubar className="toolbar">
      <MenubarMenu>
        <MenubarTrigger>TypeScript Console</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => em.emit('openAbout')}>About</MenubarItem>
          <MenubarItem onClick={() => em.emit('openSettings')}>
            Settings
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => em.emit('openFile')}>Open File</MenubarItem>
          <MenubarItem onClick={() => em.emit('saveFile')}>Save File</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger asChild={true}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => (isExecuting ? stop() : em.emit('runScript'))}
                  disabled={false}
                >
                  {getIcon()}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{getTooltipText()}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </MenubarTrigger>
      </MenubarMenu>
      <div className="ml-auto">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={() =>
                  window.open('https://discord.com/invite/fErBc3wYrC', '_blank')
                }
              >
                <FaDiscord className="w-4 h-4 text-blue-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Join Discord Community</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </Menubar>
  )
}
