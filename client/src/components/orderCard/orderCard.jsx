import { Link } from "react-router-dom";
import { STATUS, statusKey, formatDate, parseLocation } from "./orderUtils";
import "./orderCard.css";

/* ---------- Status pill (also usable on its own, e.g. on the order details page) ---------- */
export function StatusPill({ status }) {
  const key = String(status ?? "").toLowerCase();
  return <span className={`status-pill status-pill--${key || "unknown"}`}>{status}</span>;
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

/**
 * ONE card for every role. The card only SHOWS the order;
 * each page decides which buttons go under it with the `actions` prop.
 *
 * Props
 *  - order          { o_id, created_at, status, total_price, method, phone_number, location,
 *                     customer_name, customer_email, courier_name }   (last three are optional)
 *  - showCustomer   true for admin / manager / delivery: shows customer name and email
 *  - showCourier    true for admin / manager / delivery: shows the courier ("Not assigned" if none)
 *  - actions        any buttons, shown at the bottom of the card
 *  - items          optional list [{ name, quantity }] shown under the progress line (seller page)
 *  - totalLabel     text before the total, default "Total" (the seller page uses "Your items")
 *  - linkable       false = the order number is plain text, not a link to the details page
 *
 * Examples
 *  customer:  <OrderCard order={o} actions={<><Button>Edit order</Button> ...</>} />
 *  manager:   <OrderCard order={o} showCustomer showCourier actions={<Button>Assign courier</Button>} />
 *  delivery:  <OrderCard order={o} showCustomer actions={<Button>Mark as delivered</Button>} />
 */
function OrderCard({
  order,
  showCustomer = false,
  showCourier = false,
  actions,
  items,
  totalLabel = "Total",
  linkable = true,
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
  ]
    .filter(Boolean)
    .filter(([, value]) => value);

  return (
    <article className="order-card">
      <header className="order-card__top">
        <div>
          {linkable ? (
            <Link to={`/history/${order.o_id}`} className="order-card__id">
              Order #{order.o_id}
            </Link>
          ) : (
            <span className="order-card__id">Order #{order.o_id}</span>
          )}
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

      {items?.length > 0 && (
        <ul className="order-card__items" aria-label="Items in this order">
          {items.map((item, i) => (
            <li key={`${item.name}-${i}`}>
              <span>{item.name}</span>
              <span>× {item.quantity}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="order-card__total">
        <span>{totalLabel}</span>
        <strong>${Number(order.total_price).toFixed(2)}</strong>
      </div>

      {rows.length > 0 && (
        <dl className="order-card__details">
          {rows.map(([label, value]) => (
            <div className="order-card__row" key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {actions && <div className="order-card__actions">{actions}</div>}
    </article>
  );
}

export default OrderCard;