import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { BASE_URL } from "../../config";
import Nav from "../../components/nav/nav";
import Follow from "../../components/follow/follow";
import Footer from "../../components/footer/footer";
import Button from "../../components/button/button";
import Input from "../../components/input/input";
import "./product.css";

function Product() {
  const { productId } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [product, setProducts] = useState();
  const [loading, setLoading] = useState(true);
  const [rate, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [clicked, setClicked] = useState(0);
  const [givenRate, setGivenRate] = useState(1);

  useEffect(() => {
    fetch(`${BASE_URL}/products/${productId}`)
      .then((response) => response.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      });
  }, []);

  const quantityHandling = (e) => {
    const val = parseInt(e.target.value);
    setQuantity(val);
  };
  const blurQuantityHandling = (e) => {
    if (e.target.value === "" || parseInt(e.target.value) < 1) {
      setQuantity(1);
    }
  };
  const handleClick = (val) => {
    setRating(val);
    setClicked(val);
    setTimeout(() => setClicked(0), 150);
  };

  if (loading) return <h1>Loading</h1>;
  return (
    <>
      <Nav></Nav>
      <div className="product py-5 w-100">
        <div className="row">
          <div className="col-12 col-md-6 col-lg-6 text-center">
            <div id="carouselExampleIndicators" className="carousel slide">
              <div className="carousel-indicators">
                <button
                  type="button"
                  data-bs-target="#carouselExampleIndicators"
                  data-bs-slide-to="0"
                  className="active"
                  aria-current="true"
                  aria-label="Slide 1"
                ></button>
                <button
                  type="button"
                  data-bs-target="#carouselExampleIndicators"
                  data-bs-slide-to="1"
                  aria-label="Slide 2"
                ></button>
                <button
                  type="button"
                  data-bs-target="#carouselExampleIndicators"
                  data-bs-slide-to="2"
                  aria-label="Slide 3"
                ></button>
              </div>
              <div className="carousel-inner">
                <div className="carousel-item active">
                  <img
                    src="https://static.vecteezy.com/system/resources/thumbnails/012/705/555/small_2x/men-s-shirts-mockup-design-template-mockup-free-photo.jpg"
                    className="d-block w-100"
                    alt=""
                  />
                </div>
                <div className="carousel-item">
                  <img src={product.image} className="d-block w-100" alt="" />
                </div>
                <div className="carousel-item">
                  <img src={product.image} className="d-block w-100" alt="" />
                </div>
              </div>
              <button
                className="carousel-control-prev"
                type="button"
                data-bs-target="#carouselExampleIndicators"
                data-bs-slide="prev"
              >
                <span
                  className="carousel-control-prev-icon"
                  aria-hidden="true"
                ></span>
                <span className="visually-hidden">Previous</span>
              </button>
              <button
                className="carousel-control-next"
                type="button"
                data-bs-target="#carouselExampleIndicators"
                data-bs-slide="next"
              >
                <span
                  className="carousel-control-next-icon"
                  aria-hidden="true"
                ></span>
                <span className="visually-hidden">Next</span>
              </button>
            </div>
          </div>
          <div className="col-12 col-md-6 col-lg-6">
            <h2 className="fw-bold">{product.title}</h2>
            <div className="rate fw-bold d-flex fs-6 align-items-center gap-1 mb-2">
              <div>
                <i className="fa-solid fa-star"></i>
              </div>
              <div>{product.rating.rate}</div>
              <div>({product.rating.count})</div>
            </div>
            <div className="price fw-bold fs-2">${product.price}</div>
            <div className="quantity mb-3">
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
            </div>
            <Button text="Add To Cart"></Button>
            <div className="category d-flex flex-wrap gap-2 mt-3">
              <a href="#">Clothes</a>
              <a href="#">men</a>
            </div>
            <p className="text-black-50 mt-3">{product.description}</p>
          </div>
        </div>
      </div>
      <div className="comments py-5 text-center">
        <h1>People Reviews</h1>
        <div className="make-comment">
          <div className="fs-4">Give your opinion about the product</div>
          <div className="mb-2 star-rating fs-3 text-black-50">
            {[1, 2, 3, 4, 5].map((val) => (
              <span
                key={val}
                data-val={val}
                className="star"
                onClick={() => handleClick(val)}
                onMouseEnter={() => setHovered(val)}
                onMouseLeave={() => setHovered(0)}
                style={{
                  display: "inline-block",
                  transform: clicked === val ? "scale(1.2)" : "scale(1)",
                  color: val <= (hovered || rate) ? "var(--green)" : "inherit",
                  transition: "transform 0.15s ease",
                }}
              >
                <i className="fa-solid fa-star"></i>
              </span>
            ))}
          </div>
          <div className="mb-1">
            <textarea name="" id="" placeholder="Comment"></textarea>
          </div>
          <Button text="Comment" id="submit-comment"></Button>
        </div>
        <div className="comment-list m-auto mt-3">
          <div className="comment px-3 py-2 mb-3">
            <div className="line d-flex align-items-center justify-content-between mb-2">
              <div className="d-flex align-items-center">
                <img
                  src="https://www.perfocal.com/blog/content/images/size/w960/2021/01/Perfocal_17-11-2019_TYWFAQ_100_standard-3.jpg"
                  alt=""
                />
                <span className="ms-2 fw-bold">UserName</span>
              </div>
              <div className="d-flex align-items-center">
                <div className="me-1 text-black-50">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <span
                      key={val}
                      style={{
                        color: val <= givenRate ? "var(--green)" : "inherit",
                      }}
                    >
                      <i className="fa-solid fa-star"></i>
                    </span>
                  ))}
                </div>
                <span>1 minute ago</span>
              </div>
            </div>
            <p className="text-start">
              Lorem ipsum dolor sit amet consectetur, adipisicing elit. Aut
              consequuntur eius expedita vel vero ut adipisci eos autem placeat!
              Similique fugiat id sapiente officia neque alias recusandae magnam
              debitis ab?
            </p>
          </div>
          <Button text="Show More"></Button>
        </div>
      </div>
      <Follow></Follow>
      <Footer></Footer>
    </>
  );
}
export default Product;
