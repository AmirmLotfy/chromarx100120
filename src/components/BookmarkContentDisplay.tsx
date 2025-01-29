interface BookmarkContentDisplayProps {
  title?: string;
  url?: string;
}

const BookmarkContentDisplay = ({ title, url }: BookmarkContentDisplayProps) => {
  return (
    <div>
      {title && <div>{title}</div>}
      {url && <div>{url}</div>}
    </div>
  );
};

export default BookmarkContentDisplay;