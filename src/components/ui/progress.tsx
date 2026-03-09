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
  filledColor = "var(--color-accent)",
  bgColor = "var(--color-border)",
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
