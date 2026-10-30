import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/button/button";
import Input from "../../components/input/input";
import ThemeToggle from "../../theme/ThemeToggle";
import { SERVER_URL } from "../../config";
import "./login.css";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  const emailError =
    emailTouched && !EMAIL_REGEX.test(email)
      ? "Enter a valid email address"
      : undefined;

  const passwordError =
    passwordTouched && password.length < 5
      ? "Password must be at least 5 characters"
      : undefined;

  const handleSubmit = async (e) => {
    e?.preventDefault();

    // Mark all fields touched so errors show on submit
    setEmailTouched(true);
    setPasswordTouched(true);

    if (!EMAIL_REGEX.test(email)) {
      window.toast?.("invalid", "Enter a valid email address");
      return;
    }
    if (password.length < 5) {
      window.toast?.("invalid", "Password must be at least 5 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });
      const data = await res.json();

      if (data.status === "success") {
        localStorage.setItem("userData", JSON.stringify(data.data));
        window.loggedIn = true;
        window.toast?.("success", "Welcome to DarkZon 🎉");

        // Migrate guest localCart to server cart
        const localCart = JSON.parse(
          localStorage.getItem("localCart") || "null",
        );
        if (localCart && localCart.length > 0) {
          await Promise.all(
            localCart.map((product) =>
              fetch(`${SERVER_URL}/api/cart/${product.productId}`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ quantity: product.quantity }),
              }).catch(() => {}),
            ),
          );
        }
        localStorage.removeItem("localCart");

        navigate("/");
      } else {
        window.toast?.("error", data.message || "Login failed");
      }
    } catch {
      window.toast?.("error", "Network error — please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* ── Left brand panel ─────────────────────────────── */}
      <div className="login-brand-panel">
        <div className="login-brand-inner">
          {/* Back link */}
          <Link to="/" className="login-back-link">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to Home
          </Link>

          {/* Brand */}
          {/* <div className="login-brand-logo">
            <span className="login-brand-dot" />
          </div> */}
          <h1 className="login-brand-name">DarkZon</h1>
          <p className="login-brand-tagline">
            The best place to find whatever you want — at the best prices.
          </p>

          {/* Feature pills */}
          <div className="login-feature-pills">
            <span className="login-pill">🔒 Secure checkout</span>
            <span className="login-pill">🚚 Fast delivery</span>
            <span className="login-pill">⭐ Top-rated sellers</span>
            <span className="login-pill">💰 Best prices</span>
          </div>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────── */}
      <div className="login-form-panel">
        {/* Theme toggle top-right */}
        <div className="login-theme-toggle">
          <ThemeToggle />
        </div>

        <form className="login-form-card" onSubmit={handleSubmit} noValidate>
          <div className="login-form-header">
            <h2 className="login-form-title">Sign in</h2>
            <p className="login-form-sub">
              Welcome back — good to see you again.
            </p>
          </div>

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setEmailTouched(true)}
            error={emailError}
            required
            disabled={loading}
            icon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            }
          />

          <Input
            label="Password"
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setPasswordTouched(true)}
            error={passwordError}
            required
            disabled={loading}
            icon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            }
          />

          <Button
            text="Sign in"
            variant="primary"
            featured
            fullWidth
            loading={loading}
            onclick={handleSubmit}
          />

          <p className="login-register-link">
            Don&apos;t have an account? <Link to="/register">Create one</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
