import { useState, useEffect } from "react";
import "./Pagination.css";

/**
 * Reusable Theme-Aware Pagination
 * Props:
 *  - page (number, 1-based)
 *  - totalPages (number)
 *  - onChange (function: (newPage) => void)
 */
export default function Pagination({ page, totalPages, onChange }) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!totalPages || totalPages <= 1) return null;

  // Window generator: 3-4 pages on mobile, up to 7-8 pages on desktop
  const generatePageNumbers = () => {
    const windowSlice = isMobile ? 3 : 7;

    if (totalPages <= windowSlice + 2) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftOffset = isMobile ? 1 : 2;
    const rightOffset = isMobile ? 2 : windowSlice - 2;

    let start = Math.max(2, page - leftOffset);
    let end = Math.min(totalPages - 1, page + rightOffset);

    // If near the start, push the window forward
    if (page - leftOffset <= 2) {
      start = 2;
      end = Math.min(totalPages - 1, start + windowSlice - 1);
    }

    // If near the end, push the window backward
    if (page + rightOffset >= totalPages - 1) {
      end = totalPages - 1;
      start = Math.max(2, end - windowSlice + 1);
    }

    const items = [1];

    if (start > 2) {
      items.push("ellipsis-start");
    }

    for (let i = start; i <= end; i++) {
      items.push(i);
    }

    if (end < totalPages - 1) {
      items.push("ellipsis-end");
    }

    items.push(totalPages);

    return items;
  };

  const pages = generatePageNumbers();

  const handlePageClick = (p) => {
    if (p < 1 || p > totalPages || p === page) return;
    onChange(p);
  };

  return (
    <nav aria-label="Products pagination" className="dz-pagination-nav">
      <ul className="dz-pagination">
        {/* Previous Button */}
        <li className={`dz-pagination__item ${page === 1 ? "is-disabled" : ""}`}>
          <button
            type="button"
            className="dz-pagination__btn dz-pagination__btn--nav dz-pagination__btn--prev"
            onClick={() => handlePageClick(page - 1)}
            disabled={page === 1}
            aria-label="Previous page"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>Prev</span>
          </button>
        </li>

        {/* Page Numbers & Ellipses */}
        {pages.map((item, idx) => {
          if (typeof item === "string") {
            return (
              <li key={`ellipsis-${idx}`} className="dz-pagination__item" aria-hidden="true">
                <span className="dz-pagination__ellipsis">…</span>
              </li>
            );
          }

          const isActive = page === item;

          return (
            <li
              key={item}
              className={`dz-pagination__item ${isActive ? "is-active" : ""}`}
            >
              <button
                type="button"
                className="dz-pagination__btn"
                onClick={() => handlePageClick(item)}
                aria-current={isActive ? "page" : undefined}
                aria-label={`Page ${item}`}
              >
                {item}
              </button>
            </li>
          );
        })}

        {/* Next Button */}
        <li
          className={`dz-pagination__item ${
            page === totalPages ? "is-disabled" : ""
          }`}
        >
          <button
            type="button"
            className="dz-pagination__btn dz-pagination__btn--nav dz-pagination__btn--next"
            onClick={() => handlePageClick(page + 1)}
            disabled={page === totalPages}
            aria-label="Next page"
          >
            <span>Next</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </li>
      </ul>
    </nav>
  );
}
