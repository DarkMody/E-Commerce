import { useEffect, useState } from "react";
import { SERVER_URL } from "../../config";

const toISO = (d) => d.toISOString().slice(0, 10); // "YYYY-MM-DD"

export default function AdminMain() {
  // Default range: last 30 days
  const [start, setStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return toISO(d);
  });
  const [end, setEnd] = useState(() => toISO(new Date()));
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const invalidRange = start > end;

  useEffect(() => {
    if (invalidRange) return;
    const load = async () => {
      setLoading(true);
      console.log(start, end);
      setError("");
      try {
        const res = await fetch(
          `${SERVER_URL}/api/admin/stats?start=${start}&end=${end}`,
          {
            credentials: "include",
          },
        );
        if (!res.ok) throw new Error("Could not load statistics.");
        const stats = await res.json();
        setStats(stats.data);
      } catch (err) {
        window.toast("error", err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [start, end, invalidRange]);

  return (
    <>
      <h1 className="admin-title">Main</h1>

      <div className="admin-panel d-flex flex-wrap gap-3 align-items-end mb-4">
        <div>
          <label htmlFor="start" className="form-label">
            From
          </label>
          <input
            id="start"
            type="date"
            className="form-control"
            value={start}
            max={end}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="end" className="form-label">
            To
          </label>
          <input
            id="end"
            type="date"
            className="form-control"
            value={end}
            min={start}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
      </div>

      {invalidRange && (
        <div className="alert alert-warning">
          The start date must be before the end date.
        </div>
      )}
      {error && <div className="alert alert-danger">{error}</div>}
      {loading && !invalidRange && (
        <div className="spinner-border" role="status"></div>
      )}

      {stats && !loading && !invalidRange && (
        <div className="stat-grid">
          <div className="stat-card">
            <p className="stat-card__label">Orders</p>
            <p className="stat-card__value">{stats.ordersCount}</p>
          </div>
          <div className="stat-card">
            <p className="stat-card__label">New users</p>
            <p className="stat-card__value">{stats.usersCount}</p>
          </div>
          <div className="stat-card">
            <p className="stat-card__label">Sales</p>
            <p className="stat-card__value">
              ${Number(stats.salesTotal || 0).toFixed(2)}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
