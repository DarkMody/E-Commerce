import { Link } from "react-router-dom";
import { STATUS, statusKey, formatDate, parseLocation } from "./orderUtils";
import "./orderCard.css";

/* ---------- Status pill (also usable on its own, e.g. on the order details page) ---------- */
export function StatusPill({ status }) {
  const key = String(status ?? "").toLowerCase();
  return (
    <span className={`status-pill status-pill--${key || "unknown"}`}>
      {status}
    </span>
  );
}

/* ---------- Progress: Processing -> Shipped -> Delivered ---------- */
const STEPS = [
  { key: STATUS.PROCESSING, label: "Processing" },
  { key: STATUS.SHIPPED, label: "Shipped" },
  { key: STATUS.DELIVERED, label: "Delivered" },
];

function OrderProgress({ currentKey }) {
  const current = STEPS.findIndex((s) => s.key === currentKey);
  return (
    <ol className="order-progress" aria-label="Order progress">
      {STEPS.map((step, i) => (
        <li
          key={step.key}
          className={`order-progress__step ${i <= current ? "is-done" : ""} ${i === current ? "is-current" : ""}`}
          aria-current={i === current ? "step" : undefined}
        >
          <span className="order-progress__dot" aria-hidden="true"></span>
          <span className="order-progress__label">{step.label}</span>
        </li>
      ))}
    </ol>
  );
}

function OrderCard({
  order,
  showCustomer = false,
  showCourier = false,
  actions,
}) {
  const key = statusKey(order);
  const cancelled = key === STATUS.CANCELLED;
  const address = parseLocation(order.location)?.formattedAddress;

  const rows = [
    ["Payment", order.method],
    ["Deliver to", address],
    ["Phone", order.phone_number],
    showCustomer && ["Customer", order.customer_name],
    showCustomer && ["Email", order.customer_email],
    showCourier && ["Courier", order.courier_name || "Not assigned"],
    ["Shipped at", formatDate(order.shipped_at) || "Not assigned"],
    ["Delivered at", formatDate(order.delivered_at) || "Not assigned"],
    ["Cancelled at", formatDate(order.cancelled_at) || "Not assigned"],
  ]
    .filter(Boolean)
    .filter(([, value]) => value);

  return (
    <article className="order-card">
      <header className="order-card__top">
        <div>
          <Link to={`/history/${order.o_id}`} className="order-card__id">
            Order #{order.o_id}
          </Link>
          <p className="order-card__date">{formatDate(order.created_at)}</p>
        </div>
        <StatusPill status={order.status} />
      </header>

      {cancelled ? (
        <p className="order-card__cancelled" role="status">
          This order was cancelled.
        </p>
      ) : (
        <OrderProgress currentKey={key} />
      )}

      <div className="order-card__total">
        <span>Total</span>
        <strong>${Number(order.total_price).toFixed(2)}</strong>
      </div>

      <dl className="order-card__details">
        {rows.map(([label, value]) => (
          <div className="order-card__row" key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      {actions && <div className="order-card__actions">{actions}</div>}
    </article>
  );
}

export default OrderCard;
