import { useState, useEffect } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import "./utils/toast";
import { SERVER_URL } from "./config";
import ScrollToTop from "./components/scrollToTop/scrollToTop";
import { PageLoader } from "./components/loading";

// Public , customer pages
import Home from "./pages/home/home";
import Products from "./pages/products/products";
import Product from "./pages/product/product";
import Login from "./pages/login/login";
import Register from "./pages/register/register";
import Cart from "./pages/cart/cart";
import Pay from "./pages/pay/pay";
import Profile from "./pages/profile/profile";
import History from "./pages/history/history";
import HistoryOrder from "./pages/historyOrder/historyOrder";
import Contact from "./pages/contact/contact";

// Seller
import AddProduct from "./pages/addProduct/addProduct";
import EditProduct from "./pages/editProduct/editProduct";
import SellerLayout from "./pages/sellerDashboard/SellerLayout";
import SellerMain from "./pages/sellerDashboard/SellerMain";
import SellerProducts from "./pages/sellerDashboard/sellerProducts";
import SellerOrders from "./pages/sellerDashboard/SellerOrders";

// Admin
import AdminLayout from "./pages/adminDashboard/AdminLayout";
import AdminMain from "./pages/adminDashboard/AdminMain";
import AdminRoles from "./pages/adminDashboard/AdminRoles";
import AdminOrders from "./pages/adminDashboard/AdminOrders";
import CheckProducts from "./pages/adminDashboard/checkProducts";

// Manager
import ManagerLayout from "./pages/managerDashboard/ManagerLayout";
import ManagerMain from "./pages/managerDashboard/ManagerMain";
import ManagerOrders from "./pages/managerDashboard/ManagerOrders";
import ManagerCouriers from "./pages/managerDashboard/ManagerCouriers";

// Delivery
import Delivery from "./pages/deliveryDashboard/delivery";

const loadCurrentUser = async () => {
  try {
    const res = await fetch(`${SERVER_URL}/api/user`, {
      credentials: "include",
    });
    const data = await res.json();

    if (data.status === "success") {
      localStorage.setItem("userData", JSON.stringify(data.data));
      window.loggedIn = true;
      return;
    }
  } catch {
    window.toast("error", "Can't reach the server. Try again later.");
  }

  localStorage.setItem("userData", JSON.stringify({}));
  window.loggedIn = false;
};

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrentUser().finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader fullScreen />;

  return (
    <HashRouter>
      <ScrollToTop />
      <Routes>
        {/* Public , customer */}
        <Route path="/" element={<Home />} />
        <Route path="/product" element={<Products />} />
        <Route path="/product/:productId" element={<Product />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/cart/pay" element={<Pay />} />
        <Route path="/user/profile" element={<Profile />} />
        <Route path="/history" element={<History />} />
        <Route path="/history/:o_id" element={<HistoryOrder />} />
        <Route path="/contact" element={<Contact />} />

        {/* Seller */}
        <Route path="/product/add" element={<AddProduct />} />
        <Route path="/product/edit/:productId" element={<EditProduct />} />
        <Route path="/seller" element={<SellerLayout />}>
          <Route index element={<SellerMain />} />
          <Route path="products" element={<SellerProducts />} />
          <Route path="orders" element={<SellerOrders />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminMain />} />
          <Route path="roles" element={<AdminRoles />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="checkProducts" element={<CheckProducts />} />
        </Route>

        {/* Manager */}
        <Route path="/manager" element={<ManagerLayout />}>
          <Route index element={<ManagerMain />} />
          <Route path="orders" element={<ManagerOrders />} />
          <Route path="couriers" element={<ManagerCouriers />} />
          <Route path="checkProducts" element={<CheckProducts />} />
        </Route>

        {/* Delivery */}
          <Route path="/employee" element={<Delivery />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
