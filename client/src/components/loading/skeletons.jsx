import Skeleton from "./Skeleton";

/* Ready-made skeletons for the layouts used in this site.
   Each one copies the shape of the real thing so the page doesn't jump when data arrives. */

// Wraps a group so screen readers hear "Loading…" once
function Region({ label, className = "", children }) {
  return (
    <div className={className} role="status" aria-busy="true">
      <span className="visually-hidden">{label}</span>
      {children}
    </div>
  );
}

/** Product grid.  <ProductGridSkeleton count={8} /> */
export function ProductGridSkeleton({ count = 8 }) {
  return (
    <Region label="Loading products…" className="row g-3">
      {Array.from({ length: count }, (_, i) => (
        <div className="col-6 col-md-4 col-lg-3" key={i}>
          <div className="card h-100 p-2">
            <Skeleton height="180px" className="mb-3" />
            <Skeleton width="75%" className="mb-2" />
            <Skeleton width="40%" className="mb-3" />
            <Skeleton height="38px" />
          </div>
        </div>
      ))}
    </Region>
  );
}

/** Order cards (history, admin orders, manager orders).
 *  Uses the .history-grid and .order-card classes from History.css. */
export function OrderGridSkeleton({ count = 6 }) {
  return (
    <Region label="Loading orders…" className="history-grid">
      {Array.from({ length: count }, (_, i) => (
        <article className="order-card" key={i}>
          <div className="d-flex justify-content-between align-items-start">
            <div style={{ width: "55%" }}>
              <Skeleton width="45%" height="12px" className="mb-2" />
              <Skeleton width="85%" height="18px" />
            </div>
            <Skeleton width="86px" height="26px" rounded="999px" />
          </div>
          <div className="d-flex justify-content-between">
            <Skeleton width="30%" />
            <Skeleton width="20%" />
          </div>
          <div className="d-flex justify-content-between">
            <Skeleton width="38%" />
            <Skeleton width="25%" />
          </div>
          <Skeleton height="42px" />
        </article>
      ))}
    </Region>
  );
}

/** Rows inside a <tbody>.  <tbody><TableRowsSkeleton rows={8} cols={3} /></tbody> */
export function TableRowsSkeleton({ rows = 5, cols = 3 }) {
  return (
    <>
      {Array.from({ length: rows }, (_, r) => (
        <tr key={r} aria-hidden="true">
          {Array.from({ length: cols }, (_, c) => (
            <td key={c} className="py-3">
              <Skeleton width={c === 0 ? "70%" : "85%"} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/** Dashboard number cards. Uses .stat-grid and .stat-card from the dashboard CSS. */
export function StatGridSkeleton({ count = 3 }) {
  return (
    <Region label="Loading statistics…" className="stat-grid">
      {Array.from({ length: count }, (_, i) => (
        <div className="stat-card" key={i}>
          <Skeleton width="40%" height="14px" className="mb-3" />
          <Skeleton width="60%" height="36px" />
        </div>
      ))}
    </Region>
  );
}

/** Column-chart placeholder.  <ChartSkeleton height={300} /> */
export function ChartSkeleton({ height = 300 }) {
  const bars = [55, 80, 40, 95, 65, 50, 75];
  return (
    <Region label="Loading chart…">
      <div className="d-flex align-items-end gap-3" style={{ height }}>
        {bars.map((h, i) => (
          <Skeleton key={i} height={`${h}%`} className="flex-fill" rounded="6px 6px 0 0" />
        ))}
      </div>
    </Region>
  );
}

/** Paragraph lines.  <TextSkeleton lines={4} /> */
export function TextSkeleton({ lines = 3 }) {
  return (
    <Region label="Loading…">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? "60%" : "100%"} className="mb-2" />
      ))}
    </Region>
  );
}
