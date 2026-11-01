import "./historyOrder.css";
import Nav from "../../components/nav/nav";
import Footer from "../../components/footer/footer";
import OrderProduct from "../../components/orderProduct/orderProduct";
import { SERVER_URL } from "../../config";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
// import { Link } from "react-router-dom";

function HistoryOrder() {
  const [orderProduct, setOrderProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const totalPrice = orderProduct
    ? orderProduct.reduce((sum, p) => sum + p.price * p.ordered_quantity, 0)
    : -1;
  const { o_id } = useParams();
  useEffect(() => {
    fetch(`${SERVER_URL}/api/order/product/${o_id}`, {
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status == "success") {
          setOrderProduct(data.data);
        } else window.toast(data.status, data.message);
        setLoading(false);
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
      {totalPrice == -1 ? (
        <div>Nope</div>
      ) : (
        <div id="cart" className="text-center py-5">
          <h1 className="fw-bold text-uppercase mb-3">Your Cart</h1>
          <div
            id="product-cart"
            className="d-flex flex-column justify-content-center align-items-center gap-3 mb-3"
          >
            {orderProduct.map((product) => (
              <OrderProduct key={product.p_id} product={product} />
            ))}
          </div>
          <div className="fs-3 fw-bold mb-3">
            Total Price : ${totalPrice.toFixed(2)}
          </div>
        </div>
      )}

      <Footer></Footer>
    </>
  );
}
export default HistoryOrder;
