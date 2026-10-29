import "./home.css";
import Nav from "../../components/nav/nav";
import Button from "../../components/button/button";
import Card from "../../components/card/card";
import Footer from "../../components/footer/footer";
import Follow from "../../components/follow/follow";
import { BASE_URL, SERVER_URL } from "../../config";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PageLoader } from "../../components/loading";

function Home() {
  const [topSelling, setTopSelling] = useState([]);
  const [newArrival, setNewArrival] = useState([]);
  const [loading, setLoading] = useState(true);

  const buildQuery = (sort) => {
    const params = new URLSearchParams();
    params.set("page", 1);
    params.set("inStock", "true");
    params.set("sort", sort);
    return params.toString();
  };

  useEffect(() => {
    let query = buildQuery("sold-desc");
    fetch(`${SERVER_URL}/api/products${query ? `?${query}` : ""}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.status == "success") setTopSelling(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    query = buildQuery("created_at-desc");
    fetch(`${SERVER_URL}/api/products${query ? `?${query}` : ""}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.status == "success") setNewArrival(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function scroll() {
    const main = document.querySelector(".main");
    const offset = document.querySelector("nav").offsetHeight + 2;
    const top = main.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  }
  if (loading) return <PageLoader fullScreen />;
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
            {topSelling.slice(0, 4).map((obj) => (
              <div className="col-sm-6 col-md-4 col-lg-3 mb-3" key={obj.p_id}>
                <Link
                  className="text-decoration-none"
                  to={`/product/${obj.p_id}`}
                >
                  <Card product={obj}></Card>
                </Link>
              </div>
            ))}
          </div>
        </div>
        <div className="new-products mb-3">
          <h2 className="text-uppercase mb-3">New Arrival</h2>
          <div className="row mb-2">
            {newArrival.slice(0, 4).map((obj) => (
              <div className="col-sm-6 col-md-4 col-lg-3 mb-3" key={obj.p_id}>
                <Link
                  className="text-decoration-none"
                  to={`/product/${obj.p_id}`}
                >
                  <Card product={obj}></Card>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Follow></Follow>
      <Footer></Footer>
    </>
  );
}

export default Home;
