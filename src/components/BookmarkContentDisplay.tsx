interface BookmarkContentDisplayProps {
  title?: string;
  url?: string;
}

const BookmarkContentDisplay = ({ title, url }: BookmarkContentDisplayProps) => {
  return (
    <div className="flex-1 min-w-0">
      <h3 className="font-medium truncate">{title}</h3>
    </div>
  );
};

export default BookmarkContentDisplay;