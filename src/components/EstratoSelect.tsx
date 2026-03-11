import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBoxes } from "@/hooks/useBoxes";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

type EstratoSelectProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function EstratoSelect({
  value,
  onChange,
  placeholder = "Estrato",
  className,
}: EstratoSelectProps) {
  const { boxes } = useBoxes();

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {boxes?.map((box) => (
          <SelectItem key={box.id} value={box.id}>
            <span className="flex w-full items-baseline justify-between gap-3">
              <span className="truncate">{box.name}</span>
              <span className="font-mono text-[11px] text-muted-foreground shrink-0">
                {formatCurrency(box.balance)}
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
