import "./addProduct.css";
import Nav from "../../components/nav/nav";
import Button from "../../components/button/button";
import Input from "../../components/input/input";
import Card from "../../components/card/card";
import Footer from "../../components/footer/footer";
import Follow from "../../components/follow/follow";
import { useNavigate } from "react-router-dom";
import { BASE_URL, SERVER_URL } from "../../config";
import { useState, useRef } from "react";

const MAX_IMAGES = 10;

function AddProduct() {
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList).filter((f) =>
      f.type.startsWith("image/"),
    );

    setImages((prev) => {
      const remainingSlots = MAX_IMAGES - prev.length;
      if (remainingSlots <= 0) return prev;

      const toAdd = incoming.slice(0, remainingSlots).map((file) => ({
        file,
        url: URL.createObjectURL(file),
      }));

      return [...prev, ...toAdd];
    });
    console.log(images);
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
      URL.revokeObjectURL(updated[index].url);
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

    if (images.length === 0) {
      alert("Please add at least one image.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("price", price);
    formData.append("quantity", quantity);
    formData.append("description", description);

    // append each image file — use the same key name for all of them
    images.forEach((img) => {
      formData.append("images", img.file);
    });

    await fetch(`${SERVER_URL}/api/product/add`, {
      credentials: "include",
      method: "POST",
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
          ></Input>
        </div>

        <div className="row mb-3 w-100">
          <div className="col-md-6 col-sm-12">
            <Input
              id="product-price"
              placeholder="Price"
              type="number"
              className="app-input"
            ></Input>
          </div>
          <div className="col-md-6 col-sm-12">
            <Input
              id="product-quantity"
              placeholder="quantity"
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
          ></textarea>
        </div>

        <div className="row mb-3 w-100">
          <label className="upload-label">
            Product Images ({images.length}/{MAX_IMAGES})
          </label>

          <div className="image-upload-grid">
            {images.map((img, index) => (
              <div className="image-tile" key={index}>
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
          <Button onclick={handleSubmit} text="Add Product"></Button>
        </div>
      </div>
      <Follow></Follow>
      <Footer></Footer>
    </>
  );
}

export default AddProduct;
