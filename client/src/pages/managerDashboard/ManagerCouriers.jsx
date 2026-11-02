import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../components/button/button";
import { Skeleton } from "../../components/loading";
import { parseLocation, formatWaiting } from "../../components/orderCard/orderUtils";
import { SERVER_URL } from "../../config";
import "../adminDashboard/adminMain.css"; // shared badge / muted styles
import "./managerDashboard.css";

/** Read only: every courier (employee) and the orders they are delivering now. */
export default function ManagerCouriers() {
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        // ===================== BACKEND CONNECTION =====================
        // GET /api/manager/couriers -> getCouriers in managerController.js
        // { data: [ { u_id, name, email, delivered_today, active_orders,
        //             orders: [ { o_id, customer_name, phone_number, location, hours_out } ] } ] }
        const res = await fetch(`${SERVER_URL}/api/manager/couriers`, { credentials: "include" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Could not load the couriers.");
        // ===============================================================
        if (!cancelled) setCouriers(data.data);
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
  }, [reloadKey]);

  return (
    <>
      <h1 className="dash-title">Couriers</h1>

      {error && (
        <div className="alert alert-danger d-flex flex-wrap justify-content-between align-items-center gap-2" role="alert">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={() => setReloadKey((k) => k + 1)}>Try again</Button>
        </div>
      )}

      {loading && (
        <div className="row g-4" role="status" aria-busy="true">
          <span className="visually-hidden">Loading couriers…</span>
          {[0, 1, 2].map((i) => (
            <div className="col-md-6 col-xl-4" key={i}>
              <div className="courier-card">
                <Skeleton width="60%" height="1.3rem" />
                <Skeleton height="1rem" />
                <Skeleton height="4rem" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && couriers.length === 0 && (
        <p className="text-secondary">
          There are no couriers yet. An admin can give someone the <strong>employee</strong> role in Edit Roles.
        </p>
      )}

      {!loading && !error && couriers.length > 0 && (
        <div className="row g-4">
          {couriers.map((c) => (
            <div className="col-md-6 col-xl-4" key={c.u_id}>
              <article className="courier-card">
                <header>
                  <h2 className="h5 fw-bold mb-0">{c.name}</h2>
                  <p className="admin-muted small mb-0 text-break">{c.email}</p>
                </header>

                <div className="d-flex flex-wrap gap-2">
                  <span className={`admin-badge ${c.active_orders ? "" : "admin-muted"}`}>
                    {c.active_orders} delivering now
                  </span>
                  <span className="admin-badge">{c.delivered_today} delivered today</span>
                </div>

                {c.orders.length ? (
                  <ul className="courier-card__orders">
                    {c.orders.map((o) => (
                      <li className="courier-card__order" key={o.o_id}>
                        <div className="d-flex justify-content-between gap-2">
                          <Link to={`/manager/orders?search=${o.o_id}`}>Order #{o.o_id}</Link>
                          <span className="admin-muted">out {formatWaiting(o.hours_out)}</span>
                        </div>
                        <p>{o.customer_name} · {o.phone_number}</p>
                        <p>{parseLocation(o.location)?.formattedAddress}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="admin-muted small mb-0">No orders on the way.</p>
                )}
              </article>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
