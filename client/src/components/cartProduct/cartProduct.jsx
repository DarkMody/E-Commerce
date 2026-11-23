import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { SERVER_URL } from "../../config";
import "./cartProduct.css";

const REMOVE_MS = 400; // fade-out time, must match the transition in cartProduct.css

/* ---------- Guest cart (localStorage) ---------- */
const readLocalCart = () => {
  try {
    return JSON.parse(localStorage.getItem("localCart")) || [];
  } catch {
    return [];
  }
};
const writeLocalCart = (cart) =>
  localStorage.setItem("localCart", JSON.stringify(cart));

/* ---------- Server calls. Each one returns the quantity that is really saved ---------- */

// Logged-in user: the server checks the stock.
// When the stock is too low it answers status "error" with the limit as the LAST NUMBER
// in the message. TODO: better if the server sends it as its own field (e.g. data.maxQuantity).
const saveQuantityOnServer = async (productId, wanted, current) => {
  const res = await fetch(`${SERVER_URL}/api/cart/${productId}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity: wanted }),
  });
  const data = await res.json();

  if (data.status === "success") return wanted;

  window.toast(data.status, data.message);
  if (data.status === "error") {
    const max = Number(String(data.message).match(/(\d+)\D*$/)?.[1]);
    if (max >= 1) return max;
  }
  return current;
};

// Guest: we ask the product for its stock ourselves, then update localStorage.
const saveQuantityLocally = async (productId, wanted) => {
  const res = await fetch(`${SERVER_URL}/api/products/${productId}`);
  const data = await res.json();
  const stock = Number(data.data.product.quantity);
  const saved = Math.min(stock, wanted);

  if (stock < wanted) window.toast("error", `The stock is just ${stock}`);

  writeLocalCart(
    readLocalCart().map((item) =>
      item.productId === productId ? { ...item, quantity: saved } : item,
    ),
  );
  return saved;
};

/**
 * One product row in the cart.
 * Props
 *  - product            { p_id, name, image, price, quantity }
 *  - onQuantityChange   (p_id, newQuantity) => void   called after every successful change
 *  - onRemove           (p_id) => void                called after the fade-out
 */
function CartProduct({
  product,
  onQuantityChange = () => {},
  onRemove = () => {},
}) {
  const [quantity, setQuantity] = useState(Number(product.quantity));
  const [inputValue, setInputValue] = useState(String(product.quantity));
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState(false);
  const removeTimer = useRef(null);

  // Follow the parent if it changes the quantity
  useEffect(() => {
    setQuantity(Number(product.quantity));
    setInputValue(String(product.quantity));
  }, [product.quantity]);

  useEffect(() => () => clearTimeout(removeTimer.current), []);

  const productPath = `/product/${product.p_id}`;
  const discount = Number(product.discount) || 0;
  const hasDiscount = discount > 0;
  const originalUnitPrice = Number(product.price) || 0;
  const unitPrice = hasDiscount
    ? originalUnitPrice * (1 - discount / 100)
    : originalUnitPrice;
  const locked = busy || removing;

  const updateQuantity = async (next) => {
    const wanted = Math.max(1, Math.floor(Number(next)) || 1);
    if (locked || wanted === quantity) {
      setInputValue(String(quantity)); // undo whatever was typed
      return;
    }

    setBusy(true);
    try {
      const saved = window.loggedIn
        ? await saveQuantityOnServer(product.p_id, wanted, quantity)
        : await saveQuantityLocally(product.p_id, wanted);

      setQuantity(saved);
      setInputValue(String(saved));
      if (saved !== quantity) onQuantityChange(product.p_id, saved);
    } catch {
      window.toast("error", "Could not update the quantity.");
      setInputValue(String(quantity));
    } finally {
      setBusy(false);
    }
  };

  const removeFromCart = async () => {
    if (locked) return;
    setBusy(true);
    try {
      if (window.loggedIn) {
        const res = await fetch(`${SERVER_URL}/api/cart/${product.p_id}`, {
          method: "DELETE",
          credentials: "include",
        });
        const data = await res.json();
        window.toast(data.status, data.message);
        if (data.status !== "success") return;
      } else {
        writeLocalCart(
          readLocalCart().filter((item) => item.productId !== product.p_id),
        );
      }

      // fade out, then tell the parent to drop it from the list
      setRemoving(true);
      removeTimer.current = setTimeout(() => onRemove(product.p_id), REMOVE_MS);
    } catch {
      window.toast("error", "Could not remove the product.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className={`cart-product p-3 ${removing ? "is-removing" : ""}`}>
      <div className="row g-3 align-items-center">
        <div className="col-4">
          <Link
            to={productPath}
            className="cart-product__image d-block"
            tabIndex={-1}
            aria-hidden="true"
          >
            {hasDiscount && (
              <span className="cart-product__discount-badge">-{discount}%</span>
            )}
            <img src={`${product.image}`} alt="" />
          </Link>
        </div>

        <div className="col-8 d-flex flex-column gap-3 text-start">
          <div className="d-flex justify-content-between align-items-start gap-2">
            <Link to={productPath} className="cart-product__link">
              <h3 className="cart-product__title fs-5 fw-semibold mb-0">
                {product.name}
              </h3>
            </Link>
            <button
              type="button"
              className="btn cart-product__icon-btn cart-product__delete"
              onClick={removeFromCart}
              disabled={locked}
              aria-label={`Remove ${product.name} from cart`}
            >
              <i className="fa-solid fa-trash-can" aria-hidden="true"></i>
            </button>
          </div>

          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              {hasDiscount ? (
                <>
                  <div className="d-flex align-items-baseline gap-2 flex-wrap">
                    <span className="fs-3 fw-bold lh-1 cart-price">
                      ${(unitPrice * quantity).toFixed(2)}
                    </span>
                    <span className="text-secondary small text-decoration-line-through">
                      ${(originalUnitPrice * quantity).toFixed(2)}
                    </span>
                  </div>
                  {quantity > 1 && (
                    <div className="small text-secondary mt-1">
                      ${unitPrice.toFixed(2)} each (was $
                      {originalUnitPrice.toFixed(2)})
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="fs-3 fw-bold lh-1">
                    ${(unitPrice * quantity).toFixed(2)}
                  </div>
                  {quantity > 1 && (
                    <div className="small text-secondary mt-1">
                      ${unitPrice.toFixed(2)} each
                    </div>
                  )}
                </>
              )}
            </div>

            <div
              className="cart-product__qty d-inline-flex align-items-center rounded-pill px-1"
              role="group"
              aria-label={`Quantity of ${product.name}`}
            >
              <button
                type="button"
                className="btn cart-product__icon-btn"
                onClick={() => updateQuantity(quantity - 1)}
                disabled={locked || quantity <= 1}
                aria-label="Decrease quantity"
              >
                <i className="fa-solid fa-minus" aria-hidden="true"></i>
              </button>
              <input
                type="number"
                min="1"
                inputMode="numeric"
                value={inputValue}
                disabled={locked}
                aria-label="Quantity"
                onChange={(e) => setInputValue(e.target.value)}
                onBlur={() => updateQuantity(inputValue)}
                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              />
              <button
                type="button"
                className="btn cart-product__icon-btn"
                onClick={() => updateQuantity(quantity + 1)}
                disabled={locked}
                aria-label="Increase quantity"
              >
                <i className="fa-solid fa-plus" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default CartProduct;
