import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Pagination from "../../components/pagination/Pagination";
import Input from "../../components/input/input";
import Button from "../../components/button/button";
import OrderCard from "../../components/orderCard/orderCard";
import CancelOrderModal from "../../components/orderCard/cancelOrderModal";
import { statusKey, STATUS } from "../../components/orderCard/orderUtils";
import { OrderGridSkeleton, useDelayedLoading } from "../../components/loading";
import ShipOrderModal from "./ShipOrderModal";
import { SERVER_URL } from "../../config";

const TABS = ["All", "Processing", "Shipped", "Delivered", "Cancelled"];

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);

export default function AdminOrders() {
  const [params] = useSearchParams(); // /admin/orders?search=10001&status=Processing (from the main page)
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState(params.get("search") || "");
  const [search, setSearch] = useState(params.get("search") || ""); // debounced value sent to the server
  const [status, setStatus] = useState(
    TABS.find((t) => t.toLowerCase() === (params.get("status") || "").toLowerCase()) || "All",
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [shipping, setShipping] = useState(null); // order in the ship dialog
  const [cancelling, setCancelling] = useState(null); // order in the cancel dialog
  const showSkeleton = useDelayedLoading(loading);

  // Wait 400ms after typing stops, then search and go back to page 1.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const query = new URLSearchParams({
          page,
          search,
          status: status === "All" ? "" : status,
        });
        const res = await fetch(`${SERVER_URL}/api/order?${query}`, { credentials: "include" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Could not load orders.");
        if (!cancelled) {
          setOrders(data.data);
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
  }, [page, search, status, reloadKey]);

  const updateOrder = (updated) => {
    setOrders((prev) => prev.map((o) => (o.o_id === updated.o_id ? updated : o)));
    setShipping(null);
    setCancelling(null);
  };

  const changeStatus = (tab) => {
    setStatus(tab);
    setPage(1);
  };

  return (
    <>
      <h1 className="dash-title">All Orders</h1>

      <div className="d-flex flex-column gap-3 mb-4">
        <div className="dash-search">
          <Input
            type="search"
            name="orderSearch"
            placeholder="Search by order id"
            aria-label="Search orders by id"
            icon={<SearchIcon />}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="dash-tabs" role="group" aria-label="Filter by status">
          {TABS.map((tab) => (
            <button
              type="button"
              key={tab}
              className="dash-tab"
              aria-pressed={status === tab}
              onClick={() => changeStatus(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading && showSkeleton && <OrderGridSkeleton count={6} />}

      {error && !loading && (
        <div className="alert alert-danger d-flex flex-wrap justify-content-between align-items-center gap-2" role="alert">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={() => setReloadKey((k) => k + 1)}>Try again</Button>
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <p className="text-secondary">No orders found.</p>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="order-grid">
          {orders.map((order) => {
            const isProcessing = statusKey(order) === STATUS.PROCESSING;
            return (
              <OrderCard
                key={order.o_id}
                order={order}
                showCustomer
                showCourier
                actions={
                  isProcessing ? (
                    <>
                      <Button size="sm" onClick={() => setShipping(order)}>Ship order</Button>
                      <Button size="sm" variant="outline" className="order-action--danger" onClick={() => setCancelling(order)}>
                        Cancel order
                      </Button>
                    </>
                  ) : undefined
                }
              />
            );
          })}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {shipping && (
        <ShipOrderModal order={shipping} onClose={() => setShipping(null)} onShipped={updateOrder} />
      )}
      {cancelling && (
        <CancelOrderModal
          order={cancelling}
          endpoint={`/api/admin/order/${cancelling.o_id}`}
          note={`The customer is not notified. Tell them yourself: ${cancelling.phone_number || "no phone"}${cancelling.customer_email ? ` · ${cancelling.customer_email}` : ""}`}
          onClose={() => setCancelling(null)}
          onCancelled={(order) => updateOrder({ ...order, status: "Cancelled", cancelled_at: new Date()})}
        />
      )}
    </>
  );
}
