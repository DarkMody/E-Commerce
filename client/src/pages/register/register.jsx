import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/authLayout/authLayout";
import Button from "../../components/button/button";
import Input from "../../components/input/input";
import { migrateLocalCart } from "../../utils/migrateLocalCart";
import { SERVER_URL } from "../../config";
import "./register.css";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const INITIAL_VALUES = {
  name: "",
  email: "",
  password: "",
  confirm: "",
  storeName: "",
  storeLocation: "",
};

/* Small icons for the fields */
const ICONS = {
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </>
  ),
  mail: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </>
  ),
  lock: (
    <>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>
  ),
  store: (
    <>
      <path d="M3 9l1.5-5h15L21 9" />
      <path d="M4 9v11h16V9" />
      <path d="M10 20v-6h4v6" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z" />
      <circle cx="12" cy="9" r="2.5" />
    </>
  ),
};

function FieldIcon({ name }) {
  return (
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
      {ICONS[name]}
    </svg>
  );
}

const validate = (v, isSeller) => {
  const errors = {};
  if (v.name.trim().length < 3)
    errors.name = "Username must be at least 3 characters";
  if (!EMAIL_REGEX.test(v.email.trim()))
    errors.email = "Enter a valid email address";
  if (v.password.trim().length < 5)
    errors.password = "Password must be at least 5 characters";
  if (v.confirm.trim() !== v.password.trim())
    errors.confirm = "Passwords don't match";
  if (isSeller) {
    if (!v.storeName.trim()) errors.storeName = "Enter your store name";
    if (!v.storeLocation.trim())
      errors.storeLocation = "Enter your store location";
  }
  return errors;
};

function Register() {
  const navigate = useNavigate();

  const [accountType, setAccountType] = useState("customer");
  const [values, setValues] = useState(INITIAL_VALUES);
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);

  const isSeller = accountType === "seller";
  const errors = validate(values, isSeller);

  const setField = (field) => (e) =>
    setValues((prev) => ({ ...prev, [field]: e.target.value }));
  const touch = (field) => () =>
    setTouched((prev) => ({ ...prev, [field]: true }));
  const errorOf = (field) => (touched[field] ? errors[field] : undefined);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setTouched(
      Object.fromEntries(Object.keys(INITIAL_VALUES).map((k) => [k, true])),
    );
    if (Object.keys(errors).length > 0) {
      window.toast("invalid", "Please fix the highlighted fields");
      return;
    }

    const name = values.name.trim();
    const email = values.email.trim();
    const password = values.password.trim();

    setLoading(true);
    try {
      const res = await fetch(
        `${SERVER_URL}/api/register/${isSeller ? "seller" : "user"}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isSeller
              ? {
                  name,
                  email,
                  password,
                  store_name: values.storeName.trim(),
                  store_location: values.storeLocation.trim(),
                }
              : { name, email, password },
          ),
        },
      );
      const data = await res.json();

      if (data.status === "success") {
        localStorage.setItem("userData", JSON.stringify(data.data));
        window.loggedIn = true;
        window.toast("success", "Account created successfully");
        await migrateLocalCart();
        navigate("/");
      } else {
        window.toast("error", data.message || "Registration failed");
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
          <h2 className="auth-title">Create account</h2>
          <p className="auth-sub">
            Join DarkZon and start shopping in a minute.
          </p>
        </div>

        <fieldset className="register-type">
          <legend className="register-type__legend">I want to</legend>
          <div className="register-segment">
            <input
              type="radio"
              name="accountType"
              id="type-customer"
              checked={!isSeller}
              onChange={() => setAccountType("customer")}
              disabled={loading}
            />
            <label htmlFor="type-customer">Buy products</label>
            <input
              type="radio"
              name="accountType"
              id="type-seller"
              checked={isSeller}
              onChange={() => setAccountType("seller")}
              disabled={loading}
            />
            <label htmlFor="type-seller">Sell products</label>
          </div>
          <p className="auth-sub mt-2">
            {isSeller
              ? "Add your own products and track your sales."
              : "Shop from sellers across DarkZon."}
          </p>
        </fieldset>

        <Input
          label="Username"
          name="name"
          placeholder="Your name"
          autoComplete="name"
          value={values.name}
          onChange={setField("name")}
          onBlur={touch("name")}
          error={errorOf("name")}
          icon={<FieldIcon name="user" />}
          required
          disabled={loading}
        />
        <Input
          label="Email"
          type="email"
          name="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={values.email}
          onChange={setField("email")}
          onBlur={touch("email")}
          error={errorOf("email")}
          icon={<FieldIcon name="mail" />}
          required
          disabled={loading}
        />
        <Input
          label="Password"
          type="password"
          name="password"
          placeholder="At least 5 characters"
          autoComplete="new-password"
          value={values.password}
          onChange={setField("password")}
          onBlur={touch("password")}
          error={errorOf("password")}
          icon={<FieldIcon name="lock" />}
          required
          disabled={loading}
        />
        <Input
          label="Confirm password"
          type="password"
          name="confirm"
          placeholder="Repeat your password"
          autoComplete="new-password"
          value={values.confirm}
          onChange={setField("confirm")}
          onBlur={touch("confirm")}
          error={errorOf("confirm")}
          icon={<FieldIcon name="lock" />}
          required
          disabled={loading}
        />

        {/* Seller only */}
        {isSeller && (
          <div className="register-store d-flex flex-column gap-3">
            <Input
              label="Store name"
              name="storeName"
              placeholder="e.g. Tech Corner"
              value={values.storeName}
              onChange={setField("storeName")}
              onBlur={touch("storeName")}
              error={errorOf("storeName")}
              icon={<FieldIcon name="store" />}
              required
              disabled={loading}
            />
            <Input
              label="Store location"
              name="storeLocation"
              placeholder="City, country"
              autoComplete="street-address"
              value={values.storeLocation}
              onChange={setField("storeLocation")}
              onBlur={touch("storeLocation")}
              error={errorOf("storeLocation")}
              icon={<FieldIcon name="pin" />}
              required
              disabled={loading}
            />
          </div>
        )}

        <Button type="submit" featured fullWidth loading={loading}>
          {isSeller ? "Create seller account" : "Create account"}
        </Button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default Register;
