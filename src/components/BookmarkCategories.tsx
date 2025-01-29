import { useState } from "react";
import { Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Tag className="h-4 w-4" />
        <h2 className="text-sm font-medium">Categories</h2>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={selectedCategory === null ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => onSelectCategory(null)}
        >
          All
        </Badge>
        {categories.map((category) => (
          <Badge
            key={category.name}
            variant={selectedCategory === category.name ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => onSelectCategory(category.name)}
          >
            {category.name} ({category.count})
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default BookmarkCategories;