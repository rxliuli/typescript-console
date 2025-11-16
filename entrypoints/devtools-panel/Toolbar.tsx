import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { em, useExecutionStore } from './store'
import { PlayIcon, Loader2Icon, MenuIcon } from 'lucide-react'
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
      return <Loader2Icon className="w-4 h-4 animate-spin" />
    }
    return <PlayIcon className="w-4 h-4" />
  }

  const getTooltipText = () => {
    return isExecuting ? 'Stop execution' : 'Run ⌘S'
  }

  return (
    <div className="toolbar flex items-center gap-1 px-2 py-1 border-b">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MenuIcon className="w-4 h-4 mr-1" />
            Menu
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => em.emit('openFile')}>
            Open File
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => em.emit('saveFile')}>
            Save File
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => em.emit('openSettings')}>
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => em.emit('openAbout')}>
            About
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant={isExecuting ? 'destructive' : 'ghost'}
              onClick={() => (isExecuting ? stop() : em.emit('runScript'))}
            >
              {getIcon()}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getTooltipText()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

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
    </div>
  )
}
