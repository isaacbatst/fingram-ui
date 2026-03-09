import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          "--success-bg": "var(--color-success-bg)",
          "--success-border": "var(--color-success-border)",
          "--success-text": "var(--color-success)",
          "--error-bg": "var(--color-danger-bg)",
          "--error-border": "var(--color-danger-border)",
          "--error-text": "var(--color-danger)",
          "--warning-bg": "var(--color-warning-bg)",
          "--warning-border": "var(--color-warning-border)",
          "--warning-text": "var(--color-warning)",
          "--info-bg": "var(--color-info-bg)",
          "--info-border": "var(--color-info-border)",
          "--info-text": "var(--color-info)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
