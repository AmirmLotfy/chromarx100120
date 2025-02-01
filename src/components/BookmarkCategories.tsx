import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";
import { BookmarkCheck } from "lucide-react";

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
    <ScrollArea className="h-[200px]">
      <div className="space-y-1 pr-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSelectCategory(null)}
          className={cn(
            "w-full justify-start",
            selectedCategory === null && "bg-accent text-accent-foreground"
          )}
        >
          <BookmarkCheck className="h-4 w-4 mr-2" />
          All Categories
        </Button>
        {categories.map((category) => (
          <Button
            key={category.name}
            variant="ghost"
            size="sm"
            onClick={() => onSelectCategory(category.name)}
            className={cn(
              "w-full justify-start",
              selectedCategory === category.name && "bg-accent text-accent-foreground"
            )}
          >
            <span className="truncate">{category.name}</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {category.count}
            </span>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
};

export default BookmarkCategories;