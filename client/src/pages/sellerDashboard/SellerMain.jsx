import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { SERVER_URL } from "../../config";

const toISO = (d) => d.toISOString().slice(0, 10); // "YYYY-MM-DD"
const money = (n) => `$${Number(n || 0).toFixed(2)}`;
const COLORS = [
  "#000000",
  "#38d638",
  "#ffc40c",
  "#3b82f6",
  "#ff4d4d",
  "#8b5cf6",
];

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

  const invalidRange = start > end;

  useEffect(() => {
    if (invalidRange) return;
    const load = async () => {
      setLoading(true);
      try {
        // ===================== BACKEND CONNECTION =====================
        // TODO: change the URL to your real endpoint. It must only count
        // THIS seller's products (use the logged-in user on the server),
        // between start and end (inclusive, in days), and return:
        // {
        //   salesTotal: number,      // total money from this seller's products
        //   productsSold: number,    // total units sold
        //   products: [ { name: string, sales: number }, ... ] // sales per product
        // }
        const res = await fetch(
          `${SERVER_URL}/api/seller/stats?start=${start}&end=${end}`,
          { credentials: "include" },
        );
        if (!res.ok) throw new Error("Could not load statistics.");
        const data = await res.json();
        console.log(data);
        setStats(data.data);
        // ===============================================================
      } catch (err) {
        window.toast("error", err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [start, end, invalidRange]);

  // const chartData = (stats?.products || []).map((p) => ({
  //   ...p,
  //   sales: Number(p.sales),
  // }));

  return (
    <>
      <h1 className="seller-title">Main</h1>

      <div className="seller-panel d-flex flex-wrap gap-3 align-items-end mb-4">
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
      {loading && !invalidRange && (
        <div className="spinner-border" role="status"></div>
      )}

      {stats && !loading && !invalidRange && (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <p className="stat-card__label">Sales</p>
              <p className="stat-card__value">{money(stats.salesTotal)}</p>
            </div>
            <div className="stat-card">
              <p className="stat-card__label">Products sold</p>
              <p className="stat-card__value">{stats.productsSold || 0}</p>
            </div>
          </div>

          <div className="seller-panel seller-chart">
            <h2>Sales per product</h2>
            {stats.products?.length ? (
              <ResponsiveContainer width="100%" height="90%">
                <BarChart
                  data={stats.products}
                  margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickFormatter={(v) =>
                      v.length > 12 ? `${v.slice(0, 12)}…` : v
                    }
                  />
                  <YAxis tickFormatter={(v) => `${v}`} />
                  <Tooltip
                    formatter={(v) => [v, "Sales"]}
                    cursor={{ fill: "#f0f0f0" }}
                  />
                  <Bar dataKey="sales" radius={[6, 6, 0, 0]}>
                    {stats.products.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>{" "}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="seller-chart__empty">No sales in this period.</p>
            )}
          </div>
        </>
      )}
    </>
  );
}
