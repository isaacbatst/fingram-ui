import { useCallback, useLayoutEffect, useRef } from "react";
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

  const isFullySelected = () => {
    const input = inputRef.current;
    if (!input) return false;
    return (
      input.selectionStart === 0 && input.selectionEnd === input.value.length
    );
  };

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

      const baseCents = isFullySelected() ? 0 : cents;

      if (isDigit) {
        const newCents = baseCents * 10 + Number(e.key);
        if (newCents <= MAX_CENTS) onChange(newCents / 100);
      } else {
        const newCents = Math.floor(baseCents / 10);
        if (newCents !== cents) onChange(newCents / 100);
      }
    },
    [cents, onChange, onNext],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const text = e.clipboardData.getData("text");
      const digits = text.replace(/\D/g, "");
      if (digits) {
        const pastedCents = parseInt(digits, 10);
        if (pastedCents <= MAX_CENTS) onChange(pastedCents / 100);
      }
    },
    [onChange],
  );

  // Caret-aware editing breaks when the formatted width changes (thousands
  // separator appears/disappears, leading zero added), so we lock the caret
  // to the end and treat typing as a right-to-left calculator.
  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    if (document.activeElement !== input) return;
    const end = input.value.length;
    input.setSelectionRange(end, end);
  }, [formatted]);

  const handleFocus = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;
    requestAnimationFrame(() => {
      const end = input.value.length;
      input.setSelectionRange(end, end);
    });
  }, []);

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
      onFocus={handleFocus}
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
