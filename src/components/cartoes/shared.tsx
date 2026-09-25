import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { invoiceStatusLabel, invoiceStatusTone, type Tone } from "@/lib/invoice";
import type { InvoiceView } from "@/services/api.interface";

const TONE_CLASSES: Record<Tone, string> = {
  accent:
    "text-[var(--color-accent)] bg-[var(--color-accent-bg)] border-[var(--color-accent-border)]",
  success:
    "text-[var(--color-success)] bg-[var(--color-success-bg)] border-[var(--color-success-border)]",
  warning:
    "text-[var(--color-warning)] bg-[var(--color-warning-bg)] border-[var(--color-warning-border)]",
  danger:
    "text-[var(--color-danger)] bg-[var(--color-danger-bg)] border-[var(--color-danger-border)]",
  muted: "text-muted-foreground bg-muted/40 border-[var(--color-border)]",
};

export function InvoiceStatusBadge({
  invoice,
}: {
  invoice: Pick<InvoiceView, "status" | "carriedOut">;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        TONE_CLASSES[invoiceStatusTone(invoice)],
      )}
    >
      {invoiceStatusLabel(invoice.status)}
    </span>
  );
}

/** Cabeçalho das telas de cartão: voltar, título e ações à direita. */
export function ScreenHeader({
  backLabel,
  onBack,
  title,
  subtitle,
  actions,
}: {
  backLabel: string;
  onBack: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 pb-3">
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 -ml-2"
        onClick={onBack}
        aria-label={`Voltar para ${backLabel}`}
      >
        <ChevronLeft className="size-5" />
      </Button>
      <div className="flex-1 min-w-0 pt-1">
        <div className="text-xs text-muted-foreground">{backLabel}</div>
        <h2 className="font-display text-xl text-foreground tracking-tight truncate">
          {title}
        </h2>
        {subtitle && (
          <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {subtitle}
          </div>
        )}
      </div>
      {actions && <div className="flex gap-1 shrink-0">{actions}</div>}
    </div>
  );
}

export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 mb-2 min-h-11">
      <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
        {children}
      </h3>
      {action}
    </div>
  );
}

/** Linha rótulo → valor monetário (ou texto) de um resumo. */
export function FigureRow({
  label,
  value,
  tone,
  hint,
  strong,
}: {
  label: ReactNode;
  value: ReactNode;
  tone?: Tone;
  hint?: ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <dt className="text-muted-foreground">{label}</dt>
        <dd
          className={cn(
            "font-mono whitespace-nowrap",
            strong ? "text-foreground font-semibold" : "text-foreground",
            tone === "warning" && "text-[var(--color-warning)]",
            tone === "danger" && "text-[var(--color-danger)]",
            tone === "success" && "text-[var(--color-success)]",
            tone === "muted" && "text-muted-foreground",
          )}
        >
          {value}
        </dd>
      </div>
      {hint && <p className="text-xs text-muted-foreground leading-relaxed">{hint}</p>}
    </div>
  );
}

/** Classe do CTA tinted accent (padrão do design system). */
export const ACCENT_CTA =
  "min-h-11 bg-[var(--color-accent-bg)] text-[var(--color-accent)] border border-[var(--color-accent-border)] hover:bg-[var(--color-accent-bg)]";
