import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { BASE_URL, SERVER_URL } from "../../config";
import Nav from "../../components/nav/nav";
import Follow from "../../components/follow/follow";
import Footer from "../../components/footer/footer";
import Button from "../../components/button/button";
import Input from "../../components/input/input";
import "./product.css";

function Product() {
  const { productId } = useParams();
  const [product, setProduct] = useState();
  const [loading, setLoading] = useState(true);
  const [rate, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [clicked, setClicked] = useState(0);
  const [comments, setComments] = useState([]);

  // ---- pagination ----
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [myComment, setMyComment] = useState();
  const [inCart, setInCart] = useState(false);

  useEffect(() => {
    fetch(`${SERVER_URL}/api/products/${productId}`)
      .then((response) => response.json())
      .then((data) => {
        setProduct(data.data);
        setLoading(false);
      });

    if (window.loggedIn) {
      fetch(`${SERVER_URL}/api/comment/me/${productId}`, {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((comment) => {
          if (comment.data.length) {
            setMyComment(comment.data[0]);
            setRating(comment.data[0].rate);
            setClicked(comment.data[0].rate);
          }
        });
      fetch(`${SERVER_URL}/api/cart/${productId}`, {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.data.length != 0) setInCart(true);
        });
    } else {
      let cart = JSON.parse(localStorage.getItem("localCart") || "[]");
      let check = cart.some((ele) => ele.productId == productId);
      if (check) setInCart(true);
    }
  }, [productId]);
  const getComments = () => {
    const params = new URLSearchParams();
    params.set("page", page);
    const query = params.toString();

    fetch(`${SERVER_URL}/api/comment/${productId}${query ? `?${query}` : ""}`)
      .then((res) => res.json())
      .then((comment) => {
        setComments((prev) =>
          page === 1 ? comment.data : [...prev, ...comment.data],
        );
        setTotalPages(comment.pagination.totalPages ?? 1);
      });
  };
  useEffect(() => {
    getComments();
  }, [myComment, page]);

  const handleRateClick = (val) => {
    setRating(val);
    setClicked(val);
    setTimeout(() => setClicked(0), 150);
  };
  // Start Comment Handling
  const submitComment = async () => {
    const comment = document.getElementById("comment-place").value;
    await fetch(`${SERVER_URL}/api/comment/${productId}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rate, comment }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status == "success") {
          setMyComment(data.data);
          window.toast(data.status, "Comment has been added successfully");
        } else window.toast(data.status, data.message);
      });
  };

  const editComment = async () => {
    const comment = document.getElementById("comment-place").value;
    await fetch(`${SERVER_URL}/api/comment/${myComment.c_id}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rate, comment }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status == "success") {
          setPage(1);
          getComments();
        }
        window.toast(data.status, data.message);
      });
  };

  const deleteComment = async () => {
    if (window.confirm("Are you sure you want to delete comment ?")) {
      await fetch(`${SERVER_URL}/api/comment/${myComment.c_id}`, {
        method: "DELETE",
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status == "success") {
            setMyComment();
            document.querySelector("textarea").value = "";
            setRating(0);
            setPage(1);
            getComments();
          }
          window.toast(data.status, data.message);
        });
    }
  };
  // End Comment Handling

  // Start Cart Handling
  const addToCart = async () => {
    if (window.loggedIn) {
      await fetch(`${SERVER_URL}/api/cart/${productId}`, {
        method: "POST",
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status == "success") setInCart(true);
          window.toast(data.status, data.message);
        });
    } else {
      let cart = JSON.parse(localStorage.getItem("localCart") || "[]");
      let check = cart.some((ele) => ele.productId == productId);
      if (!check) {
        cart.push({ productId, quantity: 1 });
        localStorage.setItem("localCart", JSON.stringify(cart));
        setInCart(true);
        window.toast("success", "Product has been added to your cart");
      } else {
        window.toast("invalid", "The product is in your cart");
      }
    }
  };

  const deleteFromCart = async () => {
    if (window.loggedIn) {
      await fetch(`${SERVER_URL}/api/cart/${productId}`, {
        method: "DELETE",
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status == "success") {
            setInCart(false);
          }
          window.toast(data.status, data.message);
        });
    } else {
      let cart = JSON.parse(localStorage.getItem("localCart") || "[]");
      let newCart = cart.filter((ele) => ele.productId != productId);
      localStorage.setItem("localCart", JSON.stringify(newCart));
      setInCart(false);
      // window.toast("success", "Product has been deleted from your cart");
    }
  };
  // End Cart Handling

  const timeAgo = (created) => {
    const now = Date.now();
    const old = new Date(created).getTime();
    const secDiff = Math.floor((now - old) / 1000);
    const intervals = [
      { label: "Y", seconds: 31536000 },
      { label: "M", seconds: 2592000 },
      { label: "W", seconds: 604800 },
      { label: "D", seconds: 86400 },
      { label: "H", seconds: 3600 },
      { label: "Min", seconds: 60 },
      { label: "Sec", seconds: 1 },
    ];

    if (secDiff < 5) return "just now";

    for (const interval of intervals) {
      const count = Math.floor(secDiff / interval.seconds);
      if (count >= 1) {
        return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
      }
    }

    return "just now";
  };

  const showMoreClick = async () => {
    setPage((prev) => prev + 1);
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
                {product &&
                  product.image.map((image, index) => (
                    <button
                      type="button"
                      data-bs-target="#carouselExampleIndicators"
                      data-bs-slide-to={index}
                      className={index == 0 ? "active" : ""}
                      aria-current={index == 0 ? "true" : ""}
                      aria-label={`Slide ` + (index + 1)}
                    ></button>
                  ))}
              </div>
              <div className="carousel-inner">
                {product &&
                  product.image.map((img, index) => (
                    <div
                      className={
                        `carousel-item ` + (index == 0 ? "active" : "")
                      }
                    >
                      <img
                        src={`${SERVER_URL}/uploads/${img.image}`}
                        className="d-block w-100"
                        alt=""
                      />
                    </div>
                  ))}
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
            <h2 className="fw-bold">{product.product.name}</h2>
            <div className="rate fw-bold d-flex fs-6 align-items-center gap-1 mb-2">
              <div>
                <i className="fa-solid fa-star"></i>
              </div>
              <div>{product.product.rate}</div>
              <div>({product.product.people})</div>
            </div>
            <div className="price fw-bold fs-2 mb-2">
              ${product.product.price}
            </div>
            {inCart ? (
              <Button
                text="Delete From Cart"
                id="delete-from-cart"
                onclick={deleteFromCart}
              ></Button>
            ) : (
              <Button text="Add To Cart" onclick={addToCart}></Button>
            )}
            <div className="category d-flex flex-wrap gap-2 mt-3">
              {product &&
                product.category.map((cat) => (
                  <a
                    href={`#/product?category=${encodeURIComponent(JSON.stringify(cat))}`}
                    id={cat.c_id}
                  >
                    {cat.name}
                  </a>
                ))}
            </div>
            <p className="text-black-50 mt-3">{product.product.description}</p>
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
                onClick={() => handleRateClick(val)}
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
            <textarea
              name=""
              id="comment-place"
              placeholder="Comment"
              defaultValue={myComment ? myComment.comment : ""}
            >
              {/* {myComment ? myComment.comment : ""} */}
            </textarea>
          </div>
          <div className="buttons d-flex gap-1 justify-content-center">
            <Button
              text={myComment ? "Edit Comment" : "Comment"}
              className="mx-1"
              onclick={myComment ? editComment : submitComment}
              id="submit-comment"
            ></Button>
            {myComment && (
              <Button
                text="Delete Comment"
                className="mx-1"
                onclick={deleteComment}
                id="delete-comment"
              ></Button>
            )}
          </div>
        </div>

        <div className="comment-list m-auto mt-3">
          {comments &&
            comments.map((comment) => (
              <div className="comment px-3 py-2 mb-3" id={comment.c_id}>
                <div className="line d-flex align-items-center justify-content-between mb-2">
                  <div className="d-flex align-items-center">
                    <img
                      src={`${SERVER_URL}/uploads/${comment.image}`}
                      alt=""
                    />
                    <span className="ms-2 fw-bold">{comment.name}</span>
                  </div>
                  <div className="d-flex align-items-center">
                    <div className="me-1 text-black-50">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <span
                          key={val}
                          style={{
                            color:
                              val <= comment.rate ? "var(--green)" : "inherit",
                          }}
                        >
                          <i className="fa-solid fa-star"></i>
                        </span>
                      ))}
                    </div>
                    <span>{timeAgo(comment.created_at)}</span>
                  </div>
                </div>
                <p className="text-start">{comment.comment}</p>
              </div>
            ))}
          {page < totalPages && (
            <Button text="Show More" onclick={showMoreClick}></Button>
          )}
        </div>
      </div>
      <Follow></Follow>
      <Footer></Footer>
    </>
  );
}
export default Product;
