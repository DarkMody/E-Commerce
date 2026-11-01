import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Nav from "../../components/nav/nav";
import Footer from "../../components/footer/footer";
import Button from "../../components/button/button";
import OrderCard from "../../components/orderCard/orderCard";
import CancelOrderModal from "../../components/orderCard/cancelOrderModal";
import { statusKey, canCustomerEdit, canCancel } from "../../components/orderCard/orderUtils";
import { OrderGridSkeleton, useDelayedLoading } from "../../components/loading";
import OrderEditModal from "./orderEditModal";
import { SERVER_URL } from "../../config";
import "./history.css";

export default function History() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [editing, setEditing] = useState(null); // order in the edit dialog
  const [cancelling, setCancelling] = useState(null); // order in the cancel dialog
  const showSkeleton = useDelayedLoading(loading);

  useEffect(() => {
    let cancelled = false;

    const loadOrders = async () => {
      setLoading(true);
      setError("");
      try {
        // ===================== BACKEND CONNECTION =====================
        // GET /api/user/order returns { data: [ { o_id, created_at, status, total_price,
        //   method, phone_number, location } ] } for the logged-in user
        const res = await fetch(`${SERVER_URL}/api/user/order`, { credentials: "include" });
        if (!res.ok) throw new Error("Could not load your orders.");
        const data = await res.json();
        // ===============================================================
        if (!cancelled) setOrders(data.data || []);
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load your orders.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadOrders();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // Replace one order in the list without loading everything again
  const updateOrder = (updated) => {
    setOrders((prev) => prev.map((o) => (o.o_id === updated.o_id ? updated : o)));
    setEditing(null);
    setCancelling(null);
  };

  let content;
  if (loading) {
    content = showSkeleton ? <OrderGridSkeleton count={6} /> : null;
  } else if (error) {
    content = (
      <div className="alert alert-danger d-flex flex-wrap justify-content-between align-items-center gap-2" role="alert">
        <span>{error}</span>
        <Button variant="outline" size="sm" onClick={() => setReloadKey((k) => k + 1)}>
          Try again
        </Button>
      </div>
    );
  } else if (orders.length === 0) {
    content = (
      <div className="text-center py-5">
        <h2 className="h4 fw-bold mb-2">No orders yet</h2>
        <p className="text-secondary mb-4">You haven't placed any orders yet.</p>
        <Button onClick={() => navigate("/product")}>Browse products</Button>
      </div>
    );
  } else {
    content = (
      <div className="order-grid">
        {orders.map((order) => {
          const key = statusKey(order);
          const actions = (canCustomerEdit(key) || canCancel(key)) && (
            <>
              {canCustomerEdit(key) && (
                <Button size="sm" onClick={() => setEditing(order)}>
                  Edit order
                </Button>
              )}
              {canCancel(key) && (
                <Button
                  size="sm"
                  variant="outline"
                  className="order-action--danger"
                  onClick={() => setCancelling(order)}
                >
                  Cancel order
                </Button>
              )}
            </>
          );
          return <OrderCard key={order.o_id} order={order} actions={actions || undefined} />;
        })}
      </div>
    );
  }

  return (
    <>
      <Nav />
      <main className="history-page container py-4 py-lg-5">
        <h1 className="history-title mb-4">Order history</h1>
        {content}
      </main>

      {editing && (
        <OrderEditModal order={editing} onClose={() => setEditing(null)} onSaved={updateOrder} />
      )}
      {cancelling && (
        <CancelOrderModal
          order={cancelling}
          onClose={() => setCancelling(null)}
          onCancelled={(order) => updateOrder({ ...order, status: "Cancelled" })}
        />
      )}
      <Footer />
    </>
  );
}
