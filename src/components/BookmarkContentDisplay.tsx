interface BookmarkContentDisplayProps {
  title?: string;
  url?: string;
}

const BookmarkContentDisplay = ({ title, url }: BookmarkContentDisplayProps) => {
  return (
    <div>
      {title && <h3>{title}</h3>}
      {url && <p>{url}</p>}
    </div>
  );
};

export default BookmarkContentDisplay;