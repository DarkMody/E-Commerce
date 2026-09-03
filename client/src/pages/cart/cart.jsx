import "./cart.css";
import Nav from "../../components/nav/nav";
import Button from "../../components/button/button";
import Footer from "../../components/footer/footer";
import Follow from "../../components/follow/follow";
import CartProduct from "../../components/cartProduct/cartProduct";
import { BASE_URL, SERVER_URL } from "../../config";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function Cart() {
  const [cartProduct, setCartProduct] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (window.loggedIn) {
      fetch(`${SERVER_URL}/api/cart`, {
        credentials: "include",
      })
        .then((response) => response.json())
        .then((data) => {
          setCartProduct(data.data);
          setCartCount(data.data.length);
          setLoading(false);
        });
    } else {
      const fetchFunction = async () => {
        let cart = JSON.parse(localStorage.getItem("localCart")) || [];
        try {
          const fetchPromises = cart.map(async (product) => {
            const response = await fetch(
              `${SERVER_URL}/api/products/${product.productId}`,
            );
            const data = await response.json();

            if (data.status === "success") {
              return {
                ...data.data.product,
                ...data.data.image[0],
                quantity: product.quantity,
              };
            }
            return null;
          });
          const results = await Promise.all(fetchPromises);
          const validProducts = results.filter((product) => product !== null);

          setCartProduct(validProducts);
          setCartCount(validProducts.length);
        } finally {
          setLoading(false);
        }
      };
      fetchFunction();
    }
  }, []);

  const onRemoveHandling = () => {
    setCartCount(cartCount - 1);
  };

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
        <h1 className="fw-bold text-uppercase mb-3">Your Cart</h1>
        {cartCount ? (
          <>
            <div
              id="product-cart"
              className="d-flex flex-column justify-content-center align-items-center gap-3 mb-3"
            >
              {cartProduct.map((product) => (
                <CartProduct
                  product={product}
                  onRemove={onRemoveHandling}
                ></CartProduct>
              ))}
            </div>
            <Link to="/cart/pay">
              <Button text="Buy Now"></Button>
            </Link>
          </>
        ) : (
          <>
            <h2 className="mb-3">
              Looks like you didn't choose any product yet Go and have fun 😄
            </h2>
            <Link to="/product">
              <Button text="Products Page"></Button>
            </Link>
          </>
        )}
      </div>
      <Follow></Follow>
      <Footer></Footer>
    </>
  );
}
export default Cart;
