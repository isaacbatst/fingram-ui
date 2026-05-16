import { describe, expect, it } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MoneyInput } from "./MoneyInput";

function Harness({ initial = 0 }: { initial?: number }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <MoneyInput value={value} onChange={setValue} />
      <span data-testid="value">{value}</span>
    </>
  );
}

function getInput() {
  return screen.getByRole("textbox") as HTMLInputElement;
}

function getValue() {
  return Number(screen.getByTestId("value").textContent);
}

function pressKey(input: HTMLInputElement, key: string) {
  fireEvent.keyDown(input, { key });
}

describe("MoneyInput", () => {
  it("renders initial zero as 0,00", () => {
    render(<Harness />);
    expect(getInput().value).toBe("0,00");
  });

  it("renders initial value as pt-BR currency without symbol", () => {
    render(<Harness initial={1234.56} />);
    expect(getInput().value).toBe("1.234,56");
  });

  it("typing digits enters them right-to-left like a calculator", () => {
    render(<Harness />);
    const input = getInput();
    input.focus();

    pressKey(input, "1");
    expect(input.value).toBe("0,01");
    expect(getValue()).toBeCloseTo(0.01);

    pressKey(input, "2");
    expect(input.value).toBe("0,12");

    pressKey(input, "3");
    expect(input.value).toBe("1,23");

    pressKey(input, "4");
    expect(input.value).toBe("12,34");

    pressKey(input, "5");
    expect(input.value).toBe("123,45");

    pressKey(input, "6");
    expect(input.value).toBe("1.234,56");
    expect(getValue()).toBeCloseTo(1234.56);
  });

  it("caret stays at the end after each keystroke", () => {
    render(<Harness />);
    const input = getInput();
    input.focus();

    pressKey(input, "1");
    expect(input.selectionStart).toBe(input.value.length);

    pressKey(input, "2");
    expect(input.selectionStart).toBe(input.value.length);

    // Width changes here: "999,99" + "9" → "9.999,99" (thousands separator
    // appears). The pre-fix code left the caret 1 character to the left.
    for (let i = 0; i < 2; i++) pressKey(input, "9");
    expect(input.value).toBe("12,99");
    pressKey(input, "9");
    expect(input.value).toBe("129,99");
    pressKey(input, "9");
    expect(input.value).toBe("1.299,99");
    expect(input.selectionStart).toBe(input.value.length);
  });

  it("backspace removes the rightmost digit and keeps caret at end", () => {
    render(<Harness initial={12.34} />);
    const input = getInput();
    input.focus();
    expect(input.value).toBe("12,34");

    pressKey(input, "Backspace");
    expect(input.value).toBe("1,23");
    expect(input.selectionStart).toBe(input.value.length);

    // Width shrinks: leading zero appears in formatted output ("1,23" → "0,12").
    // The pre-fix code positioned the caret inside the digits.
    pressKey(input, "Backspace");
    expect(input.value).toBe("0,12");
    expect(getValue()).toBeCloseTo(0.12);
    expect(input.selectionStart).toBe(input.value.length);

    pressKey(input, "Backspace");
    expect(input.value).toBe("0,01");
    expect(input.selectionStart).toBe(input.value.length);

    pressKey(input, "Backspace");
    expect(input.value).toBe("0,00");
    expect(getValue()).toBeCloseTo(0);
  });

  it("backspace on zero is a no-op", () => {
    render(<Harness />);
    const input = getInput();
    input.focus();

    pressKey(input, "Backspace");
    expect(input.value).toBe("0,00");
    expect(getValue()).toBe(0);
  });

  it("ignores digits that would exceed the max value", () => {
    render(<Harness initial={9999999.99} />);
    const input = getInput();
    input.focus();
    expect(input.value).toBe("9.999.999,99");

    pressKey(input, "9");
    expect(input.value).toBe("9.999.999,99");
    expect(getValue()).toBeCloseTo(9999999.99);
  });

  it("clicking in the middle does not affect typing — digits still enter at the end", () => {
    render(<Harness initial={12.34} />);
    const input = getInput();
    input.focus();
    // Simulate user clicking somewhere in the middle
    input.setSelectionRange(2, 2);

    pressKey(input, "5");
    // Calculator behavior: 12.34 * 10 + 0.05 → 123.45
    expect(input.value).toBe("123,45");
    expect(input.selectionStart).toBe(input.value.length);
  });

  it("when fully selected, a digit replaces the value", () => {
    render(<Harness initial={123.45} />);
    const input = getInput();
    input.focus();
    input.setSelectionRange(0, input.value.length);

    pressKey(input, "9");
    expect(input.value).toBe("0,09");
    expect(getValue()).toBeCloseTo(0.09);
  });

  it("when fully selected, backspace clears the value", () => {
    render(<Harness initial={123.45} />);
    const input = getInput();
    input.focus();
    input.setSelectionRange(0, input.value.length);

    pressKey(input, "Backspace");
    expect(input.value).toBe("0,00");
    expect(getValue()).toBe(0);
  });

  it("ignores non-digit keys", () => {
    render(<Harness initial={1.23} />);
    const input = getInput();
    input.focus();

    pressKey(input, "a");
    pressKey(input, "-");
    pressKey(input, ",");
    pressKey(input, ".");
    expect(input.value).toBe("1,23");
    expect(getValue()).toBeCloseTo(1.23);
  });

  it("paste extracts digits from formatted text", () => {
    render(<Harness />);
    const input = getInput();
    input.focus();

    fireEvent.paste(input, {
      clipboardData: { getData: () => "R$ 1.234,56" },
    });

    expect(input.value).toBe("1.234,56");
    expect(getValue()).toBeCloseTo(1234.56);
  });

  it("paste ignored if it would exceed max", () => {
    render(<Harness initial={1} />);
    const input = getInput();
    input.focus();

    fireEvent.paste(input, {
      clipboardData: { getData: () => "99999999999" },
    });

    // Unchanged
    expect(getValue()).toBeCloseTo(1);
  });

  it("Enter calls onNext", () => {
    let nextCalls = 0;
    function H() {
      const [v, setV] = useState(5);
      return <MoneyInput value={v} onChange={setV} onNext={() => nextCalls++} />;
    }
    render(<H />);
    const input = getInput();
    input.focus();

    pressKey(input, "Enter");
    expect(nextCalls).toBe(1);
  });
});
