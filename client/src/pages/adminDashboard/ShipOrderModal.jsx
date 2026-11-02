import { useEffect, useState } from "react";
import Modal from "../../components/modal/modal";
import Button from "../../components/button/button";
import { SERVER_URL } from "../../config";

/**
 * Ship an order: choose the courier (an employee), then confirm.
 * Props: order, onClose, onShipped(updatedOrder)
 */
export default function ShipOrderModal({ order, onClose, onShipped }) {
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courierId, setCourierId] = useState("");
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        // ===================== BACKEND CONNECTION =====================
        // GET /api/admin/couriers -> { data: [ { u_id, name, email, active_orders } ] }
        const res = await fetch(`${SERVER_URL}/api/admin/couriers`, { credentials: "include" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Could not load the couriers.");
        // ===============================================================
        if (!cancelled) setCouriers(data.data);
      } catch (err) {
        if (!cancelled) window.toast("error", err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const error = touched && !courierId ? "Choose a courier" : undefined;

  const handleShip = async (e) => {
    e.preventDefault();
    if (saving) return;
    setTouched(true);
    if (!courierId) return;

    setSaving(true);
    try {
      // ===================== BACKEND CONNECTION =====================
      // PATCH /api/admin/order/:o_id { status: "Shipped", courierId } -> { status, message }
      const res = await fetch(`${SERVER_URL}/api/admin/order/${order.o_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "Shipped", courierId }),
      });
      const result = await res.json();
      // ===============================================================

      window.toast(result.status, result.message);
      if (res.ok && result.status === "success") {
        const courier = couriers.find((c) => c.u_id === courierId);
        onShipped({ ...order, status: "Shipped", courier_id: courierId, courier_name: courier?.name });
      }
    } catch {
      window.toast("error", "Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`Ship order #${order.o_id}`}
      onClose={onClose}
      closeDisabled={saving}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="ship-order-form" loading={saving} disabled={loading || couriers.length === 0}>
            Ship order
          </Button>
        </>
      }
    >
      <form id="ship-order-form" onSubmit={handleShip} noValidate>
        {loading ? (
          <p className="text-secondary mb-0">Loading couriers…</p>
        ) : couriers.length === 0 ? (
          <p className="mb-0">
            There are no couriers yet. Give someone the <strong>employee</strong> role in Edit Roles first.
          </p>
        ) : (
          <div className={`dz-field ${error ? "dz-field--error" : ""}`}>
            <label className="dz-field__label" htmlFor="ship-courier">
              Courier<span className="dz-field__star" aria-hidden="true"> *</span>
            </label>
            <select
              id="ship-courier"
              className="form-select"
              value={courierId}
              onChange={(e) => setCourierId(e.target.value)}
              disabled={saving}
              aria-invalid={error ? true : undefined}
            >
              <option value="">Choose a courier…</option>
              {couriers.map((c) => (
                <option key={c.u_id} value={c.u_id}>
                  {c.name} ({c.active_orders} delivering now)
                </option>
              ))}
            </select>
            {error && <p className="dz-field__message dz-field__message--error">{error}</p>}
            <p className="dz-field__message">The courier will deliver this order and mark it as delivered.</p>
          </div>
        )}
      </form>
    </Modal>
  );
}
