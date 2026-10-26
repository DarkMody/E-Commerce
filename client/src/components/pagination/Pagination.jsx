/**
 * Reusable Bootstrap pagination.
 * Props: page (1-based), totalPages, onChange(newPage)
 */
export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  // Show a window of up to 5 page numbers around the current page.
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <nav aria-label="Pagination" className="mt-4 d-flex justify-content-center">
      <ul className="pagination admin-pagination mb-0">
        <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
          <button className="page-link" onClick={() => onChange(page - 1)}>
            Prev
          </button>
        </li>
        {pages.map((p) => (
          <li key={p} className={`page-item ${p === page ? "active" : ""}`}>
            <button className="page-link" onClick={() => onChange(p)}>
              {p}
            </button>
          </li>
        ))}
        <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
          <button className="page-link" onClick={() => onChange(page + 1)}>
            Next
          </button>
        </li>
      </ul>
    </nav>
  );
}
