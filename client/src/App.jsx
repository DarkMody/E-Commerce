import "./App.css";
import { useState, useEffect } from "react";
import { HashRouter, BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/home/home";
import Product from "./pages/product/product";
import Login from "./pages/login/login";
import Register from "./pages/register/register";
import Cart from "./pages/cart/cart";
import AddProduct from "./pages/addProduct/addProduct";
import { userData } from "./config";

function App() {
  useEffect(() => {
    window.toast = (status, msg) => {
      const toastBox = document.querySelector("#toast-box");
      let toasty = document.createElement("div");
      toasty.classList.add("toasty");
      if (status == "success") {
        toasty.innerHTML = `<i class="fa-solid fa-circle-check"></i>`;
      } else if (status == "error") {
        toasty.classList.add("error");
        toasty.innerHTML = `<i class="fa-solid fa-circle-xmark"></i>`;
      } else {
        toasty.classList.add("invalid");
        toasty.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i>`;
      }
      toasty.innerHTML += msg;
      toastBox.appendChild(toasty);
      setTimeout(() => {
        toasty.remove();
      }, 5000);
    };
    // if (userData === null) {
    // }
  }, []);

  return (
    <>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:productId" element={<Product />} />
          <Route path="/product/add" element={<AddProduct />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cart" element={<Cart />} />
        </Routes>
      </HashRouter>
      <div id="toast-box"></div>
    </>
  );
}

export default App;
