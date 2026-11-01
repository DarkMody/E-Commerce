import { useEffect, useState } from "react";
import { SERVER_URL } from "../../config";
// import OrderCard from "../history/orderCard";
import Pagination from "../../components/pagination/Pagination";
import "../history/history.css"; // order card + status pill styles

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState(""); // debounced value sent to the server
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Wait 400ms after typing stops, then search and go back to page 1.
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
      setError("");
      try {
        const res = await fetch(
          `${SERVER_URL}/api/order?page=${page}&search=${encodeURIComponent(search)}`,
          { credentials: "include" },
        );
        if (!res.ok) throw new Error("Could not load orders.");
        const data = await res.json();
        setOrders(data.data);
        console.log(data);
        setTotalPages(data.pagination.totalPages);
      } catch (err) {
        window.toast("error", err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page, search]);

  return (
    <>
      <h1 className="admin-title">All Orders</h1>

      <input
        type="search"
        className="form-control mb-4 admin-search"
        placeholder="Search by order id"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        aria-label="Search orders by id"
      />

      {error && <div className="alert alert-danger">{error}</div>}
      {loading && <div className="spinner-border" role="status"></div>}
      {!loading && !error && orders.length === 0 && (
        <p className="text-secondary">No orders found.</p>
      )}

      {/* No onEdit prop => no edit button on admin cards */}
      {/* <div className="history-grid">
        {!loading &&
          orders.map((o) => <OrderCard key={o._id} order={o} showId />)}
      </div> */}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </>
  );
}
