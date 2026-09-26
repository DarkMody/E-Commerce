import "./App.css";
import { useState, useEffect } from "react";
import { HashRouter, BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/home/home";
import Products from "./pages/products/products";
import Product from "./pages/product/product";
import Login from "./pages/login/login";
import Register from "./pages/register/register";
import Cart from "./pages/cart/cart";
import AddProduct from "./pages/addProduct/addProduct";
import MyProduct from "./pages/myProduct/myProduct";
import Profile from "./pages/profile/profile";
import Pay from "./pages/pay/pay";
import { SERVER_URL } from "./config";
import EditProduct from "./pages/editProduct/editProduct";
import ScrollToTop from "./components/scrollToTop/scrollToTop";

function App() {
  const [loading, setLoading] = useState(true);

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

    window.loggedIn = false;
    const apiGetUser = async () => {
      await fetch(`${SERVER_URL}/api/user`, {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          setLoading(false);
          console.log(data);
          if (data.status === "success") {
            localStorage.setItem("userData", JSON.stringify(data.data));
            window.loggedIn = true;
          } else {
            localStorage.setItem("userData", JSON.stringify({}));
          }
        });
    };
    apiGetUser();
  }, []);

  if (loading)
    return (
      <>
        <h1>Loading...</h1>
        <div id="toast-box"></div>
      </>
    );
  return (
    <>
      <HashRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/" element={<Products />} />
          <Route path="/product/:productId" element={<Product />} />
          <Route path={"/product/view/:sellerId"} element={<MyProduct />} />
          <Route path="/product/add" element={<AddProduct />} />
          <Route path="/product/edit/:productId" element={<EditProduct />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/user/profile" element={<Profile />} />
          <Route path="/cart/pay" element={<Pay />} />
        </Routes>
      </HashRouter>
      <div id="toast-box"></div>
    </>
  );
}

export default App;
