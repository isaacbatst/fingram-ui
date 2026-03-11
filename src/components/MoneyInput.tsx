import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface MoneyInputProps {
  value: number;
  onChange: (value: number) => void;
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
  className,
  style,
  id,
  required,
  disabled,
  autoFocus,
}: MoneyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cents = Math.round(value * 100);
  const [isFocused, setIsFocused] = useState(false);

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
    <div
      className={cn(
        "relative flex items-center min-w-0 h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base md:text-sm shadow-xs transition-[color,box-shadow] outline-none dark:bg-input/30",
        "has-[:focus-visible]:border-ring has-[:focus-visible]:ring-ring/50 has-[:focus-visible]:ring-[3px]",
        disabled && "pointer-events-none cursor-not-allowed opacity-50",
        className,
      )}
      style={style}
    >
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="numeric"
        value={cents > 0 ? formatCents(cents) : ""}
        onChange={() => {}}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        required={required}
        disabled={disabled}
        autoFocus={autoFocus}
        className="absolute inset-0 w-full h-full opacity-0 cursor-text"
      />
      <span className="block w-full truncate pointer-events-none" aria-hidden="true">
        {formatCents(cents)}
        {isFocused && (
          <span className="hidden md:inline-block w-[2px] h-[1em] bg-current align-middle ml-px animate-caret-blink" />
        )}
      </span>
    </div>
  );
}
