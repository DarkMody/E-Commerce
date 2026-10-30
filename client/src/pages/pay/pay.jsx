import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AddressPicker from "../../components/addressPicker/addressPicker";
import ThemeToggle from "../../theme/ThemeToggle";
import Input from "../../components/input/input";
import Button from "../../components/button/button";
import { SERVER_URL } from "../../config";
import "./pay.css";

const METHODS = [
  {
    id: "visa",
    title: "Card Payment",
    hint: "Visa / Mastercard",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
  },
  {
    id: "cash",
    title: "Cash on Delivery",
    hint: "Pay when it arrives",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="2" />
        <path d="M6 12h.01M18 12h.01" />
      </svg>
    ),
  },
];

// Egyptian mobile numbers: optional +20 or 0, then 1[0125] and 8 digits
const isValidPhone = (value) =>
  /^(?:\+20|0)1[0125]\d{8}$/.test(value.replace(/[\s-]/g, ""));

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const MIN_PASSWORD = 8;

function Pay() {
  const navigate = useNavigate();

  const [address, setAddress] = useState(null);
  const [method, setMethod] = useState("cash");
  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [placing, setPlacing] = useState(false);

  // Auth: undefined = checking, null = guest, object = logged-in user
  const [user, setUser] = useState(undefined);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const checkUser = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/api/user`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!cancelled) {
          setUser(data.status === "success" && data.data ? data.data : null);
        }
      } catch {
        if (!cancelled) setUser(null);
      }
    };

    checkUser();

    return () => {
      cancelled = true;
    };
  }, []);

  const phoneValid = isValidPhone(phone);
  const showPhoneError = phoneTouched && !phoneValid;

  const emailValid = isValidEmail(email);
  const passwordValid = password.length >= MIN_PASSWORD;
  const confirmValid = confirm === password && confirm.length > 0;

  const showEmailError = emailTouched && !emailValid;
  const showPasswordError = passwordTouched && !passwordValid;
  const showConfirmError = confirmTouched && !confirmValid;

  const isGuest = user === null;
  const accountValid = user
    ? true
    : isGuest && emailValid && passwordValid && confirmValid;

  const placeOrder = async () => {
    setPlacing(true);

    try {
      if (!window.loggedIn) {
        const newUser = await fetch(`${SERVER_URL}/api/register/user`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: email.split("@")[0],
            email,
            password,
          }),
        });
        const ans = await newUser.json();
        if (ans.status === "success") {
          localStorage.setItem("userData", JSON.stringify(ans.data));
          window.loggedIn = true;

          // Migrate localCart products to the newly registered user's cart
          const localCart = JSON.parse(
            localStorage.getItem("localCart") || "[]",
          );
          if (localCart.length > 0) {
            await Promise.all(
              localCart.map((item) =>
                fetch(`${SERVER_URL}/api/cart/${item.productId}`, {
                  method: "POST",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ quantity: item.quantity }),
                }).catch(() => null),
              ),
            );
          }
          localStorage.removeItem("localCart");
        } else {
          window.toast(ans.status, ans.message || "Registration failed.");
          return;
        }
      }

      // Place the order
      const res = await fetch(`${SERVER_URL}/api/order`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location: address,
          phoneNumber: phone,
          method,
        }),
      });
      const data = await res.json();

      if (data.status === "success") {
        window.toast("success", "Order placed successfully!");
        navigate("/history");
      } else {
        window.toast(data.status, data.message || "Could not place order.");
      }
    } catch {
      window.toast("error", "Network error. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="checkout-page">
      {/* ========================================================
         MINIMAL CHECKOUT HEADER (Distraction-Free)
         ======================================================== */}
      <header className="checkout-header">
        <div className="container d-flex justify-content-between align-items-center">
          <Link to="/cart" className="checkout-back-link">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>Back to Cart</span>
          </Link>

          <Link to="/" className="checkout-brand">
            DarkZon
          </Link>

          <div className="d-flex align-items-center gap-3">
            <span className="checkout-secure-badge d-none d-sm-inline-flex">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Secure Checkout</span>
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ========================================================
         CHECKOUT MAIN CONTENT
         ======================================================== */}
      <main className="container py-4 py-md-5">
        <div className="checkout-container">
          <h1 className="checkout-title">Checkout & Payment</h1>

          {/* 1. Account Section */}
          <section className="checkout-card">
            <div className="checkout-card-header">
              <h2 className="checkout-card-title">1. Account Details</h2>
              <p className="checkout-card-sub">
                {user
                  ? "Your order will be linked to your account."
                  : "Create an account to complete your order and track delivery."}
              </p>
            </div>

            {user ? (
              <div className="checkout-user-box">
                <div className="checkout-user-avatar">
                  {user.image ? (
                    <img
                      src={`${SERVER_URL}/uploads/${user.image}`}
                      alt={user.name || "User profile"}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <span>{user.email ? user.email.charAt(0).toUpperCase() : "U"}</span>
                  )}
                </div>
                <div className="flex-grow-1">
                  <div className="fw-bold">{user.name || "Customer"}</div>
                  <div className="text-muted small">{user.email}</div>
                </div>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--dz-success)"
                  strokeWidth="3"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            ) : isGuest ? (
              <div className="d-flex flex-column gap-3">
                <Input
                  label="Email Address"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  error={
                    showEmailError ? "Enter a valid email address." : undefined
                  }
                  required
                />

                <Input
                  label="Password"
                  type="password"
                  autoComplete="new-password"
                  placeholder={`At least ${MIN_PASSWORD} characters`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setPasswordTouched(true)}
                  error={
                    showPasswordError
                      ? `Password must be at least ${MIN_PASSWORD} characters.`
                      : undefined
                  }
                  required
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onBlur={() => setConfirmTouched(true)}
                  error={
                    showConfirmError ? "Passwords do not match." : undefined
                  }
                  required
                />
              </div>
            ) : null}
          </section>

          {/* 2. Delivery Address */}
          <section className="checkout-card">
            <div className="checkout-card-header">
              <h2 className="checkout-card-title">2. Delivery Location</h2>
              <p className="checkout-card-sub">
                Search, tap the map, or drag the pin directly to your door.
              </p>
            </div>

            <AddressPicker onSelect={setAddress} />

            <div
              className={`checkout-address-box ${address ? "" : "is-empty"}`}
            >
              {address ? (
                <div>
                  <div className="fw-semibold mb-1 text-body">
                    Delivering to:
                  </div>
                  <div>{address.formattedAddress}</div>
                </div>
              ) : (
                "No location selected on map yet."
              )}
            </div>
          </section>

          {/* 3. Contact Phone */}
          <section className="checkout-card">
            <div className="checkout-card-header">
              <h2 className="checkout-card-title">3. Contact Phone</h2>
              <p className="checkout-card-sub">
                The courier will call this number upon delivery.
              </p>
            </div>

            <Input
              label="Phone Number"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="e.g. 010 1234 5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={() => setPhoneTouched(true)}
              error={
                showPhoneError
                  ? "Enter a valid Egyptian mobile number (e.g. 01012345678)."
                  : undefined
              }
              helperText="Egyptian numbers starting with 010, 011, 012, or 015."
              required
            />
          </section>

          {/* 4. Payment Method */}
          <section className="checkout-card">
            <div className="checkout-card-header">
              <h2 className="checkout-card-title">4. Payment Method</h2>
              <p className="checkout-card-sub">
                Choose how you'd like to pay for your order.
              </p>
            </div>

            <div
              className="checkout-methods-grid"
              role="radiogroup"
              aria-label="Payment method"
            >
              {METHODS.map((m) => {
                const isSelected = method === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    className={`checkout-method-card ${isSelected ? "is-active" : ""}`}
                    onClick={() => setMethod(m.id)}
                  >
                    <div className="checkout-method-icon">{m.icon}</div>
                    <div className="checkout-method-info">
                      <div className="checkout-method-title">{m.title}</div>
                      <div className="checkout-method-hint">{m.hint}</div>
                    </div>
                    <div className="checkout-method-radio" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </section>

          {/* 5. Complete Order Button */}
          <div className="mt-4 pt-2">
            <Button
              variant="primary"
              size="lg"
              featured
              fullWidth
              loading={placing}
              disabled={
                user === undefined ||
                !accountValid ||
                !address ||
                !phoneValid ||
                placing
              }
              onClick={placeOrder}
            >
              {placing ? "Placing your order…" : "Place Order"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Pay;
