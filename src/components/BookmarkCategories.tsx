import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";

interface BookmarkCategory {
  name: string;
  count: number;
}

interface BookmarkCategoriesProps {
  categories: BookmarkCategory[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

const BookmarkCategories = ({
  categories,
  selectedCategory,
  onSelectCategory,
}: BookmarkCategoriesProps) => {
  return (
    <ScrollArea className="w-full">
      <div className="flex flex-wrap gap-2 p-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSelectCategory(null)}
          className={cn(
            "whitespace-nowrap",
            selectedCategory === null && "bg-primary text-primary-foreground"
          )}
        >
          All
        </Button>
        {categories.map((category) => (
          <Button
            key={category.name}
            variant="outline"
            size="sm"
            onClick={() => onSelectCategory(category.name)}
            className={cn(
              "whitespace-nowrap",
              selectedCategory === category.name && "bg-primary text-primary-foreground"
            )}
          >
            {category.name} ({category.count})
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
};

export default BookmarkCategories;