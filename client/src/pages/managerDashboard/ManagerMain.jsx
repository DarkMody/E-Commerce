import { useEffect, useState } from "react";
import { SERVER_URL } from "../../config";

const toISO = (d) => d.toISOString().slice(0, 10);

export default function ManagerMain() {
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
        // TODO: change the URL. Return (inside `data`, like your other endpoints):
        // {
        //   ordersCount: number,       // orders created in the range
        //   deliveredCount: number,    // delivered in the range
        //   cancelledCount: number,    // cancelled in the range
        //   pendingShipments: number,  // orders right now in processing/ready (not date-filtered)
        //   delayedOrders: [           // not date-filtered. You decide "delayed" on the
        //     { _id, status, hoursWaiting }  // server, e.g. processing for more than 24h
        //   ]
        // }
        const res = await fetch(
          `${SERVER_URL}/api/manager/stats?start=${start}&end=${end}`,
          { credentials: "include" },
        );
        if (!res.ok) throw new Error("Could not load statistics.");
        const data = await res.json();
        setStats(data.data);
      } catch (err) {
        window.toast("error", err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [start, end, invalidRange]);

  const cards = stats && [
    ["Orders", stats.ordersCount],
    ["Delivered", stats.deliveredCount],
    ["Cancelled", stats.cancelledCount],
    ["Waiting to ship", stats.pendingShipments],
  ];

  return (
    <>
      <h1 className="manager-title">Main</h1>

      {/* <div className="manager-panel d-flex flex-wrap gap-3 align-items-end mb-4">
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
      )} */}
      {loading && !invalidRange && (
        <div className="spinner-border" role="status"></div>
      )}

      {stats && !loading && !invalidRange && (
        <>
          <div className="stat-grid">
            {cards.map(([label, value]) => (
              <div className="stat-card" key={label}>
                <p className="stat-card__label">{label}</p>
                <p className="stat-card__value">{value}</p>
              </div>
            ))}
          </div>

          <h2 className="h5 fw-bold mt-4 mb-3">Delayed orders</h2>
          <div className="manager-panel">
            {stats.delayedOrders?.length ? (
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Status</th>
                      <th>Waiting</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.delayedOrders.map((o) => (
                      <tr key={o._id}>
                        <td>#{o._id}</td>
                        <td className="text-capitalize">
                          {String(o.status).replace(/_/g, " ")}
                        </td>
                        <td className="text-danger fw-semibold">
                          {o.hoursWaiting}h
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-secondary mb-0">No delayed orders. 🎉</p>
            )}
          </div>
        </>
      )}
    </>
  );
}
