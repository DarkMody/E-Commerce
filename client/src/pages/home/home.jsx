import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Nav from "../../components/nav/nav";
import Button from "../../components/button/button";
import Card from "../../components/card/card";
import Footer from "../../components/footer/footer";
import { ProductGridSkeleton } from "../../components/loading";
import { SERVER_URL } from "../../config";
import "./home.css";

function Home() {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [topSelling, setTopSelling] = useState([]);
  const [newArrival, setNewArrival] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingTop, setLoadingTop] = useState(true);
  const [loadingNew, setLoadingNew] = useState(true);
  const [errorTop, setErrorTop] = useState("");
  const [errorNew, setErrorNew] = useState("");

  const loadProductsBySort = async (sort) => {
    const params = new URLSearchParams({
      page: "1",
      inStock: "true",
      sort,
    });

    const res = await fetch(`${SERVER_URL}/api/products?${params.toString()}`);
    const data = await res.json();

    if (data.status !== "success" || !Array.isArray(data.data)) {
      throw new Error(data.message || `Could not load products.`);
    }
    console.log(data);
    setCategories(data.category);
    return data.data;
  };

  useEffect(() => {
    let cancelled = false;

    const loadHomeData = async () => {
      // 1. Top Selling
      const fetchTop = async () => {
        setLoadingTop(true);
        setErrorTop("");
        try {
          const products = await loadProductsBySort("sold-desc");
          if (!cancelled) setTopSelling(products);
        } catch (err) {
          if (!cancelled) {
            setErrorTop(err.message || "Failed to load top selling products.");
          }
        } finally {
          if (!cancelled) setLoadingTop(false);
        }
      };

      // 2. New Arrivals
      const fetchNew = async () => {
        setLoadingNew(true);
        setErrorNew("");
        try {
          const products = await loadProductsBySort("created_at-desc");
          if (!cancelled) setNewArrival(products);
        } catch (err) {
          if (!cancelled) {
            setErrorNew(err.message || "Failed to load new arrivals.");
          }
        } finally {
          if (!cancelled) setLoadingNew(false);
        }
      };
      await Promise.all([fetchTop(), fetchNew()]);
    };

    loadHomeData();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    navigate(
      query ? `/product?search=${encodeURIComponent(query)}` : "/product",
    );
  };

  const handleCategoryClick = (cat) => {
    if (cat.c_id) {
      navigate(
        `/product?category=${encodeURIComponent(
          JSON.stringify({ c_id: cat.c_id, name: cat.name }),
        )}`,
      );
    } else {
      navigate(`/product?search=${encodeURIComponent(cat.name)}`);
    }
  };

  const displayCategories = categories.length > 0 ? categories.slice(0, 8) : [];

  return (
    <>
      <Nav />

      <main className="home-page">
        {/* ---------- HERO SECTION (Search first) ---------- */}
        <section className="home-hero">
          <div className="home-hero__card">
            <h1 className="home-hero__headline">
              Find whatever you{" "}
              <mark className="home-hero__highlight">want</mark>
            </h1>

            <p className="home-hero__subtitle">
              Thousands of products, one search away
            </p>

            <form
              className="home-hero__search-form"
              onSubmit={handleSearch}
              role="search"
            >
              <div className="home-hero__search-bar">
                <span className="home-hero__search-icon" aria-hidden="true">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-3.5-3.5" />
                  </svg>
                </span>

                <input
                  type="search"
                  className="home-hero__search-input"
                  placeholder="Search for products"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search for products"
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="home-hero__search-btn"
                >
                  Search
                </Button>
              </div>
            </form>

            <div className="home-hero__chips" aria-label="Popular categories">
              {displayCategories.map((cat, idx) => (
                <button
                  type="button"
                  key={cat.c_id || cat.name || idx}
                  className="home-hero__chip"
                  onClick={() => handleCategoryClick(cat)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- TOP SELLING SECTION ---------- */}
        <section className="home-section">
          <div className="container">
            <div className="home-section__header">
              <div>
                <span className="home-section__eyebrow">BESTSELLERS</span>
                <h2 className="home-section__title">Top Selling</h2>
              </div>
              <Link to="/product?sort=sold-desc" className="home-section__link">
                <span>View all</span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {loadingTop ? (
              <ProductGridSkeleton count={4} />
            ) : errorTop ? (
              <div className="home-section__empty">
                <p className="mb-0 text-danger">{errorTop}</p>
              </div>
            ) : topSelling.length > 0 ? (
              <div className="row g-3 g-md-4">
                {topSelling.slice(0, 4).map((product) => (
                  <div className="col-6 col-md-4 col-lg-3" key={product.p_id}>
                    <Link
                      className="text-decoration-none h-100 d-block"
                      to={`/product/${product.p_id}`}
                    >
                      <Card product={product} />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="home-section__empty">
                <p className="mb-0">
                  No top-selling products found at this moment.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ---------- NEW ARRIVALS SECTION ---------- */}
        <section className="home-section">
          <div className="container">
            <div className="home-section__header">
              <div>
                <span className="home-section__eyebrow">JUST IN</span>
                <h2 className="home-section__title">New Arrival</h2>
              </div>
              <Link
                to="/product?sort=created_at-desc"
                className="home-section__link"
              >
                <span>View all</span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {loadingNew ? (
              <ProductGridSkeleton count={4} />
            ) : errorNew ? (
              <div className="home-section__empty">
                <p className="mb-0 text-danger">{errorNew}</p>
              </div>
            ) : newArrival.length > 0 ? (
              <div className="row g-3 g-md-4">
                {newArrival.slice(0, 4).map((product) => (
                  <div className="col-6 col-md-4 col-lg-3" key={product.p_id}>
                    <Link
                      className="text-decoration-none h-100 d-block"
                      to={`/product/${product.p_id}`}
                    >
                      <Card product={product} />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="home-section__empty">
                <p className="mb-0">No new arrivals found at this moment.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default Home;
