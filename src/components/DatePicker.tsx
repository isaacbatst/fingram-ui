import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface DatePickerHandle {
  open: () => void
}

interface DatePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  onClose?: () => void
  placeholder?: string
  className?: string
}

export const DatePicker = forwardRef<DatePickerHandle, DatePickerProps>(function DatePicker({
  date,
  onDateChange,
  onClose,
  placeholder = "Selecione uma data",
  className
}, ref) {
  const [open, setOpen] = useState(false)
  const wasOpen = useRef(false)

  useImperativeHandle(ref, () => ({
    open: () => setOpen(true),
  }))

  const handleSelect = (selectedDate: Date | undefined) => {
    onDateChange?.(selectedDate)
    if (selectedDate) {
      setOpen(false)
    }
  }

  useEffect(() => {
    if (wasOpen.current && !open) {
      onClose?.()
    }
    wasOpen.current = open
  }, [open, onClose])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!date}
          className={cn(
            "data-[empty=true]:text-muted-foreground w-full justify-start text-left font-normal",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP", { locale: ptBR }) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          autoFocus
          locale={ptBR}
        />
      </PopoverContent>
    </Popover>
  )
})
