import "./cartProduct.css";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { SERVER_URL } from "../../config";

function CartProduct(param) {
  const product = param.product;
  const [quantity, setQuantity] = useState(product.quantity);

  const quantityHandling = async (value) => {
    if (window.loggedIn) {
      await fetch(`${SERVER_URL}/api/cart/${product.p_id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity: value }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status == "success") {
            setQuantity(value);
            param.onQuantityChange(product.p_id, value);
          } else {
            window.toast(data.status, data.message);
            if (data.status == "error") {
              let temp = data.message.split(" ");
              const maxLimit = temp[temp.length - 1];
              setQuantity(maxLimit);
              param.onQuantityChange(product.p_id, maxLimit);
            }
          }
        });
    } else {
      const response = await fetch(
        `${SERVER_URL}/api/products/${product.p_id}`,
      );
      const data = await response.json();
      if (data.data.product.quantity >= value) setQuantity(value);
      else {
        setQuantity(data.data.product.quantity);
        param.onQuantityChange(product.p_id, data.data.product.quantity);
        window.toast(
          "error",
          `The stock is just ${data.data.product.quantity}`,
        );
      }
      let cart = JSON.parse(localStorage.getItem("localCart")) || [];
      let newCart = cart.map((ele) => {
        if (ele.productId == product.p_id)
          ele.quantity = Math.min(data.data.product.quantity, value);
        return ele;
      });
      localStorage.setItem("localCart", JSON.stringify(newCart));
    }
  };

  const test = (e) => {
    const val = parseInt(e.target.value);
    setQuantity(val);
  };

  const blurQuantityHandling = (e) => {
    if (e.target.value === "" || parseInt(e.target.value) < 1) {
      quantityHandling(1);
      e.target.value = 1;
    } else quantityHandling(e.target.value);
  };

  const deleteProductFromCart = async (e) => {
    if (window.loggedIn) {
      await fetch(`${SERVER_URL}/api/cart/${product.p_id}`, {
        method: "DELETE",
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status == "success") {
            e.target.closest(".product").style.opacity = "0";
            setTimeout(() => {
              param.onRemove(product.p_id);
              e.target.closest(".product").remove();
            }, 500);
          }
          window.toast(data.status, data.message);
        });
    } else {
      let cart = JSON.parse(localStorage.getItem("localCart")) || [];
      let newCart = cart.filter((ele) => ele.productId != product.p_id);
      localStorage.setItem("localCart", JSON.stringify(newCart));

      e.target.closest(".product").style.opacity = "0";
      setTimeout(() => {
        param.onRemove(product.p_id);
        e.target.closest(".product").remove();
      }, 500);
    }
  };

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
            <div className="delete fs-4" onClick={deleteProductFromCart}>
              <i className="fa-solid fa-trash-can"></i>
            </div>
          </div>
          <div className="bottom d-flex justify-content-between align-items-center">
            <div className="fs-2 fw-bold price">
              ${(product.price * quantity).toFixed(2)}
            </div>
            <div className="quantity rounded-pill px-1">
              <button
                onClick={() => quantityHandling(Math.max(1, quantity - 1))}
              >
                <i className="fa-solid fa-minus"></i>
              </button>
              <input
                type="number"
                className=" rounded-pill px-1 py-1 text-center"
                value={quantity}
                onChange={test}
                onBlur={blurQuantityHandling}
              />
              <button onClick={() => quantityHandling(quantity + 1)}>
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
