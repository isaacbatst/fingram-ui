import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

// Adiciona props para customizar as cores
interface ProgressProps extends React.ComponentProps<typeof ProgressPrimitive.Root> {
  value?: number;
  filledColor?: string;
  bgColor?: string;
}

function Progress({
  className,
  value = 0,
  filledColor = "#6366f1", // cor padrão (indigo)
  bgColor = "#e0e7ff", // cor padrão (indigo-100)
  ...props
}: ProgressProps) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full",
        className
      )}
      style={{ background: bgColor }}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="h-full transition-all"
        style={{
          width: `${value}%`,
          background: filledColor,
        }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
