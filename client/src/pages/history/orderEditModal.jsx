import { useEffect, useState } from "react";
import { SERVER_URL } from "../../config";
import AddressPicker from "../../components/addressPicker/addressPicker";

export default function OrderEditModal({ order, onClose, onSaved }) {
  const [phone, setPhone] = useState(order.phone_number || "");
  const [location, setLocation] = useState(JSON.parse(order.location) || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const canEditLocation = String(order.status).toLowerCase() === "processing";
  const canEditPhone =
    String(order.status).toLowerCase() === "processing" ||
    String(order.status).toLowerCase === "shipped";

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!phone.trim()) return setError("Phone number is required.");
    if (canEditLocation && !location)
      return window.toast("error", "Location is required.");

    setSaving(true);
    try {
      const body = canEditLocation ? { phone, location } : { phone };
      const res = await fetch(`${SERVER_URL}/api/order/${order.o_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const updated = await res.json();
      window.toast(updated.status, updated.message);
    } finally {
      setSaving(false);
    }
  };

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
          className="modal-dialog modal-dialog-centered"
          onClick={(e) => e.stopPropagation()}
        >
          <form className="modal-content" onSubmit={handleSave}>
            <div className="modal-header">
              <h5 className="modal-title">Edit order</h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={onClose}
              ></button>
            </div>

            <div className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}

              <div className="mb-3">
                <label htmlFor="order-phone" className="form-label">
                  Phone number
                </label>
                <input
                  id="order-phone"
                  type="tel"
                  className="form-control"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!canEditPhone}
                />
              </div>

              <div>
                <label htmlFor="order-location" className="form-label">
                  Location
                </label>
                {canEditLocation && (
                  <AddressPicker onSelect={setLocation} def={location} />
                )}
                <div className={`co-selected ${location ? "" : "is-empty"}`}>
                  {location
                    ? location.formattedAddress
                    : "No location picked yet"}
                </div>
                {!canEditLocation && (
                  <div className="form-text">
                    The location can't be changed once the order has left
                    processing.
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-dark-zon"
                disabled={saving}
              >
                {saving ? (
                  <span className="spinner-border spinner-border-sm"></span>
                ) : (
                  "Save changes"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
