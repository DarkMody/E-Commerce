import { useEffect, useState } from "react";
import AddressPicker from "../../components/addressPicker/addressPicker";
import Nav from "../../components/nav/nav";
import "./pay.css";
import { SERVER_URL } from "../../config";
import { useNavigate } from "react-router-dom";

const METHODS = [
  { id: "visa", title: "Visa", hint: "Pay online by card" },
  { id: "cash", title: "Cash", hint: "Pay when your order arrives" },
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

  // auth: undefined = still checking, null = not logged in, object = logged in
  const [user, setUser] = useState(undefined);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/api/user`, {
          credentials: "include",
        });
        const data = await res.json();
        setUser(data.status === "success" && data.data ? data.data : null);
      } catch {
        setUser(null);
      }
    };
    checkUser();
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
      if (ans.status == "success") {
        localStorage.setItem("userData", JSON.stringify(ans.data));
        window.loggedIn = true;
        // Adding choosen product to add to this user's cart
        const localCart = JSON.parse(localStorage.getItem("localCart"));
        if (localCart) {
          localCart.map(async (product) => {
            await fetch(`${SERVER_URL}/api/cart/${product.productId}`, {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ quantity: product.quantity }),
            })
              .then((res) => res.json())
              .then((data) => {
                console.log(data);
              });
          });
        }
        localStorage.removeItem("localCart");
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
        if (data.status == "success") {
          navigate("/history");
        }
        window.toast(data.status, data.message);
      } else {
        window.toast(ans.status, ans.message);
      }
    } finally {
      setPlacing(false);
    }
  };

  return (
    <>
      <div className="co">
        <h1>Payment</h1>

        {/* Account: show email if logged in, otherwise sign-up inputs */}
        {user && (
          <div className="co-block">
            <h2>Account</h2>
            <p className="co-sub">Your order will be linked to this account.</p>
            <div className="co-selected">{user.email}</div>
          </div>
        )}

        {isGuest && (
          <div className="co-block">
            <h2>Account</h2>
            <p className="co-sub">
              Create an account to place your order and track it later.
            </p>

            <div
              className={`co-field ${showEmailError ? "has-error" : ""} mb-3`}
            >
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="e.g. name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                aria-label="Email"
                aria-invalid={showEmailError}
                aria-describedby={showEmailError ? "email-error" : undefined}
              />
              {showEmailError && (
                <p id="email-error" className="co-error" role="alert">
                  Enter a valid email address.
                </p>
              )}
            </div>

            <div
              className={`co-field ${showPasswordError ? "has-error" : ""} mb-3`}
            >
              <input
                type="password"
                autoComplete="new-password"
                placeholder={`Password (min ${MIN_PASSWORD} characters)`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setPasswordTouched(true)}
                aria-label="Password"
                aria-invalid={showPasswordError}
                aria-describedby={
                  showPasswordError ? "password-error" : undefined
                }
              />
              {showPasswordError && (
                <p id="password-error" className="co-error" role="alert">
                  Password must be at least {MIN_PASSWORD} characters.
                </p>
              )}
            </div>

            <div className={`co-field ${showConfirmError ? "has-error" : ""}`}>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Confirm password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onBlur={() => setConfirmTouched(true)}
                aria-label="Confirm password"
                aria-invalid={showConfirmError}
                aria-describedby={
                  showConfirmError ? "confirm-error" : undefined
                }
              />
              {showConfirmError && (
                <p id="confirm-error" className="co-error" role="alert">
                  Passwords do not match.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="co-block">
          <h2>Delivery address</h2>
          <p className="co-sub">
            Search, tap the map, or drag the pin to your door.
          </p>
          <AddressPicker onSelect={setAddress} />
          <div className={`co-selected ${address ? "" : "is-empty"}`}>
            {address ? address.formattedAddress : "No location picked yet"}
          </div>
        </div>

        <div className="co-block">
          <h2>Phone number</h2>
          <p className="co-sub">The courier will call you on this number.</p>
          <div className={`co-field ${showPhoneError ? "has-error" : ""}`}>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="e.g. +20 100 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={() => setPhoneTouched(true)}
              aria-label="Phone number"
              aria-invalid={showPhoneError}
              aria-describedby={showPhoneError ? "phone-error" : undefined}
            />
            {showPhoneError && (
              <p id="phone-error" className="co-error" role="alert">
                Enter a valid Egyptian phone number.
              </p>
            )}
          </div>
        </div>

        <div className="co-block">
          <h2>Payment method</h2>
          <div
            className="co-methods"
            role="radiogroup"
            aria-label="Payment method"
          >
            {METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={method === m.id}
                className={`co-method ${method === m.id ? "on" : ""}`}
                onClick={() => setMethod(m.id)}
              >
                <strong>{m.title}</strong>
                <span>{m.hint}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="co-order"
          disabled={
            user === undefined ||
            !accountValid ||
            !address ||
            !phoneValid ||
            placing
          }
          onClick={placeOrder}
        >
          {placing ? "Placing order…" : "Place order"}
        </button>
      </div>
    </>
  );
}

export default Pay;
