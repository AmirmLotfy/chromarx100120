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
    <div className="flex flex-col gap-1 w-full">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onSelectCategory(null)}
        className={cn(
          "justify-start h-8 px-2 font-normal text-sm rounded-md",
          selectedCategory === null && "bg-primary/10 text-primary font-medium"
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
            "justify-start h-8 px-2 font-normal text-sm rounded-md",
            selectedCategory === name && "bg-primary/10 text-primary font-medium"
          )}
        >
          {name} ({count})
        </Button>
      ))}
    </div>
  );
};

export default BookmarkCategories;