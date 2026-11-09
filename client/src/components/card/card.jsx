import { SERVER_URL } from "../../config";
import "./card.css";

/**
 * Props
 *  - product     { p_id, name, image, price, rate, people, quantity, discount }
 *  - sellerPage  true on the seller's own products page: shows the remaining stock
 */
function Card({ product, sellerPage = false }) {
  const imageUrl = `${SERVER_URL}/uploads/${product.image}`;
  const hasReviews = Number(product.people) > 0;
  const soldOut = Number(product.quantity) === 0;

  const discount = Number(product.discount) || 0;
  const hasDiscount = discount > 0;
  const originalPrice = Number(product.price) || 0;
  const finalPrice = hasDiscount
    ? originalPrice * (1 - discount / 100)
    : originalPrice;

  return (
    <article
      className={`product-card text-start ${soldOut ? "is-sold-out" : ""}`}
      id={product.p_id}
    >
      <div className="product-card__image">
        {/* Discount badge on the top-left */}
        {hasDiscount && (
          <span className="product-card__discount-badge">-{discount}%</span>
        )}

        {/* blurred copy fills the empty space, the real photo is always fully visible */}
        <img
          className="product-card__backdrop"
          src={imageUrl}
          alt=""
          aria-hidden="true"
          loading="lazy"
        />
        <img
          className="product-card__photo"
          src={imageUrl}
          alt={product.name}
          loading="lazy"
        />
      </div>

      <div className="d-flex flex-column flex-grow-1 gap-1 p-3">
        <h3 className="product-card__title fs-4 fw-semibold mb-0">
          {product.name}
        </h3>

        <div className="d-flex align-items-center gap-1 small">
          {hasReviews ? (
            <>
              <i
                className="fa-solid fa-star product-card__star"
                aria-hidden="true"
              ></i>
              <span className="fw-semibold">
                <span className="visually-hidden">Rated </span>
                {Number(product.rate).toFixed(1)}
              </span>
              <span className="text-secondary">({product.people})</span>
            </>
          ) : (
            <span className="text-secondary">No reviews yet</span>
          )}
        </div>

        <div className="d-flex justify-content-between align-items-center gap-2 mt-auto">
          <div className="d-flex align-items-baseline gap-2 flex-wrap">
            {hasDiscount ? (
              <>
                <span className="product-card__price--discounted fw-bold fs-5">
                  ${finalPrice.toFixed(2)}
                </span>
                <span className="product-card__price--original text-decoration-line-through">
                  ${originalPrice.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="fw-bold fs-5">
                ${originalPrice.toFixed(2)}
              </span>
            )}
          </div>
          {soldOut ? (
            <span className="product-card__stock">Out of stock</span>
          ) : (
            sellerPage && (
              <span className="small text-secondary">
                Remaining: {product.quantity}
              </span>
            )
          )}
        </div>
      </div>
    </article>
  );
}

export default Card;
