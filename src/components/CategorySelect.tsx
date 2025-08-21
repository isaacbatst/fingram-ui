import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Tipo local, não precisa importar Category

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
};

export function CategorySelect({
  categories,
  value,
  onChange,
  // Já não precisamos usar currentTransactionType aqui
  // pois já fizemos a filtragem em TransactionItem.tsx
  // mantemos no tipo para compatibilidade da interface
  className = "",
}: CategorySelectProps) {
  // Se não houver categorias, não renderizar o componente
  if (categories.length === 0) {
    return null;
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`text-xs w-full ${className}`}>
        <SelectValue placeholder="Categoria" />
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
