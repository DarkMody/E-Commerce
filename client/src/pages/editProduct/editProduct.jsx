import "./editProduct.css";
import Nav from "../../components/nav/nav";
import Button from "../../components/button/button";
import Input from "../../components/input/input";
import Footer from "../../components/footer/footer";
import Follow from "../../components/follow/follow";
import { useNavigate, useParams } from "react-router-dom";
import { BASE_URL, SERVER_URL } from "../../config";
import { useState, useRef, useEffect } from "react";

const MAX_IMAGES = 10;
const MAX_CATEGORIES = 10;

function EditProduct() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const [product, setProduct] = useState();
  const [images, setImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  // Start Category
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categorySearch, setCategorySearch] = useState("");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryPickerRef = useRef(null);

  useEffect(() => {
    fetch(`${SERVER_URL}/api/category`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setCategories(data.data);
      })
      .catch(() => window.toast("error", "Failed to load categories"))
      .finally(() => setLoadingCategories(false));
  }, []);

  // close dropdown when clicking outside
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
  // End Category

  useEffect(() => {
    fetch(`${SERVER_URL}/api/products/${productId}`)
      .then((res) => res.json())
      .then((data) => {
        setProduct(data.data);
        // Tag existing server images so we can tell them apart from new uploads
        setImages(
          (data.data.image || []).map((img) => ({
            type: "existing",
            image: img, // filename stored in DB, used as the identifier
            url: `${SERVER_URL}/uploads/${img.image}`,
          })),
        );
        // Existing Categories
        setSelectedCategories(data.data.category);
        console.log(data.data.category);
        setLoading(false);
      });
  }, []);

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList).filter((f) =>
      f.type.startsWith("image/"),
    );

    setImages((prev) => {
      const remainingSlots = MAX_IMAGES - prev.length;
      if (remainingSlots <= 0) return prev;

      const toAdd = incoming.slice(0, remainingSlots).map((file) => ({
        type: "new",
        file,
        url: URL.createObjectURL(file),
      }));

      return [...prev, ...toAdd];
    });
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
    setImages((prev) => {
      const updated = [...prev];
      // Only revoke blob URLs for locally-added images; existing ones are real server URLs
      if (updated[index].type === "new") {
        URL.revokeObjectURL(updated[index].url);
      }
      updated.splice(index, 1);
      return updated;
    });
  };

  const openFilePicker = () => {
    if (images.length < MAX_IMAGES) fileInputRef.current.click();
  };

  const handleSubmit = async () => {
    const name = document.getElementById("product-name").value;
    const price = document.getElementById("product-price").value;
    const quantity = document.getElementById("product-quantity").value;
    const description = document.getElementById("product-description").value;

    if (name == "") {
      window.toast("error", "Please put a name for product");
      return;
    }

    if (price == "" || price == 0) {
      window.toast("error", "The price must be bigger than 0");
      return;
    }

    if (images.length === 0) {
      window.toast("error", "Please add at least one image.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("price", price || 0);
    formData.append("quantity", quantity || 0);
    formData.append("description", description);
    formData.append(
      "categories",
      JSON.stringify(selectedCategories.map((c) => c.c_id)),
    );

    images
      .filter((img) => img.type === "new")
      .forEach((img) => formData.append("images", img.file));

    const keptExisting = images
      .filter((img) => img.type === "existing")
      .map((img) => img.image.image);
    formData.append("existingImages", JSON.stringify(keptExisting));

    await fetch(`${SERVER_URL}/api/product/edit/${productId}`, {
      credentials: "include",
      method: "PATCH",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status == "success") {
          navigate(
            `/product/view/${JSON.parse(localStorage.getItem("userData")).id}`,
          );
        }
        window.toast(data.status, data.message);
      });
  };

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
      <div
        id="add-product"
        className="text-center py-5 px-5 d-flex align-items-center flex-column"
      >
        <div className="row mb-3 w-100">
          <Input
            id="product-name"
            placeholder="Name"
            className="app-input"
            value={product.product.name}
          ></Input>
        </div>

        <div className="row mb-3 w-100">
          <div className="col-md-6 col-sm-12">
            <Input
              id="product-price"
              placeholder="Price"
              type="number"
              className="app-input"
              value={product.product.price}
            ></Input>
          </div>
          <div className="col-md-6 col-sm-12">
            <Input
              id="product-quantity"
              placeholder="Add quantity, put it negative if you want to decrease it"
              type="number"
              className="app-input"
            ></Input>
          </div>
        </div>

        <div className="row mb-3 w-100">
          <textarea
            className="p-2 app-textarea"
            placeholder="Description"
            id="product-description"
            defaultValue={product.product.description}
          ></textarea>
        </div>

        {/* ---- Categories search-and-pick ---- */}
        <div className="row mb-3 w-100" ref={categoryPickerRef}>
          <label className="upload-label">
            Categories ({selectedCategories.length}/{MAX_CATEGORIES})
          </label>

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
              className="app-input category-search-input"
              placeholder={
                selectedCategories.length >= MAX_CATEGORIES
                  ? "Maximum categories selected"
                  : "Search categories..."
              }
              value={categorySearch}
              disabled={
                loadingCategories || selectedCategories.length >= MAX_CATEGORIES
              }
              onChange={(e) => setCategorySearch(e.target.value)}
              onFocus={() => setIsCategoryDropdownOpen(true)}
            />

            {isCategoryDropdownOpen &&
              selectedCategories.length < MAX_CATEGORIES && (
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

        <div className="row mb-3 w-100">
          <label className="upload-label">
            Product Images ({images.length}/{MAX_IMAGES})
          </label>

          <div className="image-upload-grid">
            {images.map((img, index) => (
              <div
                className="image-tile"
                key={img.type === "new" ? img.url : img.image}
              >
                <img src={img.url} alt={`product-${index}`} />
                <button
                  type="button"
                  className="remove-image-btn"
                  onClick={() => removeImage(index)}
                  aria-label="Remove image"
                >
                  <span>×</span>
                </button>
              </div>
            ))}

            {images.length < MAX_IMAGES && (
              <div
                className={`image-tile upload-tile ${
                  isDragging ? "dragging" : ""
                }`}
                onClick={openFilePicker}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <span className="upload-plus">+</span>
                <span className="upload-text">Add Image</span>
              </div>
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
          <h3 className="mt-3">
            Please note that the first image is the image will appear for
            product's show up
          </h3>
        </div>

        <div className="row mb-3">
          <Button onclick={handleSubmit} text="Edit Product"></Button>
        </div>
      </div>
      <Follow></Follow>
      <Footer></Footer>
    </>
  );
}

export default EditProduct;
