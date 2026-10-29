import { NavLink, Outlet } from "react-router-dom";
import Nav from "../../components/nav/nav";
import "./ManagerDashboard.css";

const LINKS = [
  { to: "/manager", label: "Main", end: true },
  { to: "/manager/orders", label: "Orders" },
];

/**
 * Routes (put in App.jsx):
 *   <Route path="/manager" element={<ManagerLayout />}>
 *     <Route index element={<ManagerMain />} />
 *     <Route path="orders" element={<ManagerOrders />} />
 *   </Route>
 *
 * NOTE: delete the Nav import/tag if your router already renders it globally.
 * TODO (security): only allow role "manager" (and admin if you want) on this
 * route AND on every /api/manager/* endpoint.
 */
export default function ManagerLayout() {
  return (
    <>
      <Nav />
      <div className="manager-shell">
        <aside className="manager-sidebar">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => `manager-link ${isActive ? "active" : ""}`}
            >
              {l.label}
            </NavLink>
          ))}
        </aside>
        <main className="manager-content">
          <Outlet />
        </main>
      </div>
    </>
  );
}
