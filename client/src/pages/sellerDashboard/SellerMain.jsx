import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import Input from "../../components/input/input";
import Button from "../../components/button/button";
import { StatusPill } from "../../components/orderCard/orderCard";
import { StatGridSkeleton, ChartSkeleton, Skeleton } from "../../components/loading";
import { SERVER_URL } from "../../config";
import "../adminDashboard/adminMain.css"; // shared list / badge / toggle styles

const toISO = (d) => d.toISOString().slice(0, 10); // "YYYY-MM-DD"
const money = (n) => `$${Number(n || 0).toFixed(2)}`;
const dayLabel = (day) =>
  new Date(`${day}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const shortName = (v) => (v.length > 12 ? `${v.slice(0, 12)}…` : v);
const MAX_DAYS = 366;
const STATUS_ORDER = ["Processing", "Shipped", "Delivered", "Cancelled"];
const COLORS = [
  "var(--dz-primary)", "var(--dz-accent)", "var(--dz-info)",
  "var(--dz-warning)", "var(--dz-danger)", "var(--dz-success)",
];
const TOOLTIP_STYLE = {
  background: "var(--dz-surface)",
  border: "1px solid var(--dz-border)",
  borderRadius: 10,
  color: "var(--dz-text)",
};
const TICK = { fill: "var(--dz-muted)", fontSize: 12 };

function StockBadge({ quantity }) {
  if (quantity === 0) return <span className="admin-badge admin-badge--danger">Out of stock</span>;
  return <span className="admin-badge">{quantity} left</span>;
}

export default function SellerMain() {
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
  const [reloadKey, setReloadKey] = useState(0);
  const [metric, setMetric] = useState("revenue"); // charts: "revenue" | "units"

  const days = (new Date(end) - new Date(start)) / 86400000 + 1;
  const invalidRange = !(days >= 1);
  const tooLong = days > MAX_DAYS;
  const isMoney = metric === "revenue";
  const fmt = (v) => (isMoney ? money(v) : v);

  useEffect(() => {
    if (invalidRange || tooLong) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        // ===================== BACKEND CONNECTION =====================
        // GET /api/seller/stats?start=&end=  -> getStats in sellerController.js
        // (only this seller's products, taken from the login cookie)
        const res = await fetch(`${SERVER_URL}/api/seller/stats?start=${start}&end=${end}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Could not load statistics.");
        // ===============================================================
        if (!cancelled) setStats(data.data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [start, end, invalidRange, tooLong, reloadKey]);

  return (
    <>
      <h1 className="dash-title">Main</h1>

      <div className="dash-panel d-flex flex-wrap gap-4 align-items-end mb-4">
        <Input label="From" type="date" name="start" value={start} max={end}
          onChange={(e) => setStart(e.target.value)} className="w-auto" />
        <Input label="To" type="date" name="end" value={end} min={start}
          onChange={(e) => setEnd(e.target.value)} className="w-auto" />
      </div>

      {invalidRange && <div className="alert alert-warning">The start date must be before the end date.</div>}
      {tooLong && <div className="alert alert-warning">Choose a range of up to one year.</div>}
      {error && (
        <div className="alert alert-danger d-flex flex-wrap justify-content-between align-items-center gap-2" role="alert">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={() => setReloadKey((k) => k + 1)}>Try again</Button>
        </div>
      )}

      {loading && !invalidRange && !tooLong && (
        <div className="d-flex flex-column gap-4">
          <StatGridSkeleton count={5} />
          <div className="row g-4">
            {[0, 1].map((i) => (
              <div className="col-lg-6" key={i}>
                <div className="dash-panel"><ChartSkeleton height={240} /></div>
              </div>
            ))}
          </div>
          <div className="dash-panel"><Skeleton height="10rem" /></div>
        </div>
      )}

      {stats && !loading && !invalidRange && !tooLong && (
        <div className="d-flex flex-column gap-4">
          {/* Numbers for the dates */}
          <div className="stat-grid">
            {[
              ["Revenue", money(stats.revenue)],
              ["Earned (delivered)", money(stats.earned)],
              ["Units sold", stats.unitsSold],
              ["Orders", stats.ordersCount],
              ["Cancellation rate", `${stats.cancellationRate}%`],
            ].map(([label, value]) => (
              <div className="stat-card" key={label}>
                <p className="stat-card__label">{label}</p>
                <p className="stat-card__value">{value}</p>
              </div>
            ))}
          </div>

          <div className="admin-statuses">
            {STATUS_ORDER.map((s) => (
              <div className="admin-status" key={s}>
                <StatusPill status={s} />
                <strong>{stats.statusCounts[s]}</strong>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="d-flex justify-content-end">
            <div className="dash-toggle" role="group" aria-label="Chart data">
              <button type="button" aria-pressed={metric === "revenue"} onClick={() => setMetric("revenue")}>Revenue</button>
              <button type="button" aria-pressed={metric === "units"} onClick={() => setMetric("units")}>Units</button>
            </div>
          </div>
          <div className="row g-4">
            <div className="col-lg-6">
              <section className="dash-panel h-100">
                <h2 className="dash-panel__title">{isMoney ? "Revenue" : "Units"} per day</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={stats.daily} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--dz-border)" />
                    <XAxis dataKey="day" tickFormatter={dayLabel} tick={TICK} stroke="var(--dz-border)" minTickGap={24} />
                    <YAxis allowDecimals={false} tick={TICK} stroke="var(--dz-border)"
                      tickFormatter={(v) => (isMoney ? `$${v}` : v)} />
                    <Tooltip labelFormatter={dayLabel} formatter={(v) => [fmt(v), isMoney ? "Revenue" : "Units"]}
                      cursor={{ fill: "var(--dz-surface-2)" }} contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey={metric} fill="var(--dz-primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </section>
            </div>
            <div className="col-lg-6">
              <section className="dash-panel h-100">
                <h2 className="dash-panel__title">{isMoney ? "Revenue" : "Units"} per product</h2>
                {stats.topProducts.length ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={stats.topProducts} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--dz-border)" />
                      <XAxis dataKey="name" tickFormatter={shortName} tick={TICK} stroke="var(--dz-border)" />
                      <YAxis allowDecimals={false} tick={TICK} stroke="var(--dz-border)"
                        tickFormatter={(v) => (isMoney ? `$${v}` : v)} />
                      <Tooltip formatter={(v) => [fmt(v), isMoney ? "Revenue" : "Units"]}
                        cursor={{ fill: "var(--dz-surface-2)" }} contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey={metric} fill="var(--dz-primary)" radius={[6, 6, 0, 0]}>
                        {stats.topProducts.map((p, i) => (
                          <Cell key={p.p_id} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="admin-muted py-5 text-center mb-0">No sales in this period.</p>
                )}
              </section>
            </div>
          </div>

          {/* Best sellers table */}
          <section className="dash-panel">
            <h2 className="dash-panel__title">Best sellers</h2>
            {stats.topProducts.length ? (
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr><th>Product</th><th className="text-end">Units</th><th className="text-end">Revenue</th><th className="text-end">Stock</th></tr>
                  </thead>
                  <tbody>
                    {stats.topProducts.map((p) => (
                      <tr key={p.p_id}>
                        <td className="fw-semibold">{p.name}</td>
                        <td className="text-end">{p.units}</td>
                        <td className="text-end">{money(p.revenue)}</td>
                        <td className="text-end"><StockBadge quantity={p.stock} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="admin-muted mb-0">Nothing sold in this period.</p>
            )}
          </section>

          {/* Stock and products without sales */}
          <div className="row g-4">
            <div className="col-lg-6">
              <section className="dash-panel h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h2 className="dash-panel__title mb-0">Stock alerts</h2>
                  <span className={`admin-badge ${stats.stock.outOfStock ? "admin-badge--danger" : ""}`}>
                    {stats.stock.outOfStock} out of stock
                  </span>
                </div>
                {stats.stock.products.length ? (
                  <>
                    <p className="admin-muted small">{stats.stock.low} more with 5 or fewer left. Showing the lowest.</p>
                    <ul className="admin-list">
                      {stats.stock.products.map((p) => (
                        <li key={p.p_id}>
                          <Link className="name" to={`/product/edit/${p.p_id}`}>{p.name}</Link>
                          <StockBadge quantity={p.quantity} />
                        </li>
                      ))}
                    </ul>
                    <Link className="d-inline-block mt-3 small fw-semibold" to="/seller/products">Manage my products</Link>
                  </>
                ) : (
                  <p className="admin-muted mb-0">Every product has enough stock.</p>
                )}
              </section>
            </div>
            <div className="col-lg-6">
              <section className="dash-panel h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h2 className="dash-panel__title mb-0">No sales in this period</h2>
                  <span className="admin-badge">{stats.noSales.count} of {stats.productCount}</span>
                </div>
                {stats.noSales.products.length ? (
                  <ul className="admin-list">
                    {stats.noSales.products.map((p) => (
                      <li key={p.p_id}>
                        <Link className="name" to={`/product/edit/${p.p_id}`}>{p.name}</Link>
                        <span className="admin-muted">{p.stock} in stock</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="admin-muted mb-0">Every product sold at least once. Great!</p>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
