import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/authLayout/authLayout";
import Button from "../../components/button/button";
import Input from "../../components/input/input";
import { migrateLocalCart } from "../../utils/migrateLocalCart";
import { SERVER_URL } from "../../config";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const MailIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);
const LockIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  const emailInvalid = !EMAIL_REGEX.test(email.trim());
  const passwordInvalid = password.trim().length < 5;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setEmailTouched(true);
    setPasswordTouched(true);
    if (emailInvalid || passwordInvalid) {
      window.toast("invalid", "Please fix the highlighted fields");
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
        window.toast("success", "Welcome to DarkZon 🎉");
        await migrateLocalCart();
        navigate("/");
      } else {
        window.toast("error", data.message || "Login failed");
      }
    } catch {
      window.toast("error", "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <Link to="/" className="auth-back-link back-link-copy">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to Home
        </Link>
        <div>
          <h2 className="auth-title">Login</h2>
          <p className="auth-sub">Welcome back — good to see you again.</p>
        </div>

        <Input
          label="Email"
          type="email"
          name="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setEmailTouched(true)}
          error={
            emailTouched && emailInvalid
              ? "Enter a valid email address"
              : undefined
          }
          icon={<MailIcon />}
          required
          disabled={loading}
        />
        <Input
          label="Password"
          type="password"
          name="password"
          placeholder="Your password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => setPasswordTouched(true)}
          error={
            passwordTouched && passwordInvalid
              ? "Password must be at least 5 characters"
              : undefined
          }
          icon={<LockIcon />}
          required
          disabled={loading}
        />

        <Button type="submit" featured fullWidth loading={loading}>
          Login
        </Button>

        <p className="auth-switch">
          Don&apos;t have an account? <Link to="/register">Create one</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default Login;
