import { useState } from "react";
import AddressPicker from "../../components/addressPicker/addressPicker";
import Nav from "../../components/nav/nav";
import "./pay.css";
import { SERVER_URL } from "../../config";

const METHODS = [
  { id: "visa", title: "Visa", hint: "Pay online by card" },
  { id: "cash", title: "Cash", hint: "Pay when your order arrives" },
];

// allows an optional +, then 10-15 digits (spaces/dashes are ignored)
const isValidPhone = (value) =>
  /^\+?\d{10,15}$/.test(value.replace(/[\s-]/g, ""));

function Pay() {
  const [address, setAddress] = useState(null);
  const [method, setMethod] = useState("cash");
  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [placing, setPlacing] = useState(false);

  const phoneValid = isValidPhone(phone);
  const showPhoneError = phoneTouched && !phoneValid;

  const placeOrder = async () => {
    setPlacing(true);
    try {
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
        // Go to history page when i make it
      }
      window.toast(data.status, data.message);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <>
      <div className="co">
        <h1>Payment</h1>

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

        {/* NEW: phone number */}
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
                Enter a valid phone number (10–15 digits).
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
          disabled={!address || !phoneValid || placing}
          onClick={placeOrder}
        >
          {placing ? "Placing order…" : "Place order"}
        </button>
      </div>
    </>
  );
}

export default Pay;
