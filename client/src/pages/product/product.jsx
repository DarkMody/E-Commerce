import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import Nav from "../../components/nav/nav";
import Footer from "../../components/footer/footer";
import Button from "../../components/button/button";
import Pagination from "../../components/pagination/Pagination";
import { Skeleton } from "../../components/loading";
import { SERVER_URL } from "../../config";
import "./product.css";

/* ---------- Helpers ---------- */

const timeAgo = (created) => {
  if (!created) return "recently";
  const now = Date.now();
  const old = new Date(created).getTime();
  const secDiff = Math.floor((now - old) / 1000);

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
  ];

  if (secDiff < 30) return "just now";

  for (const interval of intervals) {
    const count = Math.floor(secDiff / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
    }
  }

  return "just now";
};

function Product() {
  const { productId } = useParams();

  // Product Data
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Gallery
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Cart Status
  const [inCart, setInCart] = useState(false);
  const [cartBusy, setCartBusy] = useState(false);

  // Reviews / Comments
  const [comments, setComments] = useState([]);
  const [commentPage, setCommentPage] = useState(1);
  const [commentTotalPages, setCommentTotalPages] = useState(1);
  const [commentTotalItems, setCommentTotalItems] = useState(0);
  const [commentsLoading, setCommentsLoading] = useState(false);

  // User's own review
  const [myComment, setMyComment] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const reviewsSectionRef = useRef(null);
  const isLoggedIn = Boolean(window.loggedIn);
  const [boughtIt, setBoughtIt] = useState(false);

  /* ---------- 1. Fetch Product Data ---------- */
  useEffect(() => {
    let cancelled = false;

    const loadProduct = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${SERVER_URL}/api/products/${productId}`);
        const data = await res.json();
        if (data.status === "success" && data.data) {
          if (!cancelled) {
            setProductData(data.data);
            setActiveImageIndex(0);
          }
        } else {
          throw new Error(data.message || "Product not found.");
        }
      } catch (err) {
        if (!cancelled)
          setError(err.message || "Failed to load product details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProduct();

    // Check cart status
    if (isLoggedIn) {
      fetch(`${SERVER_URL}/api/cart/${productId}`, { credentials: "include" })
        .then((res) => res.json())
        .then((data) => {
          if (!cancelled && data.data && data.data.length > 0) {
            setInCart(true);
          }
        })
        .catch(() => {});
      fetch(`${SERVER_URL}/api/product/me/${productId}`, {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          if (!cancelled && data.data) {
            setBoughtIt(true);
          }
        });
      // Fetch user's own comment if logged in
      fetch(`${SERVER_URL}/api/comment/me/${productId}`, {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          if (!cancelled && data.data && data.data.length > 0) {
            const userComment = data.data[0];
            setMyComment(userComment);
            setRating(userComment.rate || 0);
            setCommentText(userComment.comment || "");
          }
        })
        .catch(() => {});
    } else {
      try {
        const cart = JSON.parse(localStorage.getItem("localCart") || "[]");
        if (cart.some((item) => String(item.productId) === String(productId))) {
          setInCart(true);
        }
      } catch {
        setInCart(false);
      }
    }

    return () => {
      cancelled = true;
    };
  }, [productId, isLoggedIn]);

  /* ---------- 2. Fetch Comments (Paginated) ---------- */
  const loadComments = useCallback(
    async (pageToLoad) => {
      setCommentsLoading(true);
      try {
        const res = await fetch(
          `${SERVER_URL}/api/comment/${productId}?page=${pageToLoad}`,
        );
        const data = await res.json();
        if (data.status === "success" && Array.isArray(data.data)) {
          setComments(data.data);
          if (data.pagination) {
            setCommentTotalPages(Math.ceil(data.pagination.totalPages || 1));
            setCommentTotalItems(data.pagination.totalItems || 0);
          }
        }
      } catch {
        setComments([]);
      } finally {
        setCommentsLoading(false);
      }
    },
    [productId],
  );

  useEffect(() => {
    loadComments(commentPage);
  }, [commentPage, loadComments]);

  const handleCommentPageChange = (newPage) => {
    setCommentPage(newPage);
    if (reviewsSectionRef.current) {
      reviewsSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  /* ---------- 3. Cart Actions ---------- */
  const handleAddToCart = async () => {
    setCartBusy(true);
    if (isLoggedIn) {
      try {
        const res = await fetch(`${SERVER_URL}/api/cart/${productId}`, {
          method: "POST",
          credentials: "include",
        });
        const data = await res.json();
        if (data.status === "success") {
          setInCart(true);
          window.toast("success", "Added to your cart!");
        } else {
          window.toast("error", data.message || "Could not add to cart.");
        }
      } catch {
        window.toast("error", "Network error. Try again.");
      } finally {
        setCartBusy(false);
      }
    } else {
      try {
        const cart = JSON.parse(localStorage.getItem("localCart") || "[]");
        if (
          !cart.some((item) => String(item.productId) === String(productId))
        ) {
          cart.push({ productId, quantity: 1 });
          localStorage.setItem("localCart", JSON.stringify(cart));
          setInCart(true);
          window.toast("success", "Added to your cart!");
        }
      } catch {
        window.toast("error", "Could not update cart.");
      } finally {
        setCartBusy(false);
      }
    }
  };

  const handleDeleteFromCart = async () => {
    setCartBusy(true);
    if (isLoggedIn) {
      try {
        const res = await fetch(`${SERVER_URL}/api/cart/${productId}`, {
          method: "DELETE",
          credentials: "include",
        });
        const data = await res.json();
        if (data.status === "success") {
          setInCart(false);
          window.toast("success", "Removed from your cart.");
        } else {
          window.toast("error", data.message || "Could not remove product.");
        }
      } catch {
        window.toast("error", "Network error. Try again.");
      } finally {
        setCartBusy(false);
      }
    } else {
      try {
        const cart = JSON.parse(localStorage.getItem("localCart") || "[]");
        const updated = cart.filter(
          (item) => String(item.productId) !== String(productId),
        );
        localStorage.setItem("localCart", JSON.stringify(updated));
        setInCart(false);
        window.toast("success", "Removed from your cart.");
      } catch {
        window.toast("error", "Could not update cart.");
      } finally {
        setCartBusy(false);
      }
    }
  };

  /* ---------- 4. Review Actions ---------- */
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (rating <= 0) {
      window.toast("invalid", "Please choose a rating between 1 and 5 stars.");
      return;
    }
    if (!commentText.trim()) {
      window.toast("invalid", "Please write a review comment.");
      return;
    }

    setSubmittingReview(true);
    try {
      const url = myComment
        ? `${SERVER_URL}/api/comment/${myComment.c_id}`
        : `${SERVER_URL}/api/comment/${productId}`;
      const method = myComment ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rate: rating, comment: commentText.trim() }),
      });
      const data = await res.json();

      if (data.status === "success") {
        window.toast(
          "success",
          myComment ? "Review updated!" : "Review submitted!",
        );
        setMyComment(
          data.data || {
            c_id: myComment?.c_id,
            rate: rating,
            comment: commentText,
          },
        );
        setCommentPage(1);
        loadComments(1);
      } else {
        window.toast("error", data.message || "Failed to submit review.");
      }
    } catch {
      window.toast("error", "Could not save review. Try again later.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReviewDelete = async () => {
    if (
      !myComment ||
      !window.confirm("Are you sure you want to delete your review?")
    ) {
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/comment/${myComment.c_id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();

      if (data.status === "success") {
        window.toast("success", "Review deleted.");
        setMyComment(null);
        setRating(0);
        setCommentText("");
        setCommentPage(1);
        loadComments(1);
      } else {
        window.toast("error", data.message || "Could not delete review.");
      }
    } catch {
      window.toast("error", "Network error. Try again later.");
    } finally {
      setSubmittingReview(false);
    }
  };

  /* ---------- Loading Skeleton State ---------- */
  if (loading) {
    return (
      <>
        <Nav />
        <main className="product-page py-5">
          <div className="container">
            <div className="row g-5">
              <div className="col-12 col-lg-6">
                <Skeleton height="460px" rounded="16px" className="mb-3" />
                <div className="d-flex gap-2">
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton
                      key={i}
                      width="68px"
                      height="68px"
                      rounded="10px"
                    />
                  ))}
                </div>
              </div>
              <div className="col-12 col-lg-6 d-flex flex-column gap-3">
                <Skeleton width="40%" height="28px" rounded="999px" />
                <Skeleton width="85%" height="42px" />
                <Skeleton width="30%" height="24px" />
                <Skeleton width="45%" height="46px" className="my-2" />
                <Skeleton width="100%" height="100px" />
                <Skeleton
                  width="50%"
                  height="48px"
                  rounded="999px"
                  className="mt-3"
                />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  /* ---------- Error State ---------- */
  if (error || !productData || !productData.product) {
    return (
      <>
        <Nav />
        <main className="product-page py-5">
          <div className="container text-center py-5">
            <h2 className="fw-bold mb-3">Product Not Found</h2>
            <p className="text-muted mb-4">
              {error || "The product you're looking for doesn't exist."}
            </p>
            <Link to="/product">
              <Button variant="primary">Browse All Products</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const {
    product,
    image: images = [],
    category: categories = [],
  } = productData;
  const inStock = Number(product.quantity) > 0;
  const currentImageUrl =
    images.length > 0 && images[activeImageIndex]
      ? `${SERVER_URL}/uploads/${images[activeImageIndex].image}`
      : "";

  return (
    <>
      <Nav />

      <main className="product-page py-4 py-md-5">
        <div className="container">
          {/* Breadcrumb / Back Link */}
          <div className="mb-4">
            <Link
              to="/product"
              className="text-decoration-none text-muted d-inline-flex align-items-center gap-2 small fw-semibold"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span>Back to all products</span>
            </Link>
          </div>

          <div className="row g-4 g-lg-5">
            {/* ========================================================
               LEFT COLUMN: MODERN IMAGE SHOWCASE & THUMBNAILS
               ======================================================== */}
            <div className="col-12 col-lg-6">
              <div className="product-gallery">
                {/* Main Large Image Stage */}
                <div className="product-gallery__stage">
                  {currentImageUrl ? (
                    <>
                      <img
                        className="product-gallery__backdrop"
                        src={currentImageUrl}
                        alt=""
                        aria-hidden="true"
                      />
                      <img
                        className="product-gallery__main-img"
                        src={currentImageUrl}
                        alt={product.name}
                      />
                    </>
                  ) : (
                    <div className="text-muted p-5">No image available</div>
                  )}

                  {/* Previous / Next Floating Arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        className="product-gallery__nav-btn product-gallery__nav-prev"
                        onClick={() =>
                          setActiveImageIndex((prev) =>
                            prev === 0 ? images.length - 1 : prev - 1,
                          )
                        }
                        aria-label="Previous image"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <polyline points="15 18 9 12 15 6" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        className="product-gallery__nav-btn product-gallery__nav-next"
                        onClick={() =>
                          setActiveImageIndex((prev) =>
                            prev === images.length - 1 ? 0 : prev + 1,
                          )
                        }
                        aria-label="Next image"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>

                      {/* Image Counter Badge */}
                      <span className="product-gallery__counter">
                        {activeImageIndex + 1} / {images.length}
                      </span>
                    </>
                  )}
                </div>

                {/* Thumbnails Row */}
                {images.length > 1 && (
                  <div
                    className="product-gallery__thumbs"
                    role="tablist"
                    aria-label="Product thumbnails"
                  >
                    {images.map((img, idx) => (
                      <button
                        type="button"
                        key={img.img_id || idx}
                        className={`product-gallery__thumb ${
                          idx === activeImageIndex ? "is-active" : ""
                        }`}
                        onClick={() => setActiveImageIndex(idx)}
                        onMouseEnter={() => setActiveImageIndex(idx)}
                        aria-label={`View photo ${idx + 1}`}
                      >
                        <img
                          src={`${SERVER_URL}/uploads/${img.image}`}
                          alt=""
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ========================================================
               RIGHT COLUMN: PRODUCT DETAILS & ADD TO CART
               ======================================================== */}
            <div className="col-12 col-lg-6">
              <div className="product-details">
                {/* Categories */}
                {categories.length > 0 && (
                  <div className="product-category-pills">
                    {categories.map((cat) => (
                      <Link
                        key={cat.c_id}
                        to={`/product?category=${encodeURIComponent(
                          JSON.stringify({ c_id: cat.c_id, name: cat.name }),
                        )}`}
                        className="product-category-pill"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Title */}
                <h1 className="product-title">{product.name}</h1>

                {/* Seller */}
                {product.seller_name && (
                  <div className="product-seller">
                    Sold by:{" "}
                    <span className="fw-semibold text-body">
                      {product.seller_name}
                    </span>
                  </div>
                )}

                {/* Rating Bar */}
                <div className="product-rating-row">
                  <div className="product-rating-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill={
                          star <= Math.round(Number(product.rate || 0))
                            ? "currentColor"
                            : "none"
                        }
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>
                  <span className="product-rating-score">
                    {Number(product.rate || 0).toFixed(1)}
                  </span>
                  <span className="product-rating-count">
                    ({product.people || 0} reviews)
                  </span>
                </div>

                {/* Price */}
                {Number(product.discount) > 0 ? (
                  <div className="d-flex align-items-baseline gap-3 flex-wrap">
                    <span className="product-price">
                      $
                      {(
                        Number(product.price) *
                        (1 - Number(product.discount) / 100)
                      ).toFixed(2)}
                    </span>
                    <span className="product-original-price text-decoration-line-through text-muted fs-4">
                      ${Number(product.price).toFixed(2)}
                    </span>
                    <span className="product-discount-badge">
                      -{product.discount}%
                    </span>
                  </div>
                ) : (
                  <div className="product-price">
                    ${Number(product.price).toFixed(2)}
                  </div>
                )}

                {/* Stock Status Badge */}
                <div
                  className={`product-stock-badge ${
                    inStock ? "in-stock" : "out-of-stock"
                  }`}
                >
                  {inStock ? (
                    <>
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>In Stock ({product.quantity} units available)</span>
                    </>
                  ) : (
                    <>
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                      <span>Currently Out of Stock</span>
                    </>
                  )}
                </div>

                {/* Description */}
                <p className="product-description">{product.description}</p>

                {/* Add / Remove from Cart Action (Choice A) */}
                <div className="product-actions pt-2">
                  {inCart ? (
                    <Button
                      variant="danger"
                      size="lg"
                      loading={cartBusy}
                      onClick={handleDeleteFromCart}
                      icon={
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      }
                    >
                      Remove from Cart
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="lg"
                      featured
                      disabled={!inStock}
                      loading={cartBusy}
                      onClick={handleAddToCart}
                      icon={
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="9" cy="21" r="1" />
                          <circle cx="20" cy="21" r="1" />
                          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                        </svg>
                      }
                    >
                      {inStock ? "Add to Cart" : "Out of Stock"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
             CUSTOMER REVIEWS & COMMENTS SECTION (WITH PAGINATION)
             ======================================================== */}
          <section className="product-reviews-section" ref={reviewsSectionRef}>
            <div className="row g-4">
              {/* Reviews Summary Header Card */}
              <div className="col-12 col-md-5 col-lg-4">
                <div className="reviews-header-card">
                  <h4 className="fw-bold mb-3">Customer Ratings</h4>
                  <div className="d-flex align-items-baseline gap-3 mb-2">
                    <div className="reviews-score-big">
                      {Number(product.rate || 0).toFixed(1)}
                    </div>
                    <div>
                      <div className="product-rating-stars mb-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill={
                              star <= Math.round(Number(product.rate || 0))
                                ? "currentColor"
                                : "none"
                            }
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        ))}
                      </div>
                      <div className="text-muted small">
                        Based on {commentTotalItems || product.people || 0}{" "}
                        reviews
                      </div>
                    </div>
                  </div>
                </div>

                {/* Add / Edit Review Card */}
                {isLoggedIn && boughtIt ? (
                  <div className="review-form-card">
                    <h5 className="review-form-title">
                      {myComment ? "Edit Your Review" : "Leave a Review"}
                    </h5>
                    <form onSubmit={handleReviewSubmit}>
                      <div className="mb-2">
                        <label className="form-label small text-muted">
                          Your Rating:
                        </label>
                        <div
                          className="review-star-picker"
                          role="radiogroup"
                          aria-label="Rating stars"
                        >
                          {[1, 2, 3, 4, 5].map((val) => {
                            const isLit = val <= (hoveredRating || rating);
                            return (
                              <button
                                type="button"
                                key={val}
                                className={`review-star-btn ${isLit ? "is-lit" : ""}`}
                                onClick={() => setRating(val)}
                                onMouseEnter={() => setHoveredRating(val)}
                                onMouseLeave={() => setHoveredRating(0)}
                                aria-label={`Rate ${val} stars`}
                              >
                                <svg
                                  width="26"
                                  height="26"
                                  viewBox="0 0 24 24"
                                  fill={isLit ? "currentColor" : "none"}
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                >
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mb-3">
                        <textarea
                          className="review-textarea"
                          placeholder="What did you think of this product?"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          rows="3"
                          required
                        />
                      </div>

                      <div className="d-flex gap-2">
                        <Button
                          type="submit"
                          variant="primary"
                          loading={submittingReview}
                          className="flex-grow-1"
                        >
                          {myComment ? "Update Review" : "Submit Review"}
                        </Button>
                        {myComment && (
                          <Button
                            type="button"
                            variant="danger"
                            loading={submittingReview}
                            onClick={handleReviewDelete}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </form>
                  </div>
                ) : !isLoggedIn ? (
                  <div className="review-form-card text-center py-4">
                    <p className="text-muted small mb-3">
                      Have you purchased or tried this product? Sign in to share
                      your thoughts.
                    </p>
                    <Link to="/login">
                      <Button variant="outline" size="sm">
                        Sign in to review
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="review-form-card text-center py-4">
                    <p className="text-muted small mb-3">
                      You have to buy the product to comment. Buy and tell use
                      your opinion.
                    </p>
                  </div>
                )}
              </div>

              {/* Reviews List Column */}
              <div className="col-12 col-md-7 col-lg-8">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="fw-bold mb-0">Reviews</h4>
                  <span className="text-muted small">
                    Page {commentPage} of {commentTotalPages}
                  </span>
                </div>

                {commentsLoading ? (
                  <div className="d-flex flex-column gap-3">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="review-card p-3">
                        <div className="d-flex gap-3 mb-2">
                          <Skeleton width="42px" height="42px" rounded="50%" />
                          <div className="flex-grow-1">
                            <Skeleton
                              width="140px"
                              height="18px"
                              className="mb-1"
                            />
                            <Skeleton width="80px" height="14px" />
                          </div>
                        </div>
                        <Skeleton width="100%" height="40px" />
                      </div>
                    ))}
                  </div>
                ) : comments.length > 0 ? (
                  <>
                    <div className="d-flex flex-column gap-3">
                      {comments.map((comment) => (
                        <article key={comment.c_id} className="review-card">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <div className="d-flex align-items-center gap-2">
                              {comment.image ? (
                                <img
                                  className="review-avatar"
                                  src={`${SERVER_URL}/uploads/${comment.image}`}
                                  alt=""
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="review-avatar-placeholder">
                                  {comment.name
                                    ? comment.name.charAt(0).toUpperCase()
                                    : "U"}
                                </div>
                              )}
                              <div>
                                <div className="review-author">
                                  {comment.name || "Customer"}
                                </div>
                                <div className="product-rating-stars">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <svg
                                      key={s}
                                      width="14"
                                      height="14"
                                      viewBox="0 0 24 24"
                                      fill={
                                        s <= Number(comment.rate)
                                          ? "currentColor"
                                          : "none"
                                      }
                                      stroke="currentColor"
                                      strokeWidth="1.5"
                                    >
                                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                    </svg>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <span className="review-time">
                              {timeAgo(comment.created_at)}
                            </span>
                          </div>
                          <p className="review-text">{comment.comment}</p>
                        </article>
                      ))}
                    </div>

                    {/* Integrated Theme-Aware Comments Pagination */}
                    <Pagination
                      page={commentPage}
                      totalPages={commentTotalPages}
                      onChange={handleCommentPageChange}
                    />
                  </>
                ) : (
                  <div className="review-card text-center py-5">
                    <p className="text-muted mb-0">
                      No reviews yet for this product. Be the first to leave a
                      review!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default Product;
