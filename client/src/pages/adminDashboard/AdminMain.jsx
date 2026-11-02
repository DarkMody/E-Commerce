import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Input from "../../components/input/input";
import Button from "../../components/button/button";
import { StatusPill } from "../../components/orderCard/orderCard";
import {
  StatGridSkeleton,
  ChartSkeleton,
  Skeleton,
} from "../../components/loading";
import { SERVER_URL } from "../../config";
import "./adminMain.css";

const toISO = (d) => d.toISOString().slice(0, 10); // "YYYY-MM-DD"
const money = (n) => `$${Number(n || 0).toFixed(2)}`;
const dayLabel = (day) =>
  new Date(`${day}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
const waitingFor = (date) => {
  const hours = (Date.now() - new Date(date).getTime()) / 3600000;
  return hours < 24
    ? `${Math.max(1, Math.floor(hours))}h`
    : `${Math.floor(hours / 24)}d`;
};
const STATUS_ORDER = ["Processing", "Shipped", "Delivered", "Cancelled"];

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
  const [reloadKey, setReloadKey] = useState(0);
  const [metric, setMetric] = useState("sales"); // chart: "sales" | "orders"

  const days = (new Date(end) - new Date(start)) / 86400000 + 1;
  const invalidRange = !(days >= 1);

  useEffect(() => {
    if (invalidRange) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        // ===================== BACKEND CONNECTION =====================
        // GET /api/admin/stats?start=&end=  -> see getStatus in adminController.js
        const res = await fetch(
          `${SERVER_URL}/api/admin/stats?start=${start}&end=${end}`,
          {
            credentials: "include",
          },
        );
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.message || "Could not load statistics.");
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
  }, [start, end, invalidRange, reloadKey]);

  const totalPayments = stats
    ? stats.paymentMethods.reduce((sum, m) => sum + m.count, 0)
    : 0;

  return (
    <>
      <h1 className="dash-title">Main</h1>

      {/* Date range */}
      <div className="dash-panel d-flex flex-wrap gap-4 align-items-end mb-4">
        <Input
          label="From"
          type="date"
          name="start"
          value={start}
          max={end}
          onChange={(e) => setStart(e.target.value)}
          className="w-auto"
        />
        <Input
          label="To"
          type="date"
          name="end"
          value={end}
          min={start}
          onChange={(e) => setEnd(e.target.value)}
          className="w-auto"
        />
      </div>

      {invalidRange && (
        <div className="alert alert-warning">
          The start date must be before the end date.
        </div>
      )}

      {error && (
        <div
          className="alert alert-danger d-flex flex-wrap justify-content-between align-items-center gap-2"
          role="alert"
        >
          <span>{error}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReloadKey((k) => k + 1)}
          >
            Try again
          </Button>
        </div>
      )}

      {loading && !invalidRange && (
        <div className="d-flex flex-column gap-4">
          <StatGridSkeleton count={6} />
          <div className="dash-panel">
            <ChartSkeleton height={260} />
          </div>
          <div className="row g-4">
            {[0, 1].map((i) => (
              <div className="col-lg-6" key={i}>
                <div className="dash-panel">
                  <Skeleton height="9rem" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats && !loading && !invalidRange && (
        <div className="d-flex flex-column gap-4">
          {/* Numbers for the selected dates */}
          <div className="stat-grid">
            {[
              ["Orders", stats.ordersCount],
              ["Sales", money(stats.salesTotal)],
              ["Delivered revenue", money(stats.deliveredRevenue)],
              ["Average order", money(stats.averageOrderValue)],
              ["Cancellation rate", `${stats.cancellationRate}%`],
              ["New users", stats.usersCount],
            ].map(([label, value]) => (
              <div className="stat-card" key={label}>
                <p className="stat-card__label">{label}</p>
                <p className="stat-card__value">{value}</p>
              </div>
            ))}
          </div>

          {/* Orders by status */}
          <div className="admin-statuses">
            {STATUS_ORDER.map((s) => (
              <div className="admin-status" key={s}>
                <StatusPill status={s} />
                <strong>{stats.statusCounts[s]}</strong>
              </div>
            ))}
          </div>

          {/* Chart per day */}
          <section className="dash-panel">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <h2 className="dash-panel__title mb-0">
                {metric === "sales" ? "Sales per day" : "Orders per day"}
              </h2>
              <div className="dash-toggle" role="group" aria-label="Chart data">
                <button
                  type="button"
                  aria-pressed={metric === "sales"}
                  onClick={() => setMetric("sales")}
                >
                  Sales
                </button>
                <button
                  type="button"
                  aria-pressed={metric === "orders"}
                  onClick={() => setMetric("orders")}
                >
                  Orders
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={stats.daily}
                margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--dz-border)"
                />
                <XAxis
                  dataKey="day"
                  tickFormatter={dayLabel}
                  tick={{ fill: "var(--dz-muted)", fontSize: 12 }}
                  stroke="var(--dz-border)"
                  minTickGap={24}
                />
                <YAxis
                  allowDecimals={false}
                  tickFormatter={(v) => (metric === "sales" ? `$${v}` : v)}
                  tick={{ fill: "var(--dz-muted)", fontSize: 12 }}
                  stroke="var(--dz-border)"
                />
                <Tooltip
                  labelFormatter={dayLabel}
                  formatter={(v) => [
                    metric === "sales" ? money(v) : v,
                    metric === "sales" ? "Sales" : "Orders",
                  ]}
                  cursor={{ fill: "var(--dz-surface-2)" }}
                  contentStyle={{
                    background: "var(--dz-surface)",
                    border: "1px solid var(--dz-border)",
                    borderRadius: 10,
                    color: "var(--dz-text)",
                  }}
                />
                <Bar
                  dataKey={metric}
                  fill="var(--dz-primary)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </section>

          {/* Top products, payments, roles */}
          <div className="row g-4">
            <div className="col-lg-4">
              <section className="dash-panel h-100">
                <h2 className="dash-panel__title">Top selling products</h2>
                {stats.topProducts.length ? (
                  <ol className="admin-list">
                    {stats.topProducts.map((p, i) => (
                      <li key={p.p_id}>
                        <span className="name">
                          {i + 1}. {p.name}
                        </span>
                        <strong>{p.units} sold</strong>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="admin-muted mb-0">No sales in this period.</p>
                )}
              </section>
            </div>
            <div className="col-lg-4">
              <section className="dash-panel h-100">
                <h2 className="dash-panel__title">Payment methods</h2>
                {totalPayments ? (
                  <div className="d-flex flex-column gap-3">
                    {stats.paymentMethods.map((m) => {
                      const percent = Math.round(
                        (m.count / totalPayments) * 100,
                      );
                      return (
                        <div key={m.method}>
                          <div className="d-flex justify-content-between small">
                            <span className="text-capitalize fw-semibold">
                              {m.method}
                            </span>
                            <span className="admin-muted">
                              {m.count} orders · {percent}%
                            </span>
                          </div>
                          <div className="admin-bar">
                            <span style={{ width: `${percent}%` }}></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="admin-muted mb-0">No orders in this period.</p>
                )}
              </section>
            </div>
            <div className="col-lg-4">
              <section className="dash-panel h-100">
                <h2 className="dash-panel__title">Users by role</h2>
                <ul className="admin-list">
                  {stats.usersByRole.map((r) => (
                    <li key={r.role}>
                      <span className="text-capitalize">{r.role}</span>
                      <strong>{r.count}</strong>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>

          {/* Needs attention (right now, not affected by the dates) */}
          <div className="row g-4">
            <div className="col-lg-6">
              <section className="dash-panel h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h2 className="dash-panel__title mb-0">
                    Waiting to be shipped
                  </h2>
                  <span className="admin-badge">
                    {stats.attention.processingCount}
                  </span>
                </div>
                {stats.attention.oldestProcessing.length ? (
                  <>
                    <p className="admin-muted small">
                      The oldest orders first.
                    </p>
                    <ul className="admin-list">
                      {stats.attention.oldestProcessing.map((o) => (
                        <li key={o.o_id}>
                          <Link to={`/admin/orders?search=${o.o_id}`}>
                            Order #{o.o_id}
                          </Link>
                          <span className="admin-muted">
                            {money(o.total_price)} · waiting{" "}
                            {waitingFor(o.created_at)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      className="d-inline-block mt-3 small fw-semibold"
                      to="/admin/orders?status=Processing"
                    >
                      See all processing orders
                    </Link>
                  </>
                ) : (
                  <p className="admin-muted mb-0">Nothing is waiting. Great!</p>
                )}
              </section>
            </div>
            <div className="col-lg-6">
              <section className="dash-panel h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h2 className="dash-panel__title mb-0">Low stock</h2>
                  <span
                    className={`admin-badge ${stats.attention.outOfStock ? "admin-badge--danger" : ""}`}
                  >
                    {stats.attention.outOfStock} out of stock
                  </span>
                </div>
                {stats.attention.lowStockProducts.length ? (
                  <>
                    <p className="admin-muted small">
                      {stats.attention.lowStock} more with 5 or fewer left.
                      Showing the lowest.
                    </p>
                    <ul className="admin-list">
                      {stats.attention.lowStockProducts.map((p) => (
                        <li key={p.p_id}>
                          <span className="name">{p.name}</span>
                          <span
                            className={`admin-badge ${p.quantity === 0 ? "admin-badge--danger" : ""}`}
                          >
                            {p.quantity === 0
                              ? "Out of stock"
                              : `${p.quantity} left`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="admin-muted mb-0">
                    Every product has enough stock.
                  </p>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
