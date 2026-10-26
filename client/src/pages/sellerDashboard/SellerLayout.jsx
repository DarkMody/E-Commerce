import { NavLink, Outlet } from "react-router-dom";
import Nav from "../../components/nav/nav";
import "./SellerDashboard.css";

// Sidebar items. Add more later by pushing to this array + adding a <Route>.
const LINKS = [
  { to: "/seller", label: "Main", end: true },
  { to: "/seller/products", label: "My Products" },
];

/**
 * Sidebar + content area.
 *
 * Routes (put in App.jsx):
 *   <Route path="/seller" element={<SellerLayout />}>
 *     <Route index element={<SellerMain />} />
 *     <Route path="products" element={<MyProduct />} />   // your sellerProducts.jsx
 *   </Route>
 *
 * NOTE: if your router already renders <Nav /> globally, delete the Nav import and tag here.
 * TODO (security): only allow role "seller" on this route AND on every /api/seller/* endpoint.
 */
export default function SellerLayout() {
  return (
    <>
      <Nav />
      <div className="seller-shell">
        <aside className="seller-sidebar">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `seller-link ${isActive ? "active" : ""}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </aside>

        <main className="seller-content">
          <Outlet />
        </main>
      </div>
    </>
  );
}
