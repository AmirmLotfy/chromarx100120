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
      <div>
        <h2>Domains</h2>
      </div>
      <div>
        <button onClick={() => onSelectDomain(null)}>
          All
        </button>
        {domains.map(({ domain, count }) => (
          <button
            key={domain}
            onClick={() => onSelectDomain(domain)}
          >
            {domain} ({count})
          </button>
        ))}
      </div>
    </div>
  );
};

export default BookmarkDomains;