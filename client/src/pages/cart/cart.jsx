import "./cart.css";
import Nav from "../../components/nav/nav";
import Button from "../../components/button/button";
import Footer from "../../components/footer/footer";
import Follow from "../../components/follow/follow";
import { BASE_URL } from "../../config";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function Cart() {
  /*
    IF there is no products in cart
    <h2>
      Looks like you didn't choose any product yet Go and have fun 😄
    </h2>
    <Link to="/product">
      <Button text="Products Page"></Button>
    </Link>
  */
  /*const [quantity, setQuantity] = useState(1);
            const quantityHandling = (e) => {
              const val = parseInt(e.target.value);
              setQuantity(val);
            };
            const blurQuantityHandling = (e) => {
              if (e.target.value === "" || parseInt(e.target.value) < 1) {
                setQuantity(1);
              }
            };
          */
  /* <div className="quantity mb-3">
              <span className="me-2">Quantity: </span>
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
            </div> */

  const [cartProduct, setCartProduct] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE_URL}/products`)
      .then((response) => response.json())
      .then((data) => {
        setCartProduct(data);
        setLoading(false);
        console.log(data);
      });
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Nav></Nav>
      <div id="cart" className="text-center py-5">
        <h1 className="fw-bold text-uppercase mb-5">Your Cart</h1>
        <div id="product-cart">
          <div className="product"></div>
        </div>
        <Button text="Buy Now"></Button>
      </div>
      <Follow></Follow>
      <Footer></Footer>
    </>
  );
}
export default Cart;
