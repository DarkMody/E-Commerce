import "./orderProduct.css";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { SERVER_URL } from "../../config";

function OrderProduct(param) {
  const product = param.product;
  const [quantity, setQuantity] = useState(product.ordered_quantity);

  return (
    <div className="product p-3">
      <div className="row">
        <div className="col-4 d-flex align-items-center">
          <img src={`${SERVER_URL}/uploads/${product.image}`} alt="" />
        </div>
        <div className="col-8 text-start d-flex flex-column justify-content-between">
          <div className="top d-flex justify-content-between align-items-center">
            <Link to={`/product/${product.p_id}`}>
              <h4 className="title">{product.name}</h4>
            </Link>
          </div>
          <div className="bottom d-flex justify-content-between align-items-center">
            <div className="fs-2 fw-bold price">
              ${(product.price * quantity).toFixed(2)}
            </div>
            <h5>Quantity: {quantity}</h5>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderProduct;
