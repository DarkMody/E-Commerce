import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Nav from "../../components/nav/nav";
import Button from "../../components/button/button";
import Input from "../../components/input/input";
import Footer from "../../components/footer/footer";
import Follow from "../../components/follow/follow";
import { SERVER_URL } from "../../config";
import "./addProduct.css";

const MAX_IMAGES = 10;
const MAX_CATEGORIES = 10;

const SearchIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);

// Same rules as before: name, price > 0, quantity > 0, at least one image
const validate = ({ name, price, quantity }, imageCount) => {
  const errors = {};
  if (!name.trim()) errors.name = "Please put a name for the product";
  if (!(Number(price) > 0)) errors.price = "The price must be bigger than 0";
  if (!(Number(quantity) > 0))
    errors.quantity = "The quantity must be bigger than 0";
  if (imageCount === 0) errors.images = "Please add at least one image.";
  return errors;
};

const getUserId = () => {
  try {
    return JSON.parse(localStorage.getItem("userData"))?.id;
  } catch {
    return undefined;
  }
};

function AddProduct() {
  const navigate = useNavigate();

  // ---- form fields ----
  const [values, setValues] = useState({
    name: "",
    price: "",
    quantity: "",
    description: "",
  });
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // ---- images ----
  const [images, setImages] = useState([]); // [{ file, url }]
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const imagesRef = useRef(images);

  // ---- categories ----
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categorySearch, setCategorySearch] = useState("");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryPickerRef = useRef(null);

  const errors = validate(values, images.length);
  const setField = (field) => (e) =>
    setValues((prev) => ({ ...prev, [field]: e.target.value }));
  const touch = (field) => () =>
    setTouched((prev) => ({ ...prev, [field]: true }));
  const errorOf = (field) => (touched[field] ? errors[field] : undefined);

  /* ---------- Load categories ---------- */
  useEffect(() => {
    // ===================== BACKEND CONNECTION =====================
    // GET /api/category returns { data: [ { c_id, name } ] }
    fetch(`${SERVER_URL}/api/category`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setCategories(data.data || []))
      .catch(() => window.toast("error", "Failed to load categories"))
      .finally(() => setLoadingCategories(false));
    // ===============================================================
  }, []);

  // close the dropdown when clicking outside
  useEffect(() => {
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

  // free the image previews from memory when leaving the page
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);
  useEffect(
    () => () =>
      imagesRef.current.forEach((img) => URL.revokeObjectURL(img.url)),
    [],
  );

  /* ---------- Categories ---------- */
  const selectCategory = (cat) => {
    if (selectedCategories.some((c) => c.c_id === cat.c_id)) return;
    if (selectedCategories.length >= MAX_CATEGORIES) {
      window.toast(
        "error",
        `You can select up to ${MAX_CATEGORIES} categories.`,
      );
      return;
    }
    setSelectedCategories((prev) => [...prev, cat]);
    setCategorySearch("");
  };

  const removeCategory = (id) =>
    setSelectedCategories((prev) => prev.filter((c) => c.c_id !== id));

  const filteredCategories = categories.filter(
    (cat) =>
      !selectedCategories.some((c) => c.c_id === cat.c_id) &&
      cat.name.toLowerCase().includes(categorySearch.toLowerCase()),
  );

  /* ---------- Images ---------- */
  const addFiles = (fileList) => {
    const incoming = Array.from(fileList).filter((f) =>
      f.type.startsWith("image/"),
    );
    const remainingSlots = MAX_IMAGES - images.length;
    if (remainingSlots <= 0 || incoming.length === 0) return;

    const toAdd = incoming.slice(0, remainingSlots).map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...toAdd]);
    setTouched((prev) => ({ ...prev, images: true }));
  };

  const handleFileChange = (e) => {
    addFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(images[index].url);
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const openFilePicker = () => {
    if (images.length < MAX_IMAGES) fileInputRef.current.click();
  };

  /* ---------- Submit ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setTouched({ name: true, price: true, quantity: true, images: true });
    const firstError = Object.values(errors)[0];
    if (firstError) {
      window.toast("error", firstError);
      return;
    }

    const formData = new FormData();
    formData.append("name", values.name.trim());
    formData.append("price", values.price);
    formData.append("quantity", values.quantity);
    formData.append("description", values.description);
    formData.append(
      "categories",
      JSON.stringify(selectedCategories.map((c) => c.c_id)),
    );
    images.forEach((img) => formData.append("images", img.file));

    setSubmitting(true);
    try {
      // ===================== BACKEND CONNECTION =====================
      // POST /api/product/add  (multipart: name, price, quantity, description,
      // categories = JSON array of c_id, images = files). Returns { status, message }.
      const res = await fetch(`${SERVER_URL}/api/product/add`, {
        credentials: "include",
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      // ===============================================================

      if (data.status === "success") {
        navigate(`/product/view/${getUserId()}`);
      }
      window.toast(data.status, data.message);
    } catch {
      window.toast("error", "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const categoriesFull = selectedCategories.length >= MAX_CATEGORIES;

  return (
    <>
      <Nav />
      <main className="container py-4 py-lg-5">
        <form className="add-product__card" onSubmit={handleSubmit} noValidate>
          <h1 className="add-product__title">Add product</h1>

          <Input
            label="Name"
            name="name"
            placeholder="Product name"
            value={values.name}
            onChange={setField("name")}
            onBlur={touch("name")}
            error={errorOf("name")}
            required
            disabled={submitting}
          />

          <div className="row g-4">
            <div className="col-md-6">
              <Input
                label="Price ($)"
                type="number"
                name="price"
                placeholder="0.00"
                min="0"
                step="any"
                inputMode="decimal"
                value={values.price}
                onChange={setField("price")}
                onBlur={touch("price")}
                error={errorOf("price")}
                required
                disabled={submitting}
              />
            </div>
            <div className="col-md-6">
              <Input
                label="Quantity"
                type="number"
                name="quantity"
                placeholder="How many in stock"
                min="0"
                inputMode="numeric"
                value={values.quantity}
                onChange={setField("quantity")}
                onBlur={touch("quantity")}
                error={errorOf("quantity")}
                required
                disabled={submitting}
              />
            </div>
          </div>

          {/* Description (same underline look as the inputs) */}
          <div className="dz-field">
            <label className="dz-field__label" htmlFor="product-description">
              Description
            </label>
            <div className="dz-field__control">
              <textarea
                id="product-description"
                className="dz-field__input add-product__textarea"
                rows={5}
                placeholder="Describe your product"
                value={values.description}
                onChange={setField("description")}
                disabled={submitting}
              />
            </div>
          </div>

          {/* Categories: search and pick */}
          <div ref={categoryPickerRef}>
            <p className="add-product__label">
              Categories ({selectedCategories.length}/{MAX_CATEGORIES})
            </p>

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
              <Input
                type="text"
                name="categorySearch"
                autoComplete="off"
                aria-label="Search categories"
                role="combobox"
                aria-expanded={isCategoryDropdownOpen && !categoriesFull}
                aria-controls="category-list"
                icon={<SearchIcon />}
                placeholder={
                  loadingCategories
                    ? "Loading categories…"
                    : categoriesFull
                      ? "Maximum categories selected"
                      : "Search categories…"
                }
                value={categorySearch}
                disabled={loadingCategories || categoriesFull || submitting}
                onChange={(e) => setCategorySearch(e.target.value)}
                onFocus={() => setIsCategoryDropdownOpen(true)}
              />

              {isCategoryDropdownOpen && !categoriesFull && (
                <div
                  className="category-dropdown"
                  id="category-list"
                  role="listbox"
                >
                  {loadingCategories ? (
                    <div className="category-dropdown-item disabled">
                      Loading…
                    </div>
                  ) : filteredCategories.length === 0 ? (
                    <div className="category-dropdown-item disabled">
                      No categories found
                    </div>
                  ) : (
                    filteredCategories.map((cat) => (
                      <button
                        type="button"
                        key={cat.c_id}
                        role="option"
                        aria-selected="false"
                        className="category-dropdown-item"
                        onClick={() => selectCategory(cat)}
                      >
                        {cat.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Images */}
          <div>
            <p className="add-product__label">
              Product images ({images.length}/{MAX_IMAGES}){" "}
              <span className="text-danger" aria-hidden="true">
                *
              </span>
            </p>

            <div className="image-upload-grid">
              {images.map((img, index) => (
                <div className="image-tile" key={img.url}>
                  <img src={img.url} alt={`Product preview ${index + 1}`} />
                  <button
                    type="button"
                    className="remove-image-btn"
                    onClick={() => removeImage(index)}
                    disabled={submitting}
                    aria-label={`Remove image ${index + 1}`}
                  >
                    ×
                  </button>
                </div>
              ))}

              {images.length < MAX_IMAGES && (
                <button
                  type="button"
                  className={`image-tile upload-tile ${isDragging ? "dragging" : ""}`}
                  onClick={openFilePicker}
                  disabled={submitting}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                >
                  <span className="upload-plus" aria-hidden="true">
                    +
                  </span>
                  <span className="upload-text">Add image</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={handleFileChange}
            />

            {errorOf("images") && (
              <p className="add-product__error">{errors.images}</p>
            )}
            <p className="add-product__hint">
              The first image is the one shown for the product in the store.
            </p>
          </div>

          <Button
            type="submit"
            featured
            size="lg"
            fullWidth
            loading={submitting}
          >
            Add product
          </Button>
        </form>
      </main>
      <Follow />
      <Footer />
    </>
  );
}

export default AddProduct;
