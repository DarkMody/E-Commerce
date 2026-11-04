import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Card from "../../components/card/card";
import Button from "../../components/button/button";
import Modal from "../../components/modal/modal";
import { ProductGridSkeleton, useDelayedLoading } from "../../components/loading";
import { SERVER_URL } from "../../config";
import "./sellerProducts.css";

const LOW_STOCK = 5;
const TABS = [
  ["all", "All"],
  ["low", "Low stock"],
  ["out", "Out of stock"],
];

const stockOf = (p) => Number(p.quantity);
const isOut = (p) => stockOf(p) === 0;
const isLow = (p) => stockOf(p) > 0 && stockOf(p) <= LOW_STOCK;
const filterBy = (products, tab) =>
  tab === "out" ? products.filter(isOut) : tab === "low" ? products.filter(isLow) : products;

/* ---------- Delete confirmation ---------- */
function DeleteProductModal({ product, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      // ===================== BACKEND CONNECTION =====================
      // DELETE /api/product/delete/:p_id  returns { status, message }
      const res = await fetch(`${SERVER_URL}/api/product/delete/${product.p_id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      // ===============================================================
      window.toast(data.status, data.message);
      if (data.status === "success") onDeleted(product);
    } catch {
      window.toast("error", "Network error. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      title="Delete product"
      onClose={onClose}
      closeDisabled={deleting}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={deleting}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting}>Delete product</Button>
        </>
      }
    >
      <p className="mb-0">
        Are you sure you want to delete <strong>{product.name}</strong>? This can't be undone.
      </p>
    </Modal>
  );
}

function MyProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [tab, setTab] = useState("all");
  const [deleting, setDeleting] = useState(null); // product in the delete dialog
  const showSkeleton = useDelayedLoading(loading);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        // ===================== BACKEND CONNECTION =====================
        // GET /api/seller/product -> { data: [ { p_id, name, price, quantity, image, rate, people } ] }
        const res = await fetch(`${SERVER_URL}/api/seller/product`, { credentials: "include" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Could not load your products.");
        // ===============================================================
        if (!cancelled) setProducts(data.data || []);
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
  }, [reloadKey]);

  const handleDeleted = (product) => {
    setProducts((prev) => prev.filter((p) => p.p_id !== product.p_id));
    setDeleting(null);
  };

  const counts = { all: products.length, low: products.filter(isLow).length, out: products.filter(isOut).length };
  const visible = filterBy(products, tab);

  let content;
  if (loading) {
    content = showSkeleton ? <ProductGridSkeleton count={8} /> : null;
  } else if (error) {
    content = (
      <div className="alert alert-danger d-flex flex-wrap justify-content-between align-items-center gap-2" role="alert">
        <span>{error}</span>
        <Button variant="outline" size="sm" onClick={() => setReloadKey((k) => k + 1)}>Try again</Button>
      </div>
    );
  } else if (products.length === 0) {
    content = (
      <div className="text-center py-5">
        <h2 className="h4 fw-bold mb-2">You didn't add any product</h2>
        <p className="text-secondary mb-4">Add your first product and start selling.</p>
        <Button onClick={() => navigate("/product/add")}>Add your first product</Button>
      </div>
    );
  } else if (visible.length === 0) {
    content = <p className="text-secondary">No products in this group.</p>;
  } else {
    content = (
      <div className="row g-3">
        {visible.map((product) => (
          <div className="col-sm-6 col-lg-4 col-xxl-3" key={product.p_id}>
            <div className="my-product">
              <button
                type="button"
                className="my-product__delete"
                onClick={() => setDeleting(product)}
                aria-label={`Delete ${product.name}`}
                title="Delete product"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
                </svg>
              </button>
              {/* clicking the card opens the edit page */}
              <Link className="text-decoration-none d-block h-100" to={`/product/edit/${product.p_id}`}>
                <Card product={product} sellerPage={true} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <h1 className="dash-title mb-0">My Products</h1>
        <Button onClick={() => navigate("/product/add")}>Add new product</Button>
      </div>

      {!loading && !error && products.length > 0 && (
        <div className="dash-tabs mb-4" role="group" aria-label="Filter products">
          {TABS.map(([key, label]) => (
            <button
              type="button"
              key={key}
              className="dash-tab"
              aria-pressed={tab === key}
              onClick={() => setTab(key)}
            >
              {label} ({counts[key]})
            </button>
          ))}
        </div>
      )}

      {content}

      {deleting && (
        <DeleteProductModal product={deleting} onClose={() => setDeleting(null)} onDeleted={handleDeleted} />
      )}
    </>
  );
}

export default MyProducts;
