import { useEffect, useState } from "react";
import Nav from "../../components/nav/nav";
import Footer from "../../components/footer/footer";
import Button from "../../components/button/button";
import Modal from "../../components/modal/modal";
import Pagination from "../../components/pagination/Pagination";
import OrderCard from "../../components/orderCard/orderCard";
import { parseLocation } from "../../components/orderCard/orderUtils";
import { OrderGridSkeleton, useDelayedLoading } from "../../components/loading";
import { SERVER_URL } from "../../config";
import "./delivery.css";

// [status sent to the server, tab text, text when the tab is empty]
const TABS = [
  ["Shipped", "To deliver", "You have no orders to deliver right now."],
  ["Delivered", "Delivered", "You haven't delivered any order yet."],
  ["Cancelled", "Rejected", "No rejected orders."],
];

/* ---------- Confirm: delivered / rejected ---------- */
function DeliveryActionModal({ order, action, onClose, onDone }) {
  const deliver = action === "deliver";
  const cash = String(order.method).toLowerCase() === "cash";
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const res = await fetch(
        `${SERVER_URL}/api/delivery/order/${order.o_id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: deliver ? "Delivered" : "Cancelled" }),
        },
      );
      const result = await res.json();

      window.toast(result.status, result.message);
      if (res.ok && result.status === "success") onDone(order);
    } catch {
      window.toast("error", "Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={
        deliver
          ? `Delivered order #${order.o_id}?`
          : `Reject order #${order.o_id}?`
      }
      onClose={onClose}
      closeDisabled={saving}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {deliver ? "Not yet" : "Go back"}
          </Button>
          <Button
            variant={deliver ? "primary" : "danger"}
            onClick={handleConfirm}
            loading={saving}
          >
            {deliver ? "Yes, delivered" : "Reject order"}
          </Button>
        </>
      }
    >
      {deliver ? (
        <>
          <p className={cash ? "mb-2" : "mb-0"}>
            Confirm that {order.customer_name} received the order.
          </p>
          {cash && (
            <p className="fw-semibold mb-0">
              Make sure you collected ${Number(order.total_price).toFixed(2)} in
              cash.
            </p>
          )}
        </>
      ) : (
        <p className="mb-0">
          The customer didn't accept the order. It will be cancelled and the
          products go back to the stock. This can't be undone.
        </p>
      )}
    </Modal>
  );
}

export default function Delivery() {
  const [tab, setTab] = useState("Shipped");
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState([]);
  const [counts, setCounts] = useState({
    Shipped: 0,
    Delivered: 0,
    Cancelled: 0,
  });
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [acting, setActing] = useState(null); // { order, action: "deliver" | "reject" }
  const showSkeleton = useDelayedLoading(loading);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        // ===================== BACKEND CONNECTION =====================
        // GET /api/delivery/orders?status=&page= -> getMyOrders in deliveryController.js
        // { data: [ { o_id, status, total_price, method, phone_number, location,
        //             customer_name, items: [ { name, quantity } ] } ],
        //   counts: { Shipped, Delivered, Cancelled }, pagination: { totalPages } }
        const res = await fetch(
          `${SERVER_URL}/api/delivery/orders?status=${tab}&page=${page}`,
          {
            credentials: "include",
          },
        );
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.message || "Could not load your orders.");
        // ===============================================================
        if (!cancelled) {
          setOrders(data.data);
          setCounts(data.counts);
          setTotalPages(data.pagination.totalPages);
        }
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
  }, [tab, page, reloadKey]);

  const changeTab = (status) => {
    setTab(status);
    setPage(1);
  };

  // After delivered / rejected: the order leaves this tab, then we load again for fresh numbers
  const handleDone = (order) => {
    setOrders((prev) => prev.filter((o) => o.o_id !== order.o_id));
    setActing(null);
    if (orders.length === 1 && page > 1) setPage(page - 1);
    else setReloadKey((k) => k + 1);
  };

  const emptyText = TABS.find(([status]) => status === tab)[2];

  return (
    <>
      <Nav />
      <main className="delivery-page container py-4 py-lg-5">
        <h1 className="delivery-title mb-4">My deliveries</h1>

        <div
          className="dash-tabs mb-4"
          role="group"
          aria-label="Filter my orders"
        >
          {TABS.map(([status, label]) => (
            <button
              type="button"
              key={status}
              className="dash-tab"
              aria-pressed={tab === status}
              onClick={() => changeTab(status)}
            >
              {label} ({counts[status]})
            </button>
          ))}
        </div>

        {loading && showSkeleton && <OrderGridSkeleton count={4} />}

        {error && !loading && (
          <div
            className="alert alert-danger d-flex flex-wrap justify-content-between align-items-center gap-2"
            role="alert"
          >
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReloadKey((k) => k + 1)}
            >
              Try again
            </Button>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <p className="text-secondary">{emptyText}</p>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="order-grid">
            {orders.map((order) => {
              const address = order.location
                ? `${parseLocation(order.location).lat},${parseLocation(order.location).lng}`
                : "";
              console.log(address);
              const cash = String(order.method).toLowerCase() === "cash";
              return (
                <OrderCard
                  key={order.o_id}
                  order={order}
                  showCustomer
                  linkable={false}
                  items={order.items}
                  totalLabel={cash ? "Cash to collect" : "Total (paid online)"}
                  actions={
                    tab === "Shipped" ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() =>
                            setActing({ order, action: "deliver" })
                          }
                        >
                          Delivered
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="order-action--danger"
                          onClick={() => setActing({ order, action: "reject" })}
                        >
                          Rejected
                        </Button>
                        <div className="delivery-links">
                          {order.phone_number && (
                            <a
                              className="btn btn-ghost btn-sm rounded-pill"
                              href={`tel:${order.phone_number}`}
                            >
                              Call customer
                            </a>
                          )}
                          {address && (
                            <a
                              className="btn btn-ghost btn-sm rounded-pill"
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Open map
                              <span className="visually-hidden">
                                {" "}
                                (opens in a new tab)
                              </span>
                            </a>
                          )}
                        </div>
                      </>
                    ) : undefined
                  }
                />
              );
            })}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </main>

      {acting && (
        <DeliveryActionModal
          order={acting.order}
          action={acting.action}
          onClose={() => setActing(null)}
          onDone={handleDone}
        />
      )}
      <Footer />
    </>
  );
}
