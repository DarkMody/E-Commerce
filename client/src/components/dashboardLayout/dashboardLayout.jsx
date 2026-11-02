import { NavLink, Outlet } from "react-router-dom";
import Nav from "../nav/nav";
import "./dashboardLayout.css";

/**
 * Sidebar + content area for a dashboard. The pages go inside through <Outlet />.
 *   <DashboardLayout label="Admin" links={[{ to: "/admin", label: "Main", end: true }, ...]} />
 */
function DashboardLayout({ links, label = "Dashboard" }) {
  return (
    <>
      <Nav />
      <div className="dash-shell">
        <aside className="dash-sidebar" aria-label={`${label} menu`}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `dash-link ${isActive ? "active" : ""}`}
            >
              {link.label}
            </NavLink>
          ))}
        </aside>

        <main className="dash-content">
          <Outlet />
        </main>
      </div>
    </>
  );
}

export default DashboardLayout;
