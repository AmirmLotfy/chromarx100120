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
    <div>
      <div>
        <h2>Categories</h2>
      </div>
      <div>
        <button onClick={() => onSelectCategory(null)}>
          All
        </button>
        {categories.map((category) => (
          <button
            key={category.name}
            onClick={() => onSelectCategory(category.name)}
          >
            {category.name} ({category.count})
          </button>
        ))}
      </div>
    </div>
  );
};

export default BookmarkCategories;