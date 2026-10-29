import { useEffect, useState } from "react";
import { SERVER_URL } from "../../config";

// What the manager can do from each status.
// processing -> ready -> (assign courier) out_for_delivery -> delivered
const NEXT = {
  processing: { status: "ready", label: "Mark as ready" },
  ready: {
    status: "out_for_delivery",
    label: "Assign & ship",
    needsCourier: true,
  },
  out_for_delivery: { status: "delivered", label: "Mark as delivered" },
};

export default function ManagerOrderModal({ order, onClose, onDone }) {
  const [couriers, setCouriers] = useState([]);
  const [courierId, setCourierId] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const next = NEXT[order.status];
  const canCancel =
    order.status !== "delivered" && order.status !== "cancelled";

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Load couriers only when we need to pick one.
  useEffect(() => {
    if (!next?.needsCourier) return;
    const load = async () => {
      try {
        // ===================== BACKEND CONNECTION =====================
        // TODO: change the URL. Return users with the "delivery" role:
        // { data: [ { u_id, name, activeOrders } ] }
        const res = await fetch(`${SERVER_URL}/api/manager/couriers`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Could not load couriers.");
        const data = await res.json();
        setCouriers(data.data);
        // ===============================================================
      } catch (err) {
        window.toast("error", err.message);
      }
    };
    load();
  }, [next]);

  const send = async (body, extra) => {
    setSaving(true);
    try {
      // ===================== BACKEND CONNECTION =====================
      // TODO: change the URL. Body is one of:
      //   { status: "ready" }
      //   { status: "out_for_delivery", courierId }
      //   { status: "delivered" }
      //   { status: "cancelled", reason }
      // The server must check the allowed transition + that the user is a manager.
      // On "cancelled" it should also return the items to stock.
      // After saving, emit your Socket.IO "order:updated" event here (server side).
      const res = await fetch(
        `${SERVER_URL}/api/manager/orders/${order.o_id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) throw new Error("Could not update the order.");
      const result = await res.json();
      window.toast(result.status, result.message);
      // ===============================================================
      onDone({
        ...order,
        status: body.status,
        ...extra,
        ...(result.data || {}),
      });
    } catch (err) {
      window.toast("error", err.message);
    } finally {
      setSaving(false);
    }
  };

  const advance = () => {
    if (next.needsCourier) {
      if (!courierId) return window.toast("error", "Choose a courier first.");
      const c = couriers.find((x) => String(x.u_id) === String(courierId));
      return send({ status: next.status, courierId }, { courierName: c?.name });
    }
    send({ status: next.status });
  };

  const cancel = () => {
    if (!reason.trim()) return window.toast("error", "Please write a reason.");
    send({ status: "cancelled", reason: reason.trim() });
  };

  const rows = [
    ["Order", `#${order.o_id}`],
    ["Status", String(order.status).replace(/_/g, " ")],
    ["Phone", order.phone_number],
    ["Location", order.location],
    ["Payment", order.method],
    ["Total", `$${Number(order.total_price).toFixed(2)}`],
    ["Courier", order.courierName || "Not assigned"],
  ];

  return (
    <>
      <div className="modal-backdrop show"></div>
      <div
        className="modal d-block"
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
        onClick={onClose}
      >
        <div
          className="modal-dialog modal-dialog-centered modal-dialog-scrollable"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Manage order</h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={onClose}
              ></button>
            </div>

            <div className="modal-body">
              {rows.map(([k, v]) => (
                <div className="manager-detail" key={k}>
                  <span>{k}</span>
                  <span className="text-capitalize">{v}</span>
                </div>
              ))}

              {order.items?.length > 0 && (
                <div className="mt-3">
                  <p className="fw-bold mb-1">Items</p>
                  <ul className="mb-0">
                    {order.items.map((it, i) => (
                      <li key={i}>
                        {it.name} × {it.quantity}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {next?.needsCourier && !cancelling && (
                <div className="mt-4">
                  <label htmlFor="courier" className="form-label fw-bold">
                    Courier
                  </label>
                  <select
                    id="courier"
                    className="form-select"
                    value={courierId}
                    onChange={(e) => setCourierId(e.target.value)}
                  >
                    <option value="">Choose a courier…</option>
                    {couriers.map((c) => (
                      <option key={c.u_id} value={c.u_id}>
                        {c.name} ({c.activeOrders} active)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {cancelling && (
                <div className="mt-4">
                  <label htmlFor="reason" className="form-label fw-bold">
                    Reason for cancelling
                  </label>
                  <textarea
                    id="reason"
                    className="form-control"
                    rows="3"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="modal-footer">
              {canCancel && !cancelling && (
                <button
                  className="btn btn-outline-danger me-auto"
                  onClick={() => setCancelling(true)}
                  disabled={saving}
                >
                  Cancel order
                </button>
              )}
              {cancelling ? (
                <>
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => setCancelling(false)}
                    disabled={saving}
                  >
                    Back
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={cancel}
                    disabled={saving}
                  >
                    {saving ? (
                      <span className="spinner-border spinner-border-sm"></span>
                    ) : (
                      "Confirm cancel"
                    )}
                  </button>
                </>
              ) : (
                next && (
                  <button
                    className="btn btn-dark-zon"
                    onClick={advance}
                    disabled={saving}
                  >
                    {saving ? (
                      <span className="spinner-border spinner-border-sm"></span>
                    ) : (
                      next.label
                    )}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
