interface BookmarkContentDisplayProps {
  title?: string;
  url?: string;
}

const BookmarkContentDisplay = ({ title, url }: BookmarkContentDisplayProps) => {
  return (
    <div className="flex-1 min-w-0 space-y-1">
      <h3 className="font-medium truncate">{title}</h3>
      {url && (
        <p className="text-sm text-muted-foreground truncate">{url}</p>
      )}
    </div>
  );
};

export default BookmarkContentDisplay;