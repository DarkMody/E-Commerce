import { Link } from "react-router-dom";
import { SERVER_URL } from "../../config";
import "./orderProduct.css";

/**
 * One product line inside an order (read only).
 * Props
 *  - product  { p_id, name, image, price, ordered_quantity }
 *
 * NOTE for the backend: `price` should be the price the customer PAID when ordering,
 * not the product's current price, otherwise old orders change when a seller edits a price.
 */
function OrderProduct({ product }) {
  const quantity = Number(product.ordered_quantity) || 0;
  const unitPrice = Number(product.price) || 0;
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
            <img src={`${SERVER_URL}/uploads/${product.image}`} alt="" />
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
              <div className="fs-3 fw-bold lh-1">
                ${(unitPrice * quantity).toFixed(2)}
              </div>
              {quantity > 1 && (
                <div className="small text-secondary mt-1">
                  ${unitPrice.toFixed(2)} each
                </div>
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
