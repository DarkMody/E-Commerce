import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Nav from "../../components/nav/nav";
import Button from "../../components/button/button";
import Footer from "../../components/footer/footer";
import CartProduct from "../../components/cartProduct/cartProduct";
import { Skeleton, useDelayedLoading } from "../../components/loading";
import { SERVER_URL } from "../../config";
import "./cart.css";

const loadServerCart = async () => {
  const res = await fetch(`${SERVER_URL}/api/cart`, { credentials: "include" });
  const data = await res.json();
  if (!Array.isArray(data.data)) {
    throw new Error(data.message || "Could not load your cart.");
  }
  return data.data;
};

const readLocalCart = () => {
  try {
    return JSON.parse(localStorage.getItem("localCart")) || [];
  } catch {
    return [];
  }
};

// Guest: the cart only stores { productId, quantity }, so we load each product's details.
// A product that can't be loaded (deleted, network) is skipped instead of breaking the page.
const loadGuestCart = async () => {
  const results = await Promise.all(
    readLocalCart().map(async (item) => {
      try {
        const res = await fetch(`${SERVER_URL}/api/products/${item.productId}`);
        const data = await res.json();
        if (data.status !== "success") return null;
        return {
          ...data.data.product,
          ...data.data.image[0],
          quantity: item.quantity,
        };
      } catch {
        return null;
      }
    }),
  );
  return results.filter(Boolean);
};

function CartSkeleton() {
  return (
    <div className="row g-4" role="status" aria-busy="true">
      <span className="visually-hidden">Loading your cart…</span>
      <div className="col-lg-8 d-flex flex-column gap-3">
        {[0, 1, 2].map((i) => (
          <div className="card p-3" key={i}>
            <div className="row g-3 align-items-center">
              <div className="col-4">
                <Skeleton height="auto" style={{ aspectRatio: "1 / 1" }} />
              </div>
              <div className="col-8 d-flex flex-column gap-3">
                <Skeleton width="80%" height="1.2rem" />
                <div className="d-flex justify-content-between align-items-center">
                  <Skeleton width="30%" height="2rem" />
                  <Skeleton width="90px" height="2rem" rounded="999px" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="col-lg-4">
        <div className="card p-4">
          <Skeleton width="50%" height="1.2rem" className="mb-4" />
          <Skeleton width="100%" className="mb-3" />
          <Skeleton width="100%" height="1.6rem" className="mb-4" />
          <Skeleton height="48px" rounded="999px" />
        </div>
      </div>
    </div>
  );
}

function Cart() {
  const navigate = useNavigate();
  const [cartProduct, setCartProduct] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const showSkeleton = useDelayedLoading(loading);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const products = window.loggedIn
          ? await loadServerCart()
          : await loadGuestCart();
        if (!cancelled) setCartProduct(products);
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load your cart.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  /* ---------- Handlers ---------- */
  const updateQuantity = (p_id, quantity) => {
    setCartProduct((prev) =>
      prev.map((p) => (p.p_id === p_id ? { ...p, quantity } : p)),
    );
  };

  const removeProduct = (p_id) => {
    setCartProduct((prev) => prev.filter((p) => p.p_id !== p_id));
  };

  /* ---------- Totals ---------- */
  const unitCount = cartProduct.reduce((sum, p) => sum + Number(p.quantity), 0);
  const totalPrice = cartProduct.reduce(
    (sum, p) => sum + Number(p.price) * Number(p.quantity),
    0,
  );

  /* ---------- What to show ---------- */
  let content;

  if (loading) {
    content = showSkeleton ? <CartSkeleton /> : null;
  } else if (error) {
    content = (
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
    );
  } else if (cartProduct.length === 0) {
    content = (
      <div className="text-center py-5">
        <div className="cart-empty__icon mx-auto mb-3" aria-hidden="true">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="9" cy="20" r="1.5" />
            <circle cx="18" cy="20" r="1.5" />
            <path d="M2 3h3l2.5 12h11L21 7H6" />
          </svg>
        </div>
        <h2 className="h4 fw-bold mb-2">Your cart is empty</h2>
        <p className="text-secondary mb-4">
          Looks like you haven't chosen any product yet. Go and have fun!
        </p>
        <Button onClick={() => navigate("/product")}>Browse products</Button>
      </div>
    );
  } else {
    content = (
      <div className="row g-4 align-items-start">
        <section className="col-lg-8" aria-label="Products in your cart">
          <div className="cart-page__list d-flex flex-column gap-3">
            {cartProduct.map((product) => (
              <CartProduct
                key={product.p_id}
                product={product}
                onRemove={removeProduct}
                onQuantityChange={updateQuantity}
              />
            ))}
          </div>
        </section>

        <aside className="col-lg-4" aria-label="Order summary">
          <div className="cart-summary p-4">
            <h2 className="h5 fw-bold mb-3">Order summary</h2>
            <div className="d-flex justify-content-between text-secondary mb-2">
              <span>Items</span>
              <span>{unitCount}</span>
            </div>
            <hr />
            <div className="d-flex justify-content-between fs-4 fw-bold mb-4">
              <span>Total</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <Button
              featured
              size="lg"
              fullWidth
              onClick={() => navigate("/cart/pay")}
            >
              Buy now
            </Button>
            <Link
              to="/product"
              className="d-block text-center small mt-3 cart-summary-link"
            >
              Continue shopping
            </Link>
          </div>
        </aside>
      </div>
    );
  }

  return (
    <>
      <Nav />
      <main className="cart-page container py-4 py-lg-5">
        <h1 className="cart-page__title fw-bold text-uppercase mb-4">
          Your Cart
        </h1>
        {content}
      </main>
      <Footer />
    </>
  );
}

export default Cart;
