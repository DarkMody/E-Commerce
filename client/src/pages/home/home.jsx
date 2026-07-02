import "./home.css";
import Nav from "../../components/nav/nav";
import Button from "../../components/button/button";
import Card from "../../components/card/card";
import Footer from "../../components/footer/footer";
import Follow from "../../components/follow/follow";
import { BASE_URL } from "../../config";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`${BASE_URL}/products`)
      .then((response) => response.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      });
  }, []);

  function scroll() {
    const main = document.querySelector(".main");
    const offset = document.querySelector("nav").offsetHeight + 2;
    const top = main.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  }
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
      <div className="welcome d-flex justify-content-center align-items-center mb-3">
        <div className="text-center">
          <div className="title fs-1 fw-bold">Welcome To DarkZon</div>
          <p className="fs-3 text-black-50 mb-5">
            The best place to find whatever you want with the best prices
          </p>
          <Button
            text="Start Shoping"
            id="welcome-btn"
            onclick={scroll}
          ></Button>
        </div>
      </div>
      <div className="main text-center">
        <div className="best-products mb-3">
          <h2 className="text-uppercase mb-3">Top Selling</h2>
          <div className="row mb-2">
            {products
              .sort((a, b) => b.rating.count - a.rating.count)
              .slice(0, 4)
              .map((obj) => (
                <div className="col-sm-6 col-md-4 col-lg-3 mb-3" key={obj.id}>
                  <Link
                    className="text-decoration-none"
                    to={`/product/${obj.id}`}
                  >
                    <Card product={obj}></Card>
                  </Link>
                </div>
              ))}
          </div>
          <Button text="Show More"></Button>
        </div>
        <div className="new-products mb-3">
          <h2 className="text-uppercase mb-3">New Arrival</h2>
          <div className="row mb-2">
            {products
              .sort((a, b) => b.rating.rate - a.rating.rate)
              .slice(0, 4)
              .map((obj) => (
                <div className="col-sm-6 col-md-4 col-lg-3 mb-3" key={obj.id}>
                  <Card product={obj}></Card>
                </div>
              ))}
          </div>
          <Button text="Show More"></Button>
        </div>
      </div>
      <Follow></Follow>
      <Footer></Footer>
    </>
  );
}

export default Home;
