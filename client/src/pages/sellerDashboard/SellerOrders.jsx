import { useEffect, useState } from "react";
import Pagination from "../../components/pagination/Pagination";
import Input from "../../components/input/input";
import Button from "../../components/button/button";
import OrderCard from "../../components/orderCard/orderCard";
import { OrderGridSkeleton, useDelayedLoading } from "../../components/loading";
import { SERVER_URL } from "../../config";

const TABS = ["All", "Processing", "Shipped", "Delivered", "Cancelled"];

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);

/**
 * Orders that contain this seller's products. Read only, and no customer details:
 * the seller only sees their own items, the subtotal and the status.
 */
export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState(""); // debounced value sent to the server
  const [status, setStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const showSkeleton = useDelayedLoading(loading);

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
        // ===================== BACKEND CONNECTION =====================
        // GET /api/seller/orders?page=&search=&status= -> getOrders in sellerController.js
        // { data: [ { o_id, created_at, status, units, subtotal, items: [ { name, quantity, price } ] } ],
        //   pagination: { totalPages } }
        const query = new URLSearchParams({ page, search, status: status === "All" ? "" : status });
        const res = await fetch(`${SERVER_URL}/api/seller/orders?${query}`, { credentials: "include" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Could not load orders.");
        // ===============================================================
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

  return (
    <>
      <h1 className="dash-title">Orders</h1>

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
              onClick={() => {
                setStatus(tab);
                setPage(1);
              }}
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
          {orders.map((order) => (
            <OrderCard
              key={order.o_id}
              order={{ ...order, total_price: order.subtotal }}
              items={order.items}
              totalLabel="Your items"
              linkable={false}
            />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </>
  );
}
