import { useState, useEffect } from "react";
import {
  Link,
  NavLink,
  useNavigate,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import Input from "../input/input";
import ThemeToggle from "../../theme/ThemeToggle";
import { SERVER_URL } from "../../config";
import "./nav.css";

/* ---------- Small inline icons (no Font Awesome needed here) ---------- */
const ICON_PATHS = {
  cart: (
    <>
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M2 3h3l2.5 12h11L21 7H6" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  logout: (
    <>
      <path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4" />
      <path d="M16 8l4 4-4 4M20 12H9" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
};

function Icon({ name, size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

/* ---------- Helpers ---------- */
// One dashboard link per role
const DASHBOARDS = {
  seller: { to: "/seller", label: "Seller Dashboard" },
  admin: { to: "/admin", label: "Admin Dashboard" },
  manager: { to: "/manager", label: "Manager Dashboard" },
  employee: { to: "/employee", label: "Employee Dashboard" },
};

const getUserRole = () => {
  try {
    return JSON.parse(localStorage.getItem("userData"))?.role;
  } catch {
    return undefined;
  }
};

const linkClass = ({ isActive }) => `dz-nav__link ${isActive ? "active" : ""}`;
const iconLinkClass = ({ isActive }) =>
  `dz-nav__icon-link ${isActive ? "active" : ""}`;

function Nav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();

  const [login, setLogin] = useState(Boolean(window.loggedIn));
  const [menuOpen, setMenuOpen] = useState(false);
  // On the products page, show the current search in the box
  const [searchValue, setSearchValue] = useState(
    pathname.startsWith("/product") ? params.get("search") || "" : "",
  );

  const dashboard = login ? DASHBOARDS[getUserRole()] : undefined;

  // Close the mobile menu whenever the page changes
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleSearch = (e) => {
    e.preventDefault(); // no full page reload
    const query = searchValue.trim();
    navigate(
      query ? `/product?search=${encodeURIComponent(query)}` : "/product",
    );
    setMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/logout`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();

      if (data.status === "success") {
        setLogin(false);
        window.loggedIn = false;
        localStorage.setItem("userData", JSON.stringify({}));
        navigate("/");
      }
      window.toast(data.status, data.message);
    } catch {
      window.toast("error", "Could not log out. Try again.");
    }
  };

  return (
    <nav
      className="dz-nav navbar navbar-expand-lg sticky-top"
      aria-label="Main"
    >
      <div className="container-fluid">
        <Link className="dz-nav__brand navbar-brand fw-bold fs-3" to="/">
          DarkZon
        </Link>

        <button
          className="dz-nav__toggler navbar-toggler"
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-controls="navbarNav"
          aria-expanded={menuOpen}
          aria-label="Toggle navigation"
        >
          <Icon name="menu" size={30} />
        </button>

        <div
          className={`collapse navbar-collapse ${menuOpen ? "show" : ""}`}
          id="navbarNav"
        >
          {/* Page links */}
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0 me-lg-2 gap-1">
            <li className="nav-item">
              <NavLink className={linkClass} to="/" end>
                Home
              </NavLink>
            </li>
            {dashboard && (
              <li className="nav-item">
                <NavLink className={linkClass} to={dashboard.to}>
                  {dashboard.label}
                </NavLink>
              </li>
            )}
            <li className="nav-item">
              <NavLink className={linkClass} to="/product">
                Products
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={linkClass} to="/contact">
                Contact Us
              </NavLink>
            </li>
          </ul>

          {/* Search */}
          <form
            className="dz-nav__search mb-3 mb-lg-0 me-lg-2"
            role="search"
            onSubmit={handleSearch}
          >
            <Input
              type="search"
              name="search"
              size="sm"
              icon={<Icon name="search" size={18} />}
              placeholder="Search for products"
              aria-label="Search products"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </form>

          {/* Icons: icon only on desktop, icon + text on mobile */}
          <ul className="navbar-nav mb-2 mb-lg-0 gap-1 align-items-lg-center">
            <li className="nav-item">
              <NavLink
                className={iconLinkClass}
                to="/cart"
                aria-label="Cart"
                title="Cart"
              >
                <Icon name="cart" />
                <span className="d-lg-none">Cart</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                className={iconLinkClass}
                to={login ? "/user/profile" : "/login"}
                aria-label={login ? "Profile" : "Login"}
                title={login ? "Profile" : "Login"}
              >
                <Icon name="user" />
                <span className="d-lg-none">{login ? "Profile" : "Login"}</span>
              </NavLink>
            </li>
            {login && (
              <>
                <li className="nav-item">
                  <NavLink
                    className={iconLinkClass}
                    to="/history"
                    aria-label="Order history"
                    title="Order history"
                  >
                    <Icon name="clock" />
                    <span className="d-lg-none">History</span>
                  </NavLink>
                </li>
                <li className="nav-item">
                  <button
                    type="button"
                    id="logout"
                    className="dz-nav__icon-link"
                    onClick={handleLogout}
                    aria-label="Log out"
                    title="Log out"
                  >
                    <Icon name="logout" />
                    <span className="d-lg-none">Logout</span>
                  </button>
                </li>
              </>
            )}
            <li className="nav-item">
              <ThemeToggle />
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Nav;
