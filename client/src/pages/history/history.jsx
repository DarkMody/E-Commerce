import { useEffect, useState } from "react";
import OrderCard from "./orderCard";
import OrderEditModal from "./orderEditModal";
import "./history.css";
import { SERVER_URL } from "../../config";
import Nav from "../../components/nav/nav";
import Follow from "../../components/follow/follow";
import Footer from "../../components/footer/footer";

export default function History() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        // ===================== BACKEND CONNECTION =====================
        // TODO: replace with your endpoint that returns the logged-in
        // user's orders as an array. Each order should look like:
        // { o_id, created_at, totalPrice, status, paymentMethod, phone, location }
        const res = await fetch(`${SERVER_URL}/api/user/order`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Could not load your orders.");
        // console.log(await res.json());
        const data = await res.json();
        setOrders(data.data);
      } catch (err) {
        window.toast("error", err.message);
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, []);

  // Replace the edited order in the list without refetching.
  const handleSaved = (updated) => {
    setOrders((prev) =>
      prev.map((o) => (o.o_id === updated.o_id ? updated : o)),
    );
    setEditing(null);
  };

  return (
    <>
      <Nav></Nav>
      <main className="history-page">
        <div className="history-wrap">
          <h1 className="history-title">Order history</h1>

          {loading && <div className="spinner-border" role="status"></div>}
          {error && <div className="alert alert-danger">{error}</div>}
          {!loading && !error && orders.length === 0 && (
            <p className="history-empty">You haven't placed any orders yet.</p>
          )}

          <div className="history-grid">
            {orders.map((order) => (
              <OrderCard key={order.o_id} order={order} onEdit={setEditing} />
            ))}
          </div>
        </div>

        {editing && (
          <OrderEditModal
            order={editing}
            onClose={() => setEditing(null)}
            onSaved={handleSaved}
          />
        )}
      </main>
      <Follow></Follow>
      <Footer></Footer>
    </>
  );
}
