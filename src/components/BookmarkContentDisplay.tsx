interface BookmarkContentDisplayProps {
  title?: string;
  url?: string;
}

const BookmarkContentDisplay = ({ title, url }: BookmarkContentDisplayProps) => {
  return (
    <div className="min-w-0">
      {title && <h3 className="text-sm font-medium truncate">{title}</h3>}
      {url && <p className="text-xs text-muted-foreground truncate">{url}</p>}
    </div>
  );
};

export default BookmarkContentDisplay;