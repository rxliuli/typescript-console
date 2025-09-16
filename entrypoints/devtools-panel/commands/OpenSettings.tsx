import { useState } from 'react'
import { em, settings } from '../store'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useEventBus } from '../utils/useEventBus'
import { useStore } from '../utils/localStoreReact'

export function OpenSettings() {
  const [open, setOpen] = useState(false)
  const [currentSettings, setSettings] = useStore(settings)

  useEventBus('openSettings', () => {
    setOpen(true)
  })

  const fontSizeOptions = [12, 14, 16, 18, 20]

  const handleFontSizeChange = (value: string) => {
    const fontSize = parseInt(value)
    setSettings({
      ...currentSettings,
      fontSize,
    })
    em.emit('changeFontSize', fontSize)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fontSize" className="text-right">
              Font Size
            </Label>
            <Select
              value={currentSettings.fontSize.toString()}
              onValueChange={handleFontSizeChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Font Size" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {fontSizeOptions.map((fontSize) => (
                    <SelectItem 
                      key={fontSize} 
                      value={fontSize.toString()}
                    >
                      {fontSize}px
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}