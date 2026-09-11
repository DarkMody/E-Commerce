import "./products.css";
import Nav from "../../components/nav/nav";
import Card from "../../components/card/card";
import Footer from "../../components/footer/footer";
import Follow from "../../components/follow/follow";
import Button from "../../components/button/button";
import { SERVER_URL } from "../../config";
import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  // ---- categories ----
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categorySearch, setCategorySearch] = useState("");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryPickerRef = useRef(null);

  // DRAFT filter state (controlled inputs, not yet sent)
  const [draft, setDraft] = useState({
    minRate: "",
    maxRate: "",
    minPrice: "",
    maxPrice: "",
    inStock: "",
  });

  // sort applies immediately
  const [sortBy, setSortBy] = useState("default");

  const buildQuery = useCallback(
    (filters, sort, categoryOverriding) => {
      const params = new URLSearchParams();
      const cats = categoryOverriding ?? selectedCategories;
      if (searchQuery) params.set("search", searchQuery);
      if (cats.length > 0)
        cats.map((cat) => {
          params.append("category", cat.c_id);
        });
      if (filters.minRate !== "") params.set("minRate", filters.minRate);
      if (filters.maxRate !== "") params.set("maxRate", filters.maxRate);
      if (filters.minPrice !== "") params.set("minPrice", filters.minPrice);
      if (filters.maxPrice !== "") params.set("maxPrice", filters.maxPrice);
      if (filters.inStock !== "") params.set("inStock", filters.inStock);
      if (sort && sort !== "default") params.set("sort", sort);

      return params.toString();
    },
    [selectedCategories, searchQuery],
  );

  const fetchProducts = useCallback(
    (filters, sort, categoryOverriding) => {
      setLoading(true);
      const query = buildQuery(filters, sort, categoryOverriding);
      fetch(`${SERVER_URL}/api/products${query ? `?${query}` : ""}`)
        .then((response) => response.json())
        .then((data) => {
          if (data.status == "success") setProducts(data.data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    },
    [buildQuery],
  );

  // initial load (no filters applied)
  useEffect(() => {
    fetchProducts(draft, sortBy);
  }, [searchQuery]);

  useEffect(() => {
    fetch(`${SERVER_URL}/api/category`)
      .then((response) => response.json())
      .then((data) => setCategories(data.data || []))
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false));
    const handleClickOutside = (e) => {
      if (
        categoryPickerRef.current &&
        !categoryPickerRef.current.contains(e.target)
      ) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectCategory = (cat) => {
    if (selectedCategories.some((c) => c.c_id === cat.c_id)) return;

    setSelectedCategories((prev) => [...prev, cat]);
    setCategorySearch("");
  };

  const removeCategory = (id) => {
    setSelectedCategories((prev) => prev.filter((c) => c.c_id !== id));
  };

  const filteredCategories = categories.filter((cat) => {
    const alreadySelected = selectedCategories.some((c) => c.c_id === cat.c_id);
    const matchesSearch = cat.name
      .toLowerCase()
      .includes(categorySearch.toLowerCase());
    return !alreadySelected && matchesSearch;
  });

  const handleApplyFilters = () => {
    fetchProducts(draft, sortBy);
  };

  const handleClearFilters = () => {
    setSelectedCategories([]);
    const cleared = {
      minRate: "",
      maxRate: "",
      minPrice: "",
      maxPrice: "",
      inStock: "",
    };
    setDraft(cleared);
    setSortBy("default");
    fetchProducts(cleared, "default", []);
  };

  const handleSortChange = (e) => {
    const newSort = e.target.value;
    setSortBy(newSort);
    fetchProducts(draft, newSort); // uses last-applied filters + new sort
  };

  return (
    <>
      <Nav></Nav>
      <div className="main my-5">
        <div className="row">
          {/* Left filter column */}
          <div className="col-lg-3 col-md-4 mb-4">
            <div className="filter-sidebar p-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Filters</h5>
                <button
                  className="btn btn-sm btn-link text-decoration-none"
                  onClick={handleClearFilters}
                >
                  Clear
                </button>
              </div>

              {/* Name search */}
              {/* <div className="mb-4">
                <label className="form-label fw-bold">Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by name"
                  value={draft.search}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, search: e.target.value }))
                  }
                />
              </div> */}

              {/* Category */}
              <div className="row mb-3" ref={categoryPickerRef}>
                {selectedCategories.length > 0 && (
                  <div className="selected-categories">
                    {selectedCategories.map((cat) => (
                      <span className="category-tag" key={cat.c_id}>
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

                <div className="category-search-wrapper">
                  <input
                    type="text"
                    className="app-input category-search-input form-control "
                    placeholder="Search by category"
                    value={categorySearch}
                    disabled={loadingCategories}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    onFocus={() => setIsCategoryDropdownOpen(true)}
                  />

                  {isCategoryDropdownOpen && (
                    <div className="category-dropdown">
                      {loadingCategories ? (
                        <div className="category-dropdown-item disabled">
                          Loading...
                        </div>
                      ) : filteredCategories.length === 0 ? (
                        <div className="category-dropdown-item disabled">
                          No categories found
                        </div>
                      ) : (
                        filteredCategories.map((cat) => (
                          <div
                            key={cat.c_id}
                            className="category-dropdown-item"
                            onClick={() => selectCategory(cat)}
                          >
                            {cat.name}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Rating min/max */}
              <div className="mb-4">
                <label className="form-label fw-bold">Rating</label>
                <div className="d-flex gap-2">
                  <select
                    className="form-select"
                    value={draft.minRate}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        minRate: e.target.value,
                      }))
                    }
                  >
                    <option value={""}>Min</option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <select
                    className="form-select"
                    value={draft.maxRate}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        maxRate: e.target.value,
                      }))
                    }
                  >
                    <option value={""}>Max</option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price */}
              <div className="mb-4">
                <label className="form-label fw-bold">Price Range</label>
                <div className="d-flex gap-2">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Min"
                    value={draft.minPrice}
                    min={0}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        minPrice: e.target.value,
                      }))
                    }
                  />
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Max"
                    value={draft.maxPrice}
                    min={0}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        maxPrice: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              {/* Stock */}
              <div className="mb-4">
                <label className="form-label fw-bold">In Stock</label>
                <select
                  className="form-select"
                  value={draft.inStock}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      inStock: e.target.value,
                    }))
                  }
                >
                  <option value="">Stock</option>
                  <option key="yes" value={true}>
                    Yes
                  </option>
                  <option key="no" value={false}>
                    No
                  </option>
                </select>
              </div>

              <Button
                className="w-100"
                text="Apply Filters"
                onclick={handleApplyFilters}
              ></Button>
              {/* <button
                className="btn btn-dark w-100"
                onClick={handleApplyFilters}
              >
                Apply Filters
              </button> */}
            </div>
          </div>

          {/* Product grid */}
          <div className="col-lg-9 col-md-8">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="text-muted">
                {loading ? "Loading..." : `${products.length} results`}
              </span>
              <select
                className="form-select w-auto"
                value={sortBy}
                onChange={handleSortChange}
              >
                <option value="default">Sort by</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rate-asc">Rate: Low to High</option>
                <option value="rate-desc">Rate: High to Low</option>
                <option value="sold-desc">Most Sales</option>
              </select>
            </div>

            {loading ? (
              <div className="d-flex justify-content-center py-5">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div className="row mb-2">
                {products.map((obj) => (
                  <div
                    className="col-sm-6 col-md-6 col-lg-4 mb-3"
                    key={obj.p_id}
                  >
                    <Link
                      className="text-decoration-none"
                      to={`/product/${obj.p_id}`}
                    >
                      <Card product={obj}></Card>
                    </Link>
                  </div>
                ))}
                {products.length === 0 && (
                  <div className="text-center text-muted py-5">
                    No products match your filters.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <Follow></Follow>
      <Footer></Footer>
    </>
  );
}

export default Products;
