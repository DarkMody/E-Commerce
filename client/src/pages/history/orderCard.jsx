import "./history.css";
import { SERVER_URL } from "../../config";
import { Link, useNavigate } from "react-router-dom";

const STATUS_CLASS = {
  processing: "status-yellow",
  shipped: "status-blue",
  delivered: "status-green",
  cancelled: "status-red",
};

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

export default function OrderCard({ order, onEdit }) {
  const statusKey = String(order.status).toLowerCase();
  const cancelOrder = async (order) => {
    if (window.confirm("You want to cancel order ?")) {
      try {
        const body = { status: "Cancelled" };
        const res = await fetch(`${SERVER_URL}/api/order/${order.o_id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Could not update the order.");
        const updated = await res.json();
        window.toast(updated.status, updated.message);
      } catch (err) {
        window.toast("error", err.message);
      }
    }
  };
  return (
    <div className="order-card">
      <div className="order-card__top">
        <div>
          <Link
            to={`/history/${order.o_id}`}
            className="order-card__label order-id"
          >
            Order ID: {order.o_id}
          </Link>
          <p className="order-card__value">{formatDate(order.created_at)}</p>
        </div>
        <span
          className={`status-pill ${STATUS_CLASS[statusKey] || "status-grey"}`}
        >
          {order.status}
        </span>
      </div>

      <div className="order-card__row">
        <span className="order-card__label">Total price</span>
        <span className="order-card__value">
          ${Number(order.total_price).toFixed(2)}
        </span>
      </div>
      <div className="order-card__row">
        <span className="order-card__label">Payment method</span>
        <span className="order-card__value">{order.method}</span>
      </div>

      {onEdit && (
        <div className="d-flex jusify-content-center gap-1">
          <button className="btn-dark-zon w-100" onClick={() => onEdit(order)}>
            Edit order
          </button>
          {statusKey == "processing" && (
            <button
              className="btn status-red  w-100"
              onClick={() => cancelOrder(order)}
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}
