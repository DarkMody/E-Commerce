import { useEffect, useState, useRef } from "react";
import Button from "../../components/button/button";
import Modal from "../../components/modal/modal";
import Input from "../../components/input/input";
import Pagination from "../../components/pagination/Pagination";
import {
  ProductGridSkeleton,
  useDelayedLoading,
} from "../../components/loading";
import { SERVER_URL } from "../../config";
import "./checkProducts.css";

const SearchIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);

function RejectModal({ product, onClose, onRejected }) {
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");

  const handleConfirm = async () => {
    setRejecting(true);
    try {
      const res = await fetch(
        `${SERVER_URL}/api/admin/check-product/${product.p_id}/reject`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: note.trim() }),
        },
      );
      const data = await res.json();
      window.toast(data.status, data.message);
      if (data.status === "success") {
        onRejected(product.p_id);
      }
    } catch {
      window.toast("error", "Network error. Please try again.");
    } finally {
      setRejecting(false);
    }
  };

  const isEdit = Boolean(product.pending_name || product.pending_description);

  return (
    <Modal
      title="Reject Product"
      onClose={onClose}
      closeDisabled={rejecting}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={rejecting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirm} loading={rejecting}>
            Confirm Rejection
          </Button>
        </>
      }
    >
      <p className="mb-2">
        Are you sure you want to reject{" "}
        <strong>{product.pending_name || product.name}</strong>?
      </p>
      <p className="small text-secondary mb-2">
        {isEdit
          ? "This will cancel the pending name, description, and unaccepted images, keeping the product's previous accepted version live."
          : "The seller will see this product marked as Rejected and can edit or remove it."}
      </p>
      <div className="mt-2">
        <label
          className="form-label small fw-semibold mb-1"
          htmlFor="rejection-note"
        >
          Reason for rejection{" "}
          <span className="text-secondary fw-normal">
            (optional — seller will see this)
          </span>
        </label>
        <textarea
          id="rejection-note"
          className="form-control"
          rows={3}
          placeholder="e.g. Image is blurry, name is misleading…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={rejecting}
          style={{ resize: "vertical" }}
        />
      </div>
    </Modal>
  );
}

function ProductReviewCard({ product, onAccept, onReject, accepting }) {
  const images = Array.isArray(product.images) ? product.images : [];
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const isEdit = Boolean(
    product.pending_name ||
    product.pending_description ||
    images.some((i) => !i.accepted && images.some((j) => j.accepted)),
  );

  const activeImg = images[activeImageIdx] || images[0] || null;

  return (
    <div className="review-card mb-4" id={`product-${product.p_id}`}>
      <div className="row g-4">
        {/* Left: Images */}
        <div className="col-md-5 col-lg-4">
          <div className="review-gallery">
            <div className="review-gallery__main">
              {activeImg ? (
                <img
                  src={activeImg.image}
                  alt={product.pending_name || product.name}
                />
              ) : (
                <span className="text-secondary small">No image uploaded</span>
              )}
              {activeImg && !activeImg.accepted && (
                <span
                  className="badge bg-warning text-dark position-absolute top-0 end-0 m-2"
                  style={{ zIndex: 2 }}
                >
                  Pending Image
                </span>
              )}
            </div>

            {images.length > 1 && (
              <div className="review-gallery__thumbs">
                {images.map((img, idx) => (
                  <button
                    type="button"
                    key={img.image_id || idx}
                    className={`review-gallery__thumb ${
                      idx === activeImageIdx ? "is-active" : ""
                    }`}
                    onClick={() => setActiveImageIdx(idx)}
                    title={`View image ${idx + 1}`}
                  >
                    <img src={img.image} alt="" />
                    {!img.accepted && (
                      <span className="review-gallery__thumb-badge">New</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Info & Actions */}
        <div className="col-md-7 col-lg-8 d-flex flex-column">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
            <div className="d-flex align-items-center gap-2">
              <span
                className={isEdit ? "review-badge-edit" : "review-badge-new"}
              >
                {isEdit ? "Edit Request" : "New Product"}
              </span>
              <span className="small text-secondary">
                Seller: <strong>{product.seller_name}</strong> (
                {product.seller_email})
              </span>
            </div>
            <span className="small text-secondary">
              Submitted:{" "}
              {new Date(
                product.pending_created_at || product.created_at,
              ).toLocaleDateString()}
            </span>
          </div>

          {/* Name Comparison */}
          <div className="mb-3">
            <div className="small text-secondary fw-semibold mb-1">
              Product Name
            </div>
            {product.pending_name && product.pending_name !== product.name ? (
              <div className="d-flex flex-column gap-1">
                <div className="diff-box diff-box--old text-decoration-line-through">
                  Original: {product.name}
                </div>
                <div className="diff-box diff-box--new fw-bold">
                  Proposed: {product.pending_name}
                </div>
              </div>
            ) : (
              <h3 className="h5 fw-bold mb-0">{product.name}</h3>
            )}
          </div>

          {/* Description Comparison */}
          <div className="mb-3">
            <div className="small text-secondary fw-semibold mb-1">
              Description
            </div>
            {product.pending_description &&
            product.pending_description !== product.description ? (
              <div className="d-flex flex-column gap-1">
                <div className="diff-box diff-box--old text-decoration-line-through">
                  {product.description || "No description previously."}
                </div>
                <div className="diff-box diff-box--new">
                  {product.pending_description}
                </div>
              </div>
            ) : (
              <div className="text-secondary small">
                {product.description || "No description provided."}
              </div>
            )}
          </div>

          {/* Product Meta: Price, Stock, Discount, Categories */}
          <div
            className="d-flex flex-wrap gap-4 align-items-center p-3 rounded mb-4"
            style={{ backgroundColor: "var(--dz-surface-2)" }}
          >
            <div>
              <span className="small text-secondary d-block">Price</span>
              <span className="fw-bold fs-5">
                ${Number(product.price).toFixed(2)}
              </span>
            </div>
            {Number(product.discount) > 0 && (
              <div>
                <span className="small text-secondary d-block">Discount</span>
                <span className="badge bg-danger">
                  -{product.discount}% ($
                  {(
                    Number(product.price) *
                    (1 - Number(product.discount) / 100)
                  ).toFixed(2)}
                  )
                </span>
              </div>
            )}
            <div>
              <span className="small text-secondary d-block">Stock</span>
              <span className="fw-semibold">{product.quantity} units</span>
            </div>
            {Array.isArray(product.categories) &&
              product.categories.length > 0 && (
                <div>
                  <span className="small text-secondary d-block">
                    Categories
                  </span>
                  <div className="d-flex gap-1 flex-wrap mt-1">
                    {product.categories.map((c) => (
                      <span
                        key={c.c_id}
                        className="badge bg-secondary-subtle text-secondary-emphasis"
                      >
                        {c.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </div>

          {/* Action Buttons */}
          <div className="mt-auto d-flex justify-content-end align-items-center gap-2">
            <Button
              variant="outline"
              className="text-danger border-danger"
              onClick={() => onReject(product)}
              disabled={accepting}
            >
              Reject
            </Button>
            <Button
              variant="primary"
              onClick={() => onAccept(product.p_id)}
              loading={accepting}
            >
              Accept & Publish
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // pagination & server-side filtering
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({ all: 0, new: 0, edit: 0 });

  // search with 400 ms debounce
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const debounceRef = useRef(null);

  const [tab, setTab] = useState("all");
  const [acceptingId, setAcceptingId] = useState(null);
  const [rejectingProduct, setRejectingProduct] = useState(null);
  const showSkeleton = useDelayedLoading(loading);

  // debounce: when searchInput changes, wait 400 ms then apply
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const url = `${SERVER_URL}/api/admin/check-products?page=${page}&tab=${tab}&search=${encodeURIComponent(search)}`;
        const res = await fetch(url, { credentials: "include" });
        const data = await res.json();
        if (!res.ok)
          throw new Error(
            data.message || "Could not load products for review.",
          );
        if (!cancelled) {
          setProducts(data.data || []);
          setTotalPages(data.pagination?.totalPages ?? 1);
          setCounts(data.counts ?? { all: 0, new: 0, edit: 0 });
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
  }, [page, tab, search, reloadKey]);

  const handleAccept = async (productId) => {
    setAcceptingId(productId);
    try {
      const res = await fetch(
        `${SERVER_URL}/api/admin/check-product/${productId}/accept`,
        {
          method: "POST",
          credentials: "include",
        },
      );
      const data = await res.json();
      window.toast(data.status, data.message);
      if (data.status === "success") {
        setReloadKey((k) => k + 1);
      }
    } catch {
      window.toast("error", "Network error. Please try again.");
    } finally {
      setAcceptingId(null);
    }
  };

  const handleRejected = () => {
    setRejectingProduct(null);
    setReloadKey((k) => k + 1);
  };

  const switchTab = (t) => {
    setTab(t);
    setPage(1);
  };

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="dash-title mb-1">Product Approvals</h1>
          <p className="text-secondary small mb-0">
            Review and approve seller product submissions and edits.
          </p>
        </div>
        <span className="badge bg-primary fs-6 px-3 py-2">
          {counts.all} Pending
        </span>
      </div>

      <div className="d-flex flex-column gap-3 mb-4">
        <div className="dash-search">
          <Input
            type="search"
            name="checkProductSearch"
            placeholder="Search by product or seller"
            aria-label="Search pending products"
            icon={<SearchIcon />}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <div
          className="dash-tabs"
          role="group"
          aria-label="Filter review items"
        >
          <button
            type="button"
            className="dash-tab"
            aria-pressed={tab === "all"}
            onClick={() => switchTab("all")}
          >
            All ({counts.all})
          </button>
          <button
            type="button"
            className="dash-tab"
            aria-pressed={tab === "new"}
            onClick={() => switchTab("new")}
          >
            New Products ({counts.new})
          </button>
          <button
            type="button"
            className="dash-tab"
            aria-pressed={tab === "edit"}
            onClick={() => switchTab("edit")}
          >
            Edits ({counts.edit})
          </button>
        </div>
      </div>

      {loading && showSkeleton && <ProductGridSkeleton count={4} />}

      {error && (
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

      {!loading && !error && products.length === 0 && (
        <div className="text-center py-5">
          <div
            className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle"
            style={{
              width: "64px",
              height: "64px",
              backgroundColor: "var(--dz-success-bg)",
              color: "var(--dz-success)",
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="h5 fw-bold mb-1">All caught up!</h2>
          <p className="text-secondary small mb-0">
            {search
              ? "No pending products match your search."
              : "There are currently no products awaiting review."}
          </p>
        </div>
      )}

      {!loading &&
        !error &&
        products.map((product) => (
          <ProductReviewCard
            key={product.p_id}
            product={product}
            onAccept={handleAccept}
            onReject={setRejectingProduct}
            accepting={acceptingId === product.p_id}
          />
        ))}

      {!loading && !error && totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onChange={(p) => {
            setPage(p);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}

      {rejectingProduct && (
        <RejectModal
          product={rejectingProduct}
          onClose={() => setRejectingProduct(null)}
          onRejected={handleRejected}
        />
      )}
    </>
  );
}
