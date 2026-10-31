import { Link } from "react-router-dom";
import ThemeToggle from "../../theme/ThemeToggle";
import "./authLayout.css";

const DEFAULT_PILLS = [
  "🔒 Secure checkout",
  "🚚 Fast delivery",
  "⭐ Top-rated sellers",
  "💰 Best prices",
];

function AuthLayout({ children, pills = DEFAULT_PILLS }) {
  return (
    <div className="auth-page">
      <div className="auth-brand-panel">
        <div className="auth-brand-inner">
          <Link to="/" className="auth-back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to Home
          </Link>

          <h1 className="auth-brand-name">DarkZon</h1>
          <p className="auth-brand-tagline">
            The best place to find whatever you want — at the best prices.
          </p>

          <div className="auth-pills">
            {pills.map((text) => (
              <span className="auth-pill" key={text}>
                {text}
              </span>
            ))}
          </div>
          <div className="auth-accent-bar" aria-hidden="true"></div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-theme-toggle">
          <ThemeToggle />
        </div>
        {children}
      </div>
    </div>
  );
}

export default AuthLayout;
