import "./sellerProducts.css";
import Nav from "../../components/nav/nav";
import Button from "../../components/button/button";
import Card from "../../components/card/card";
import Footer from "../../components/footer/footer";
import Follow from "../../components/follow/follow";
import { BASE_URL, SERVER_URL } from "../../config";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function MyProduct() {
  const [myProducts, setMyProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myProductCount, setProductCount] = useState(0);

  useEffect(() => {
    fetch(`${SERVER_URL}/api/seller/product`, {
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => {
        setMyProducts(data.data);
        setProductCount(data.data.length);
        setLoading(false);
      });
  }, []);

  const onRemoveHandling = async (ele) => {
    if (
      window.confirm("Are you sure you want to delete this product ?") == true
    ) {
      const id = ele.target.closest(".my-product").children[1].children[0].id;
      await fetch(`${SERVER_URL}/api/product/delete/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status == "success") {
            const parent = ele.target.closest(".my-product");
            parent.style.opacity = "0";
            setTimeout(() => {
              setProductCount(myProductCount - 1);
              parent.remove();
            }, 500);
          }
          window.toast(data.status, data.message);
        });
    }
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
      <div className="my-products pb-5 px-5 pt-5 text-center">
        {myProductCount ? (
          <div className="row mb-2">
            {myProducts.map((obj) => (
              <div className="col-sm-6 col-md-4 col-lg-3 mb-3 my-product">
                <span
                  className="product-delete fs-3"
                  onClick={onRemoveHandling}
                >
                  <i className="fa-solid fa-trash-can"></i>
                </span>
                <Link
                  className="text-decoration-none"
                  to={`/product/edit/${obj.p_id}`}
                >
                  <Card product={obj} sellerPage={true}></Card>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <h2 className="mb-3 text-center">You didn't add any product</h2>
        )}
        <Link to={`/product/add`}>
          <Button text="Add New Product"></Button>
        </Link>
      </div>
      <Follow></Follow>
      <Footer></Footer>
    </>
  );
}

export default MyProduct;
