import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

interface MoneyInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}

const MAX_CENTS = 999999999; // R$ 9.999.999,99

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function MoneyInput({
  value,
  onChange,
  className,
  id,
  required,
  disabled,
  autoFocus,
}: MoneyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cents = Math.round(value * 100);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        const digit = parseInt(e.key, 10);
        const newCents = cents * 10 + digit;
        if (newCents <= MAX_CENTS) {
          onChange(newCents / 100);
        }
      } else if (e.key === "Backspace") {
        e.preventDefault();
        const newCents = Math.floor(cents / 10);
        onChange(newCents / 100);
      }
    },
    [cents, onChange],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const text = e.clipboardData.getData("text");
      const digits = text.replace(/\D/g, "");
      if (digits) {
        const pastedCents = parseInt(digits, 10);
        if (pastedCents <= MAX_CENTS) {
          onChange(pastedCents / 100);
        }
      }
    },
    [onChange],
  );

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      id={id}
      value={formatCents(cents)}
      onChange={() => {}}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      required={required}
      disabled={disabled}
      autoFocus={autoFocus}
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className,
      )}
    />
  );
}
