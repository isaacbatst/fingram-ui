import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CategoryWithType = {
  label: string;
  value: string;
  type: "income" | "expense" | "both";
};

type CategorySelectProps = {
  categories: CategoryWithType[];
  value: string | undefined;
  onChange: (value: string) => void;
  currentTransactionType: "income" | "expense";
  className?: string;
  onOpenChange?: (open: boolean) => void;
  isLoading?: boolean;
};

export function CategorySelect({
  categories,
  value,
  onChange,
  className = "",
  onOpenChange,
  isLoading,
}: CategorySelectProps) {
  if (categories.length === 0 && !isLoading) {
    return null;
  }

  const placeholder = isLoading ? (
    <span className="flex items-center gap-2 text-muted-foreground">
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
      Sugerindo categoria...
    </span>
  ) : (
    "Categoria"
  );

  return (
    <Select value={value} onValueChange={onChange} onOpenChange={onOpenChange}>
      <SelectTrigger className={`w-full ${className}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {categories.map((category) => (
          <SelectItem key={category.value} value={category.value}>
            {category.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
