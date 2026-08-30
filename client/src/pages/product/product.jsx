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
  const [product, setProducts] = useState();
  const [loading, setLoading] = useState(true);
  const [rate, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [clicked, setClicked] = useState(0);
  // const [givenRate, setGivenRate] = useState(1);
  const [comments, setComments] = useState();
  const [myComment, setMyComment] = useState();

  useEffect(() => {
    fetch(`${SERVER_URL}/api/products/${productId}`)
      .then((response) => response.json())
      .then((data) => {
        setProducts(data.data);
        setLoading(false);
      });

    // fetch(`${SERVER_URL}/api/comment/${productId}`)
    //   .then((res) => res.json())
    //   .then((comment) => {
    //     console.log(comment.data);
    //     setComments(comment.data);
    //   });
    fetch(`${SERVER_URL}/api/comment/me/${productId}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((comment) => {
        console.log(comment.data);
        if (comment.data.length) {
          setMyComment(comment.data[0]);
          setRating(comment.data[0].rate);
          setClicked(comment.data[0].rate);
        }
      });
  }, [productId]);

  useEffect(() => {
    fetch(`${SERVER_URL}/api/comment/${productId}`)
      .then((res) => res.json())
      .then((comment) => {
        console.log(comment.data);
        setComments(comment.data);
      });
  }, [productId, myComment]);

  const handleRateClick = (val) => {
    setRating(val);
    setClicked(val);
    setTimeout(() => setClicked(0), 150);
  };

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
        console.log(data);
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
        console.log(data);
        if (data.status == "success") {
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
          console.log(data);
          if (data.status == "success") {
            setMyComment();
            document.querySelector("textarea").value = "";
            setRating(0);
          }
          window.toast(data.status, data.message);
        });
    }
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
            <Button text="Add To Cart"></Button>
            <div className="category d-flex flex-wrap gap-2 mt-3">
              {product &&
                product.category.map((cat) => <a href="#">{cat.name}</a>)}
              {/* <a href="#">Clothes</a>
              <a href="#">men</a> */}
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
          <div className="buttons">
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
                      src="https://www.perfocal.com/blog/content/images/size/w960/2021/01/Perfocal_17-11-2019_TYWFAQ_100_standard-3.jpg"
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
                    <span>1 minute ago</span>
                  </div>
                </div>
                <p className="text-start">{comment.comment}</p>
              </div>
            ))}
          <Button text="Show More"></Button>
        </div>
      </div>
      <Follow></Follow>
      <Footer></Footer>
    </>
  );
}
export default Product;
