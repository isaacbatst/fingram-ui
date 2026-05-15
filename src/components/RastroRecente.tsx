import { useMemo } from "react";
import { ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { useTransactions } from "@/hooks/useTransactions";
import { useSearchParams } from "@/hooks/useSearchParams";
import type { TransactionDTO } from "@/utils/transaction.dto,";
import {
  MAX_ROWS,
  formatAmount,
  getRowOpacity,
  getRowVisual,
} from "./rastro-recente.utils";

type RowProps = {
  tx: TransactionDTO;
  idx: number;
  onClick: () => void;
};

function Row({ tx, idx, onClick }: RowProps) {
  const { color, sign, label, isTransfer } = getRowVisual(tx);
  const time = formatRelativeTime(tx.createdAt);

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ opacity: getRowOpacity(idx) }}
      className={cn(
        "flex w-full items-center gap-3 min-h-[44px] px-2 -mx-2 py-2 rounded-md text-left",
        "transition-colors active:bg-[var(--color-bg-surface-hover)] hover:bg-[var(--color-bg-surface-hover)]/40",
      )}
      aria-label={`${label}, ${time}, R$ ${formatAmount(tx.amount)}`}
    >
      <span className="shrink-0 flex items-center justify-center size-3" aria-hidden>
        {isTransfer ? (
          <ArrowRightLeft className="size-3 text-[var(--color-info)]" />
        ) : (
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: color }}
          />
        )}
      </span>
      <span className="flex-1 min-w-0 text-sm text-foreground truncate">
        {label}
      </span>
      <span className="shrink-0 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
        {time}
      </span>
      <span
        className="shrink-0 font-mono text-sm font-semibold whitespace-nowrap"
        style={{ color }}
      >
        {sign && `${sign} `}R$ {formatAmount(tx.amount)}
      </span>
    </button>
  );
}

function SkeletonRow({ idx }: { idx: number }) {
  return (
    <div
      className="flex w-full items-center gap-3 min-h-[44px] px-2 -mx-2 py-2"
      style={{ opacity: getRowOpacity(idx) }}
      aria-hidden
    >
      <span className="h-2 w-2 rounded-full bg-[var(--color-border-subtle)] shrink-0" />
      <span
        className="flex-1 h-3 rounded-sm bg-[var(--color-border-subtle)] animate-pulse"
        style={{ animationDuration: "2000ms" }}
      />
      <span className="w-16 h-3 rounded-sm bg-[var(--color-border-subtle)] shrink-0" />
    </div>
  );
}

export function RastroRecente() {
  const { data, error, isLoading } = useTransactions({
    page: 1,
    allPeriods: true,
  });
  const [, setSearchParams] = useSearchParams();

  const transactions = useMemo<TransactionDTO[]>(
    () => (data?.items ?? []).slice(0, MAX_ROWS),
    [data],
  );

  if (error) return null;

  const showSkeleton = isLoading && transactions.length === 0;
  const showEmpty = !isLoading && transactions.length === 0;

  return (
    <section className="pt-8 pb-4">
      <header className="flex items-center gap-3 mb-2">
        <span
          className="h-px flex-1 bg-[var(--color-border-subtle)]"
          aria-hidden
        />
        <span className="text-[10px] uppercase tracking-[0.3em] font-sans text-muted-foreground">
          Rastro
        </span>
        <span
          className="h-px flex-1 bg-[var(--color-border-subtle)]"
          aria-hidden
        />
      </header>

      {showSkeleton && (
        <div className="flex flex-col">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonRow key={i} idx={i} />
          ))}
        </div>
      )}

      {showEmpty && (
        <p className="font-display italic text-sm text-muted-foreground py-4 text-center">
          Sem registros ainda. O primeiro passo é o que conta.
        </p>
      )}

      {transactions.length > 0 && (
        <ul className="flex flex-col">
          {transactions.map((tx, idx) => (
            <li
              key={tx.id}
              className={idx === 0 ? "duna-stagger-1" : undefined}
            >
              <Row
                tx={tx}
                idx={idx}
                onClick={() => setSearchParams({ aba: "gastos" })}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
