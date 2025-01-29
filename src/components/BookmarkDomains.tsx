interface BookmarkDomainsProps {
  domains: { domain: string; count: number }[];
  selectedDomain: string | null;
  onSelectDomain: (domain: string | null) => void;
}

const BookmarkDomains = ({
  domains,
  selectedDomain,
  onSelectDomain,
}: BookmarkDomainsProps) => {
  return (
    <div>
      <button onClick={() => onSelectDomain(null)}>All</button>
      {domains.map(({ domain, count }) => (
        <button
          key={domain}
          onClick={() => onSelectDomain(domain)}
        >
          {domain} ({count})
        </button>
      ))}
    </div>
  );
};

export default BookmarkDomains;