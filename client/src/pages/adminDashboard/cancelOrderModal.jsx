import { useState } from "react";
import Modal from "../modal/modal";
import Button from "../button/button";
import { SERVER_URL } from "../../config";

/**
 * "Cancel this order?" dialog. Used by the customer (history) and the manager.
 * Props
 *  - order        the order to cancel
 *  - onClose      close without cancelling
 *  - onCancelled  called after the server accepted it (the page then updates its list)
 *  - endpoint     path of the request. Default: the customer one, /api/order/:o_id.
 *                 Admin and manager pass `/api/admin/order/${order.o_id}`
 *  - note         optional extra text, e.g. for the manager:
 *                 "The customer is not notified. Tell them yourself: phone ... email ..."
 */
function CancelOrderModal({ order, onClose, onCancelled, endpoint, note }) {
  const [saving, setSaving] = useState(false);

  const handleCancel = async () => {
    setSaving(true);
    try {
      // ===================== BACKEND CONNECTION =====================
      // PATCH <endpoint>  { status: "Cancelled" }  returns { status, message }
      const res = await fetch(`${SERVER_URL}${endpoint ?? `/api/order/${order.o_id}`}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "Cancelled" }),
      });
      const result = await res.json();
      // ===============================================================

      window.toast(result.status, result.message);
      if (res.ok && result.status === "success") onCancelled(order);
    } catch {
      window.toast("error", "Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`Cancel order #${order.o_id}?`}
      onClose={onClose}
      closeDisabled={saving}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Keep order
          </Button>
          <Button variant="danger" onClick={handleCancel} loading={saving}>
            Cancel order
          </Button>
        </>
      }
    >
      <p className={note ? "mb-2" : "mb-0"}>This order will be cancelled. This can't be undone.</p>
      {note && <p className="text-secondary small mb-0">{note}</p>}
    </Modal>
  );
}

export default CancelOrderModal;
