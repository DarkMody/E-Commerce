import { useEffect, useState } from "react";
// import OrderCard from "../history/orderCard"; // TODO: adjust to where your OrderCard lives
import Pagination from "../../components/pagination/Pagination";
import ManagerOrderModal from "./ManagerOrderModal";
import { SERVER_URL } from "../../config";
import "../history/history.css"; // TODO: adjust (order card + status pill styles)

// Must match the status strings your backend uses.
export const STATUSES = ["processing", "shipped", "delivered", "cancelled"];

export default function ManagerOrders() {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // order open in the modal

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // ===================== BACKEND CONNECTION =====================
        // TODO: change the URL. `search` = order id (may be empty),
        // `status` = one of STATUSES (empty = all). Return:
        // { data: [ { _id, createdAt, totalPrice, status, paymentMethod,
        //             phone, location, courierName, items: [{ name, quantity }] } ],
        //   pagination: { totalPages } }
        const res = await fetch(
          `${SERVER_URL}/api/order?page=${page}&search=${encodeURIComponent(search)}&status=${status}`,
          { credentials: "include" },
        );
        if (!res.ok) throw new Error("Could not load orders.");
        const data = await res.json();
        setOrders(data.data);
        setTotalPages(data.pagination.totalPages);
      } catch (err) {
        window.toast("error", err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page, search, status]);

  const handleDone = (updated) => {
    setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
    setSelected(null);
  };

  return (
    <>
      <h1 className="manager-title">Orders</h1>

      <div className="manager-filters">
        <input
          type="search"
          className="form-control manager-search"
          placeholder="Search by order id"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          aria-label="Search orders by id"
        />
        <select
          className="form-select"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      {loading && <div className="spinner-border" role="status"></div>}
      {!loading && orders.length === 0 && (
        <p className="text-secondary">No orders found.</p>
      )}

      {/* <div className="history-grid">
        {!loading &&
          orders.map((o) => (
            <OrderCard
              key={o._id}
              order={o}
              showId
              actionLabel="Manage"
              onEdit={setSelected}
            />
          ))}
      </div> */}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {selected && (
        <ManagerOrderModal
          order={selected}
          onClose={() => setSelected(null)}
          onDone={handleDone}
        />
      )}
    </>
  );
}
