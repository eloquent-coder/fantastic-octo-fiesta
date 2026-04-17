interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;

  const atStart = page === 0;
  const atEnd = page >= totalPages - 1;

  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" onClick={() => onChange(page - 1)} disabled={atStart}>
        ← Prev
      </button>
      <span>
        Page {page + 1} of {totalPages}
      </span>
      <button type="button" onClick={() => onChange(page + 1)} disabled={atEnd}>
        Next →
      </button>
    </nav>
  );
}
