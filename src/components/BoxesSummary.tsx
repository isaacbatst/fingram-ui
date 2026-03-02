import { useBoxes } from "@/hooks/useBoxes";
import { BoxCard } from "./BoxCard";

export function BoxesSummary() {
  const { boxes, isLoading } = useBoxes();

  if (isLoading) {
    return (
      <div className="flex justify-center py-2">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-300" />
      </div>
    );
  }

  if (!boxes || boxes.length === 0) {
    return null;
  }

  return (
    <div className="mb-3">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {boxes.map((box) => (
          <BoxCard key={box.id} box={box} />
        ))}
      </div>
    </div>
  );
}
