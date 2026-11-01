import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Nav from "../../components/nav/nav";
import Card from "../../components/card/card";
import Footer from "../../components/footer/footer";
import Button from "../../components/button/button";
import Pagination from "../../components/pagination/Pagination";
import { ProductGridSkeleton } from "../../components/loading";
import { SERVER_URL } from "../../config";
import "./products.css";

/* ---------- Data loading helpers ---------- */

const loadCategoriesData = async () => {
  try {
    const res = await fetch(`${SERVER_URL}/api/category`);
    const data = await res.json();
    if (data.status === "success" && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch {
    return [];
  }
};

const fetchProductsData = async (queryString) => {
  const url = `${SERVER_URL}/api/products${queryString ? `?${queryString}` : ""}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== "success") {
    throw new Error(data.message || "Failed to load products.");
  }
  return data;
};

const RATING_LEVELS = [5, 4, 3, 2, 1];

const STOCK_OPTIONS = [
  { label: "All Products", value: "" },
  { label: "In Stock Only", value: "true" },
  { label: "Out of Stock", value: "false" },
];

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  const searchQuery = searchParams.get("search") || "";
  const sortParam = searchParams.get("sort") || "default";

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Sorting
  const [sortBy, setSortBy] = useState(sortParam);

  // Categories
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryPickerRef = useRef(null);

  // Price bounds from backend
  const [priceBounds, setPriceBounds] = useState({ min: 0, max: 1000 });

  // Draft filter state (controlled inputs, applied on click)
  const [draft, setDraft] = useState({
    minPrice: "",
    maxPrice: "",
    minRate: "",
    inStock: "",
  });

  // Mobile drawer state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Parse category parameter from URL (e.g. from Home page chips)
  const parseInitialCategory = () => {
    const catRaw = searchParams.get("category");
    if (!catRaw) return [];
    try {
      const parsed = JSON.parse(catRaw);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [];
    }
  };

  // Build query string for API
  const buildQuery = useCallback(
    (filters, sort, catsToUse, pageToUse) => {
      const params = new URLSearchParams();
      const currentCats = catsToUse ?? selectedCategories;
      const currentPage = pageToUse ?? page;

      if (searchQuery) params.set("search", searchQuery);

      currentCats.forEach((cat) => {
        if (cat.c_id) params.append("category", cat.c_id);
      });

      if (filters.minPrice !== "") params.set("minPrice", filters.minPrice);
      if (filters.maxPrice !== "") params.set("maxPrice", filters.maxPrice);
      if (filters.minRate !== "") params.set("minRate", filters.minRate);
      if (filters.inStock !== "") params.set("inStock", filters.inStock);
      if (sort && sort !== "default") params.set("sort", sort);

      params.set("page", currentPage);
      return params.toString();
    },
    [selectedCategories, searchQuery, page],
  );

  // Fetch products controller with async/await and cancellation
  const loadProducts = useCallback(
    async (filters, sort, cats, pageNum) => {
      setLoading(true);
      setError("");
      try {
        const query = buildQuery(filters, sort, cats, pageNum);
        const data = await fetchProductsData(query);

        setProducts(data.data || []);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
          setTotalItems(data.pagination.totalItems || 0);
        }

        // Update price bounds from backend response
        if (data.price && data.price.length > 0) {
          const rawMin = Number(data.price[0].min ?? 0);
          const rawMax = Number(data.price[0].max ?? 1000);
          if (!isNaN(rawMin) && !isNaN(rawMax) && rawMax >= rawMin) {
            setPriceBounds({ min: rawMin, max: rawMax });
          }
        }
      } catch (err) {
        setError(err.message || "Could not load products. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [buildQuery],
  );

  // 1. Initial Load & Categories
  useEffect(() => {
    let cancelled = false;

    // Load categories
    loadCategoriesData().then((cats) => {
      if (!cancelled && cats.length > 0) {
        setCategories(cats);
      }
    });

    // Close category dropdown on outside click
    const handleClickOutside = (e) => {
      if (
        categoryPickerRef.current &&
        !categoryPickerRef.current.contains(e.target)
      ) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      cancelled = true;
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 2. React to search query or URL category param change
  useEffect(() => {
    const initialCats = parseInitialCategory();
    setSelectedCategories(initialCats);
    setPage(1);
    setSortBy(sortParam);
    loadProducts(draft, sortParam, initialCats, 1);
  }, [searchQuery, sortParam]);

  // Handlers for Category Picker
  const selectCategory = (cat) => {
    if (selectedCategories.some((c) => c.c_id === cat.c_id)) return;
    setSelectedCategories((prev) => [...prev, cat]);
    setCategorySearch("");
    setIsCategoryDropdownOpen(false);
  };

  const removeCategory = (id) => {
    setSelectedCategories((prev) => prev.filter((c) => c.c_id !== id));
  };

  const filteredCategories = categories.filter((cat) => {
    const alreadySelected = selectedCategories.some((c) => c.c_id === cat.c_id);
    const matches = cat.name
      .toLowerCase()
      .includes(categorySearch.toLowerCase());
    return !alreadySelected && matches;
  });

  // Dual price range slider computations
  const minBound = Math.floor(priceBounds.min);
  const maxBound = Math.ceil(priceBounds.max);

  const currentMinPrice =
    draft.minPrice !== "" ? Number(draft.minPrice) : minBound;
  const currentMaxPrice =
    draft.maxPrice !== "" ? Number(draft.maxPrice) : maxBound;

  const minPercent =
    maxBound > minBound
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(
              ((currentMinPrice - minBound) / (maxBound - minBound)) * 100,
            ),
          ),
        )
      : 0;

  const maxPercent =
    maxBound > minBound
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(
              ((currentMaxPrice - minBound) / (maxBound - minBound)) * 100,
            ),
          ),
        )
      : 100;

  // Apply & Clear
  const handleApplyFilters = () => {
    setPage(1);
    loadProducts(draft, sortBy, undefined, 1);
    setMobileDrawerOpen(false);
  };

  const handleClearFilters = () => {
    setSelectedCategories([]);
    const cleared = {
      minPrice: "",
      maxPrice: "",
      minRate: "",
      inStock: "",
    };
    setDraft(cleared);
    setSortBy("default");
    setPage(1);
    loadProducts(cleared, "default", [], 1);
    setMobileDrawerOpen(false);
  };

  const handleSortChange = (e) => {
    const newSort = e.target.value;
    setSortBy(newSort);
    setPage(1);
    loadProducts(draft, newSort, undefined, 1);
  };

  const goToPage = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    setPage(newPage);
    loadProducts(draft, sortBy, undefined, newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Count active filters for badge
  const activeFilterCount =
    selectedCategories.length +
    (draft.minPrice !== "" ? 1 : 0) +
    (draft.maxPrice !== "" ? 1 : 0) +
    (draft.minRate !== "" ? 1 : 0) +
    (draft.inStock !== "" ? 1 : 0);

  // Clear search query
  const handleClearSearch = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("search");
    setSearchParams(nextParams);
  };

  /* ---------- Reusable Filter Controls Component ---------- */
  const renderFilterPanel = (isMobile = false) => (
    <>
      <div className="filter-header">
        <h5 className="filter-title">Filters</h5>
        <div className="d-flex align-items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              type="button"
              className="filter-clear-btn"
              onClick={handleClearFilters}
            >
              Clear All
            </button>
          )}
          {isMobile && (
            <button
              type="button"
              className="filter-close-btn"
              onClick={() => setMobileDrawerOpen(false)}
              aria-label="Close filters"
            >
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
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 1. CATEGORIES */}
      <div className="filter-group">
        <label className="filter-group-title">
          <span>Categories</span>
          {selectedCategories.length > 0 && (
            <span className="badge bg-secondary rounded-pill small">
              {selectedCategories.length}
            </span>
          )}
        </label>

        {selectedCategories.length > 0 && (
          <div className="filter-category-tags">
            {selectedCategories.map((cat) => (
              <span className="filter-category-tag" key={cat.c_id}>
                {cat.name}
                <button
                  type="button"
                  onClick={() => removeCategory(cat.c_id)}
                  aria-label={`Remove ${cat.name}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="filter-category-search-box" ref={categoryPickerRef}>
          <input
            type="text"
            className="form-control filter-category-input"
            placeholder="Search categories..."
            value={categorySearch}
            onFocus={() => setIsCategoryDropdownOpen(true)}
            onChange={(e) => {
              setCategorySearch(e.target.value);
              setIsCategoryDropdownOpen(true);
            }}
          />

          {isCategoryDropdownOpen && (
            <div className="filter-category-dropdown">
              {filteredCategories.length === 0 ? (
                <div className="filter-category-empty">No categories found</div>
              ) : (
                filteredCategories.map((cat) => (
                  <button
                    type="button"
                    key={cat.c_id}
                    className="filter-category-item"
                    onClick={() => selectCategory(cat)}
                  >
                    <span>{cat.name}</span>
                    <span className="text-secondary small">+ Add</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. PRICE RANGE */}
      <div className="filter-group">
        <label className="filter-group-title">Price Range</label>

        <div className="price-inputs">
          <div className="price-input-box">
            <span className="price-currency">$</span>
            <input
              type="number"
              min={minBound}
              max={currentMaxPrice}
              placeholder={String(minBound)}
              value={draft.minPrice}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, minPrice: e.target.value }))
              }
              aria-label="Minimum price"
            />
          </div>
          <span className="text-muted">–</span>
          <div className="price-input-box">
            <span className="price-currency">$</span>
            <input
              type="number"
              min={currentMinPrice}
              max={maxBound}
              placeholder={String(maxBound)}
              value={draft.maxPrice}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, maxPrice: e.target.value }))
              }
              aria-label="Maximum price"
            />
          </div>
        </div>

        <div className="range-slider">
          <div
            className="range-slider__track"
            style={{
              left: `${minPercent}%`,
              right: `${100 - maxPercent}%`,
            }}
          />
          <input
            type="range"
            min={minBound}
            max={maxBound}
            value={currentMinPrice}
            onChange={(e) => {
              const val = Math.min(Number(e.target.value), currentMaxPrice);
              setDraft((prev) => ({ ...prev, minPrice: String(val) }));
            }}
            className="range-slider__input"
            aria-label="Min price slider"
          />
          <input
            type="range"
            min={minBound}
            max={maxBound}
            value={currentMaxPrice}
            onChange={(e) => {
              const val = Math.max(Number(e.target.value), currentMinPrice);
              setDraft((prev) => ({ ...prev, maxPrice: String(val) }));
            }}
            className="range-slider__input"
            aria-label="Max price slider"
          />
        </div>

        <div className="d-flex justify-content-between text-muted small mt-2">
          <span>${minBound}</span>
          <span>${maxBound}</span>
        </div>
      </div>

      {/* 3. RATING */}
      <div className="filter-group">
        <label className="filter-group-title">Rating</label>
        <div className="filter-rating-list">
          {RATING_LEVELS.map((stars) => {
            const isActive = Number(draft.minRate) === stars;
            return (
              <button
                type="button"
                key={stars}
                className={`filter-rating-row ${isActive ? "is-active" : ""}`}
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    minRate:
                      Number(prev.minRate) === stars ? "" : String(stars),
                  }))
                }
              >
                <span className="filter-rating-stars">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg
                      key={s}
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill={s <= stars ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className={s <= stars ? "star-filled" : "star-empty"}
                      aria-hidden="true"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </span>
                <span className="filter-rating-label">
                  {stars === 5 ? "5 Stars" : `& Up`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. STOCK STATE (Option B) */}
      <div className="filter-group">
        <label className="filter-group-title">Availability</label>
        <div className="filter-stock-group">
          {STOCK_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`filter-stock-label ${
                draft.inStock === opt.value ? "is-selected" : ""
              }`}
            >
              <input
                type="radio"
                name="stockState"
                value={opt.value}
                checked={draft.inStock === opt.value}
                onChange={() =>
                  setDraft((prev) => ({ ...prev, inStock: opt.value }))
                }
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 5. ACTION BUTTONS */}
      <div className="d-flex flex-column gap-2 mt-4">
        <Button variant="primary" fullWidth onClick={handleApplyFilters}>
          Apply Filters
        </Button>
        <Button variant="outline" fullWidth onClick={handleClearFilters}>
          Clear All
        </Button>
      </div>
    </>
  );

  return (
    <>
      <Nav />

      {/* Mobile Filter Drawer (placed at root level to prevent container shifts) */}
      {mobileDrawerOpen && (
        <div
          className="mobile-filter-drawer d-lg-none"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="mobile-filter-backdrop"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="mobile-filter-content">{renderFilterPanel(true)}</div>
        </div>
      )}

      <main className="products-page py-4 py-md-5">
        <div className="container">
          {/* Active Search Notification */}
          {searchQuery && (
            <div className="mb-4 d-flex align-items-center gap-2">
              <span className="text-muted">Results for:</span>
              <span className="products-search-badge">
                <strong>"{searchQuery}"</strong>
                <button
                  type="button"
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                >
                  ×
                </button>
              </span>
            </div>
          )}

          <div className="row g-4">
            {/* Desktop Left Sidebar */}
            <aside className="col-lg-3 col-xl-3 d-none d-lg-block">
              <div className="filter-card">{renderFilterPanel(false)}</div>
            </aside>

            {/* Products Main Column */}
            <section className="col-12 col-lg-9 col-xl-9">
              {/* Top Bar: Results Count + Sort + Mobile Filter Trigger */}
              <div className="products-topbar">
                <div className="d-flex align-items-center gap-3">
                  <button
                    type="button"
                    className="btn btn-outline-primary d-lg-none d-inline-flex align-items-center gap-2 rounded-pill btn-sm"
                    onClick={() => setMobileDrawerOpen(true)}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                    </svg>
                    <span>Filters</span>
                    {activeFilterCount > 0 && (
                      <span className="badge bg-primary text-white rounded-pill">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>

                  <span className="products-count">
                    {loading
                      ? "Loading products…"
                      : `Showing ${products.length} of ${totalItems} products`}
                  </span>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <label
                    htmlFor="sort-select"
                    className="small text-muted d-none d-sm-inline"
                  >
                    Sort by:
                  </label>
                  <select
                    id="sort-select"
                    className="form-select products-sort-select"
                    value={sortBy}
                    onChange={handleSortChange}
                  >
                    <option value="default">Featured</option>
                    <option value="sold-desc">Most Sales</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="rate-desc">Highest Rated</option>
                    <option value="created_at-desc">Newest Arrivals</option>
                  </select>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              {/* Products Grid or Loading Skeleton */}
              {loading ? (
                <ProductGridSkeleton count={6} />
              ) : products.length > 0 ? (
                <>
                  <div className="row g-3 g-md-4">
                    {products.map((product) => (
                      <div
                        className="col-6 col-md-6 col-lg-4"
                        key={product.p_id}
                      >
                        <Link
                          className="text-decoration-none h-100 d-block"
                          to={`/product/${product.p_id}`}
                        >
                          <Card product={product} />
                        </Link>
                      </div>
                    ))}
                  </div>

                  {/* Reusable Pagination */}
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    onChange={goToPage}
                  />
                </>
              ) : (
                <div className="text-center py-5">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                    style={{
                      width: "4rem",
                      height: "4rem",
                      backgroundColor: "var(--dz-surface-2)",
                      color: "var(--dz-muted)",
                    }}
                  >
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                  </div>
                  <h4 className="fw-bold mb-2">No products found</h4>
                  <p className="text-muted mb-4">
                    Try adjusting your filters or search terms to find what
                    you're looking for.
                  </p>
                  <Button variant="outline" onClick={handleClearFilters}>
                    Reset all filters
                  </Button>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default Products;
