import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface BookmarkCategoriesProps {
  categories: { name: string; count: number }[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

const BookmarkCategories = ({
  categories,
  selectedCategory,
  onSelectCategory,
}: BookmarkCategoriesProps) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onSelectCategory(null)}
        className={cn(
          "justify-start h-9 px-3 font-normal",
          selectedCategory === null && "bg-accent text-accent-foreground"
        )}
      >
        All Categories
      </Button>
      {categories.map(({ name, count }) => (
        <Button
          key={name}
          variant="ghost"
          size="sm"
          onClick={() => onSelectCategory(name)}
          className={cn(
            "justify-start h-9 px-3 font-normal",
            selectedCategory === name && "bg-accent text-accent-foreground"
          )}
        >
          {name} ({count})
        </Button>
      ))}
    </div>
  );
};

export default BookmarkCategories;