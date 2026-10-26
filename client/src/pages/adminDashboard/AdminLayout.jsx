import { NavLink, Outlet } from "react-router-dom";
import "./Admin.css";
import Nav from "../../components/nav/nav";

// Sidebar items. Add more later by pushing to this array + adding a <Route>.
const LINKS = [
  { to: "/admin", label: "Main", end: true },
  { to: "/admin/roles", label: "Edit Roles" },
  { to: "/admin/orders", label: "All Orders" },
];

export default function AdminLayout() {
  return (
    <>
      <Nav></Nav>
      <div className="admin-shell">
        <aside className="admin-sidebar">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `admin-link ${isActive ? "active" : ""}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </aside>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </>
  );
}
