import "./cartProduct.css";
import Follow from "../../components/follow/follow";
import { BASE_URL } from "../../config";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function CartProduct(param) {
  const [quantity, setQuantity] = useState(1);
  const product = param.product;

  const quantityHandling = (e) => {
    const val = parseInt(e.target.value);
    if (val > 100) {
      window.toast(
        "error",
        "Plz know that the maximum items you can buy for specific product is 100",
      );
    }
    setQuantity(Math.min(val, 100));
  };
  const blurQuantityHandling = (e) => {
    if (e.target.value === "" || parseInt(e.target.value) < 1) {
      setQuantity(1);
    }
  };

  const deleteProductFromCart = (e) => {
    param.onRemove();
    e.target.closest(".product").style.opacity = "0";
    setTimeout(() => {
      e.target.closest(".product").remove();
    }, 500);
  };

  return (
    <div className="product p-3">
      <div className="row">
        <div className="col-4 d-flex align-items-center">
          <img src={product.image} alt="" />
        </div>
        <div className="col-8 text-start d-flex flex-column justify-content-between">
          <div className="top d-flex justify-content-between align-items-center">
            <Link to={`/product/${product.id}`}>
              <h4 className="title">{product.title}</h4>
            </Link>
            <div className="delete fs-4" onClick={deleteProductFromCart}>
              <i className="fa-solid fa-trash-can"></i>
            </div>
          </div>
          <div className="bottom d-flex justify-content-between align-items-center">
            <div className="fs-2 fw-bold price">
              ${(product.price * quantity).toFixed(2)}
            </div>
            <div className="quantity rounded-pill px-1">
              <button onClick={() => setQuantity(Math.max(quantity - 1, 1))}>
                <i className="fa-solid fa-minus"></i>
              </button>
              <input
                type="number"
                className=" rounded-pill px-1 py-1 text-center"
                value={quantity}
                onChange={quantityHandling}
                onBlur={blurQuantityHandling}
              />
              <button onClick={() => setQuantity(quantity + 1)}>
                <i className="fa-solid fa-plus"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartProduct;
