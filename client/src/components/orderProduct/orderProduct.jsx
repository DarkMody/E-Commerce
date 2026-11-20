import { Link } from "react-router-dom";
import { SERVER_URL } from "../../config";
import "./orderProduct.css";

function OrderProduct({ product }) {
  const quantity = Number(product.ordered_quantity) || 0;
  const discount = Number(product.ordered_discount ?? product.discount) || 0;
  const hasDiscount = discount > 0;
  const originalUnitPrice = Number(product.price ?? product.product_price) || 0;
  const unitPrice = hasDiscount
    ? originalUnitPrice * (1 - discount / 100)
    : originalUnitPrice;
  const productPath = `/product/${product.p_id}`;

  return (
    <article className="order-product p-3">
      <div className="row g-3 align-items-center">
        <div className="col-4">
          <Link
            to={productPath}
            className="order-product__image d-block"
            tabIndex={-1}
            aria-hidden="true"
          >
            {hasDiscount && (
              <span className="order-product__discount-badge">
                -{discount}%
              </span>
            )}
            <img src={`${product.image}`} alt="" />
          </Link>
        </div>

        <div className="col-8 d-flex flex-column gap-3 text-start">
          <Link to={productPath} className="order-product__link">
            <h3 className="order-product__title fs-5 fw-semibold mb-0">
              {product.name}
            </h3>
          </Link>

          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              {hasDiscount ? (
                <>
                  <div className="d-flex align-items-baseline gap-2 flex-wrap">
                    <span className="fs-3 fw-bold lh-1 order-product__price--discounted">
                      ${(unitPrice * quantity).toFixed(2)}
                    </span>
                    <span className="order-product__price--original text-decoration-line-through">
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
            <span className="order-product__qty">Qty: {quantity}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default OrderProduct;
