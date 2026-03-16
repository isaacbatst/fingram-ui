import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

interface MoneyInputProps {
  value: number;
  onChange: (value: number) => void;
  onNext?: () => void;
  className?: string;
  style?: React.CSSProperties;
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

/** Map a digit-space index to a position in the formatted string (after that many digits). */
function posAfterNDigits(formatted: string, n: number): number {
  if (n <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (formatted[i] >= "0" && formatted[i] <= "9") {
      seen++;
      if (seen === n) return i + 1;
    }
  }
  return formatted.length;
}

export function MoneyInput({
  value,
  onChange,
  onNext,
  className,
  style,
  id,
  required,
  disabled,
  autoFocus,
}: MoneyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cents = Math.round(value * 100);
  const formatted = formatCents(cents);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onNext?.();
        return;
      }

      const isDigit = e.key >= "0" && e.key <= "9";
      const isBackspace = e.key === "Backspace";
      if (!isDigit && !isBackspace) return;

      e.preventDefault();

      const pos = inputRef.current?.selectionStart ?? formatted.length;
      const digits = formatted.replace(/\D/g, "");

      // Map cursor position in formatted string to digit index
      let digitIndex = 0;
      for (let i = 0; i < pos; i++) {
        if (formatted[i] >= "0" && formatted[i] <= "9") digitIndex++;
      }

      if (isDigit) {
        const newDigits =
          digits.slice(0, digitIndex) + e.key + digits.slice(digitIndex);
        const newCents = parseInt(newDigits, 10);
        if (newCents <= MAX_CENTS) {
          onChange(newCents / 100);
          const newFormatted = formatCents(newCents);
          const newPos = posAfterNDigits(newFormatted, digitIndex + 1);
          requestAnimationFrame(() => {
            inputRef.current?.setSelectionRange(newPos, newPos);
          });
        }
      } else if (digitIndex > 0) {
        const newDigits =
          digits.slice(0, digitIndex - 1) + digits.slice(digitIndex);
        const newCents = newDigits ? parseInt(newDigits, 10) : 0;
        onChange(newCents / 100);
        const newFormatted = formatCents(newCents);
        const newPos = posAfterNDigits(newFormatted, digitIndex - 1);
        requestAnimationFrame(() => {
          inputRef.current?.setSelectionRange(newPos, newPos);
        });
      }
    },
    [formatted, onChange, onNext],
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
      id={id}
      type="text"
      inputMode="numeric"
      value={formatted}
      onChange={() => {}}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      required={required}
      disabled={disabled}
      autoFocus={autoFocus}
      className={cn(
        "flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none dark:bg-input/30",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        disabled && "pointer-events-none cursor-not-allowed opacity-50",
        className,
      )}
      style={style}
    />
  );
}
