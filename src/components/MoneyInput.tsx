import { useCallback, useRef, useState } from "react";
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
  const isAutoFocusing = useRef(!!autoFocus);
  const cents = Math.round(value * 100);
  const [isFocused, setIsFocused] = useState(false);
  const [cursorPos, setCursorPos] = useState<number | null>(null);
  const formatted = formatCents(cents);

  const moveCursorToEnd = useCallback(() => {
    const len = formatted.length;
    inputRef.current?.setSelectionRange(len, len);
    setCursorPos(null);
  }, [formatted.length]);

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

      if (cursorPos !== null) {
        // Positional edit: map formatted position to digit index
        const digits = formatted.replace(/\D/g, "");
        let digitIndex = 0;
        for (let i = 0; i < cursorPos; i++) {
          if (formatted[i] >= "0" && formatted[i] <= "9") digitIndex++;
        }

        if (isDigit) {
          const newDigits =
            digits.slice(0, digitIndex) + e.key + digits.slice(digitIndex);
          const newCents = parseInt(newDigits, 10);
          if (newCents <= MAX_CENTS) {
            onChange(newCents / 100);
            // Cursor advances: after (digitIndex + 1) digits in new formatted
            const newFormatted = formatCents(newCents);
            const newPos = posAfterNDigits(newFormatted, digitIndex + 1);
            setCursorPos(newPos);
            requestAnimationFrame(() => {
              inputRef.current?.setSelectionRange(newPos, newPos);
            });
          }
        } else if (digitIndex > 0) {
          const newDigits =
            digits.slice(0, digitIndex - 1) + digits.slice(digitIndex);
          const newCents = newDigits ? parseInt(newDigits, 10) : 0;
          onChange(newCents / 100);
          // Cursor goes back: after (digitIndex - 1) digits in new formatted
          const newFormatted = formatCents(newCents);
          const newPos = posAfterNDigits(newFormatted, digitIndex - 1);
          setCursorPos(newPos);
          requestAnimationFrame(() => {
            inputRef.current?.setSelectionRange(newPos, newPos);
          });
        }
      } else {
        // Default: append/remove from end
        if (isDigit) {
          const digit = parseInt(e.key, 10);
          const newCents = cents * 10 + digit;
          if (newCents <= MAX_CENTS) {
            onChange(newCents / 100);
          }
        } else {
          onChange(Math.floor(cents / 10) / 100);
        }

        requestAnimationFrame(() => {
          moveCursorToEnd();
        });
      }
    },
    [cents, formatted, cursorPos, onChange, onNext, moveCursorToEnd],
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
      setCursorPos(null);
    },
    [onChange],
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (isAutoFocusing.current) {
      // autoFocus: cursor at end (append mode)
      setCursorPos(null);
      requestAnimationFrame(() => {
        moveCursorToEnd();
      });
      isAutoFocusing.current = false;
    }
    // User tap: handleClick will set cursorPos
  }, [moveCursorToEnd]);

  const handleClick = useCallback(() => {
    requestAnimationFrame(() => {
      const pos = inputRef.current?.selectionStart ?? null;
      if (pos !== null && pos < formatted.length) {
        setCursorPos(pos);
      } else {
        setCursorPos(null);
        moveCursorToEnd();
      }
    });
  }, [formatted.length, moveCursorToEnd]);

  const cursorSpan = (
    <span className="inline-block w-[2px] h-[1em] bg-current align-middle ml-px animate-caret-blink" />
  );

  const renderValue = () => {
    if (!isFocused) return formatted;

    if (cursorPos !== null && cursorPos <= formatted.length) {
      return (
        <>
          {formatted.slice(0, cursorPos)}
          {cursorSpan}
          {formatted.slice(cursorPos)}
        </>
      );
    }

    return (
      <>
        {formatted}
        {cursorSpan}
      </>
    );
  };

  return (
    <div
      className={cn(
        "relative flex items-center min-w-0 h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none dark:bg-input/30",
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
        value={cents > 0 ? formatted : ""}
        onChange={() => {}}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onFocus={handleFocus}
        onBlur={() => {
          setIsFocused(false);
          setCursorPos(null);
        }}
        onClick={handleClick}
        required={required}
        disabled={disabled}
        autoFocus={autoFocus}
        className="absolute inset-0 w-full h-full opacity-0 cursor-text"
      />
      <span className="block w-full truncate pointer-events-none" aria-hidden="true">
        {renderValue()}
      </span>
    </div>
  );
}
