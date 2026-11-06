import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Input from "../../components/input/input";
import Button from "../../components/button/button";
import { StatusPill } from "../../components/orderCard/orderCard";
import { formatWaiting } from "../../components/orderCard/orderUtils";
import {
  StatGridSkeleton,
  ChartSkeleton,
  Skeleton,
} from "../../components/loading";
import { SERVER_URL } from "../../config";
import "../adminDashboard/adminMain.css"; // shared list / badge / status styles
import "./managerDashboard.css";

const toISO = (d) => d.toISOString().slice(0, 10); // "YYYY-MM-DD"
const dayLabel = (day) =>
  new Date(`${day}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
const deliveryTime = (hours) =>
  !hours
    ? "—"
    : hours < 48
      ? `${hours.toFixed(1)}h`
      : `${(hours / 24).toFixed(1)} days`;
const STATUS_ORDER = ["Processing", "Shipped", "Delivered", "Cancelled"];

export default function ManagerMain() {
  // Default range: last 7 days
  const [start, setStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return toISO(d);
  });
  const [end, setEnd] = useState(() => toISO(new Date()));
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

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
        // GET /api/manager/stats?start=&end=  -> getStats in managerController.js
        const res = await fetch(
          `${SERVER_URL}/api/manager/stats?start=${start}&end=${end}`,
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

  const a = stats?.attention;
  const rules = stats?.delayRules;

  return (
    <>
      <h1 className="dash-title">Main</h1>

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

      {loading && !stats && (
        <div className="d-flex flex-column gap-4">
          <StatGridSkeleton count={4} />
          <div className="row g-4">
            {[0, 1, 2, 3].map((i) => (
              <div className="col-lg-6" key={i}>
                <div className="dash-panel">
                  <Skeleton height="8rem" />
                </div>
              </div>
            ))}
          </div>
          <div className="dash-panel">
            <ChartSkeleton height={240} />
          </div>
        </div>
      )}

      {stats && (
        <div className="d-flex flex-column gap-5">
          {/* ================= Needs attention (right now) ================= */}
          <section aria-labelledby="attention-title">
            <h2 id="attention-title" className="h5 fw-bold mb-3">
              Needs attention
            </h2>

            <div className="stat-grid mb-4">
              <div className="stat-card">
                <p className="stat-card__label">Waiting to ship</p>
                <p className="stat-card__value">{a.processingCount}</p>
                <p
                  className={`small mb-0 mt-1 ${a.delayedProcessing ? "text-danger fw-semibold" : "admin-muted"}`}
                >
                  {a.delayedProcessing} delayed (over {rules.processingHours}h)
                </p>
              </div>
              <div className="stat-card">
                <p className="stat-card__label">Out for delivery</p>
                <p className="stat-card__value">{a.shippedCount}</p>
                <p
                  className={`small mb-0 mt-1 ${a.delayedShipped ? "text-danger fw-semibold" : "admin-muted"}`}
                >
                  {a.delayedShipped} delayed (over{" "}
                  {Math.round(rules.shippedHours / 24)} days)
                </p>
              </div>
              <div className="stat-card">
                <p className="stat-card__label">Out of stock</p>
                <p className="stat-card__value">{a.outOfStock}</p>
                <p className="small mb-0 mt-1 admin-muted">
                  {a.lowStock} more almost out
                </p>
              </div>
            </div>

            <div className="row g-4">
              <div className="col-lg-6">
                <section className="dash-panel h-100">
                  <h3 className="dash-panel__title">
                    Oldest orders waiting to ship
                  </h3>
                  {a.oldestProcessing.length ? (
                    <ul className="admin-list">
                      {a.oldestProcessing.map((o) => (
                        <li key={o.o_id}>
                          <Link to={`/manager/orders?search=${o.o_id}`}>
                            Order #{o.o_id}
                          </Link>
                          <span
                            className={`admin-badge ${o.hours_waiting >= rules.processingHours ? "admin-badge--danger" : ""}`}
                          >
                            waiting {formatWaiting(o.hours_waiting)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="admin-muted mb-0">
                      Nothing is waiting. Great!
                    </p>
                  )}
                  {a.processingCount > 0 && (
                    <Link
                      className="d-inline-block mt-3 small fw-semibold"
                      to="/manager/orders?status=Processing"
                    >
                      See all processing orders
                    </Link>
                  )}
                </section>
              </div>

              <div className="col-lg-6">
                <section className="dash-panel h-100">
                  <h3 className="dash-panel__title">
                    Out for delivery the longest
                  </h3>
                  {a.longestShipped.length ? (
                    <ul className="admin-list">
                      {a.longestShipped.map((o) => (
                        <li key={o.o_id}>
                          <span className="name">
                            <Link to={`/manager/orders?search=${o.o_id}`}>
                              Order #{o.o_id}
                            </Link>
                            <span className="admin-muted">
                              {" "}
                              · {o.courier_name || "no courier"}
                            </span>
                          </span>
                          <span
                            className={`admin-badge ${o.hours_out >= rules.shippedHours ? "admin-badge--danger" : ""}`}
                          >
                            out {formatWaiting(o.hours_out)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="admin-muted mb-0">
                      No orders are out for delivery.
                    </p>
                  )}
                </section>
              </div>

              <div className="col-lg-6">
                <section className="dash-panel h-100">
                  <h3 className="dash-panel__title">Couriers right now</h3>
                  {a.couriers.length ? (
                    <>
                      <ul className="admin-list">
                        {a.couriers.map((c) => (
                          <li key={c.u_id}>
                            <span className="name">{c.name}</span>
                            <strong>{c.active_orders} delivering</strong>
                          </li>
                        ))}
                      </ul>
                      <Link
                        className="d-inline-block mt-3 small fw-semibold"
                        to="/manager/couriers"
                      >
                        See all couriers
                      </Link>
                    </>
                  ) : (
                    <p className="admin-muted mb-0">
                      No couriers yet. An admin can give someone the employee
                      role.
                    </p>
                  )}
                </section>
              </div>

              <div className="col-lg-6">
                <section className="dash-panel h-100">
                  <h3 className="dash-panel__title">Low stock</h3>
                  {a.lowStockProducts.length ? (
                    <ul className="admin-list">
                      {a.lowStockProducts.map((p) => (
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
                  ) : (
                    <p className="admin-muted mb-0">
                      Every product has enough stock.
                    </p>
                  )}
                </section>
              </div>
            </div>
          </section>

          {/* ================= Activity (date range) ================= */}
          <section
            aria-labelledby="activity-title"
            className={loading ? "is-refreshing" : ""}
            aria-busy={loading}
          >
            <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-3">
              <h2 id="activity-title" className="h5 fw-bold mb-0">
                Activity
              </h2>
              <div className="d-flex flex-wrap gap-4">
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
            </div>

            {invalidRange && (
              <div className="alert alert-warning">
                The start date must be before the end date.
              </div>
            )}

            {!invalidRange && (
              <div className="d-flex flex-column gap-4">
                <div className="stat-grid">
                  {[
                    ["Orders placed", stats.ordersCount],
                    ["Delivered", stats.deliveredCount],
                    ["Cancelled", stats.cancelledCount],
                    ["Cancellation rate", `${stats.cancellationRate}%`],
                    [
                      "Average delivery time",
                      deliveryTime(stats.averageDeliveryHours),
                    ],
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

                <div className="dash-panel">
                  <h3 className="dash-panel__title">
                    Orders placed and delivered per day
                  </h3>
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
                        tick={{ fill: "var(--dz-muted)", fontSize: 12 }}
                        stroke="var(--dz-border)"
                      />
                      <Tooltip
                        labelFormatter={dayLabel}
                        cursor={{ fill: "var(--dz-surface-2)" }}
                        contentStyle={{
                          background: "var(--dz-surface)",
                          border: "1px solid var(--dz-border)",
                          borderRadius: 10,
                          color: "var(--dz-text)",
                        }}
                      />
                      <Legend wrapperStyle={{ color: "var(--dz-muted)" }} />
                      <Bar
                        dataKey="placed"
                        name="Placed"
                        fill="var(--dz-primary)"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="delivered"
                        name="Delivered"
                        fill="var(--dz-hover)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
