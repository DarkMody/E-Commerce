import { useState } from "react";
import Modal from "../../components/modal/modal";
import Button from "../../components/button/button";
import Input from "../../components/input/input";
import AddressPicker from "../../components/addressPicker/addressPicker";
import {
  statusKey,
  parseLocation,
  canCustomerEdit,
  STATUS,
} from "../../components/orderCard/orderUtils";
import { SERVER_URL } from "../../config";

export default function OrderEditModal({ order, onClose, onSaved }) {
  const key = statusKey(order);
  const canEditLocation = key === STATUS.PROCESSING;
  const canEditPhone = canCustomerEdit(key);

  const [phone, setPhone] = useState(order.phone_number || "");
  const [location, setLocation] = useState(parseLocation(order.location));
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const phoneError =
    touched && canEditPhone && !phone.trim()
      ? "Phone number is required"
      : undefined;

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;
    setTouched(true);
    if (!phone.trim()) return;
    if (canEditLocation && !location) {
      window.toast("error", "Location is required.");
      return;
    }

    setSaving(true);
    try {
      const body = canEditLocation
        ? { phoneNumber: phone.trim(), location }
        : { phoneNumber: phone.trim() };

      const res = await fetch(`${SERVER_URL}/api/order/${order.o_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const result = await res.json();

      window.toast(result.status, result.message);
      if (result.status === "success") {
        onSaved({
          ...order,
          phone_number: phone.trim(),
          ...(canEditLocation && { location: JSON.stringify(location) }),
        });
      }
    } catch {
      window.toast("error", "Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`Edit order #${order.o_id}`}
      onClose={onClose}
      closeDisabled={saving}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="edit-order-form" loading={saving}>
            Save changes
          </Button>
        </>
      }
    >
      <form
        id="edit-order-form"
        className="d-flex flex-column gap-4"
        onSubmit={handleSave}
        noValidate
      >
        <Input
          label="Phone number"
          type="tel"
          name="phone"
          autoComplete="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onBlur={() => setTouched(true)}
          error={phoneError}
          required
          disabled={!canEditPhone || saving}
        />

        <div>
          <p className="dz-field__label mb-2">Location</p>
          {canEditLocation && (
            <AddressPicker onSelect={setLocation} def={location} />
          )}
          <div className={`order-location ${location ? "" : "is-empty"}`}>
            {location?.formattedAddress || "No location picked yet"}
          </div>
          {!canEditLocation && (
            <p className="dz-field__message">
              The location can't be changed once the order has left processing.
            </p>
          )}
        </div>
      </form>
    </Modal>
  );
}
