/**
 * Global toast notifications.
 * Importing this file once (App.jsx does it) makes  window.toast(status, message)  available,
 * so every page keeps calling it exactly as before:
 *   window.toast("success", "Saved");
 *   window.toast("error", "Something went wrong");
 *   window.toast("invalid", "Check your input");   // any other status = warning style
 *
 * The container is created automatically, no <div id="toast-box"> needed in JSX.
 * Styles live in App.css.
 */

const DURATION_MS = 5000;

const TYPES = {
  success: "fa-circle-check",
  error: "fa-circle-xmark",
  invalid: "fa-circle-exclamation",
};

const getContainer = () => {
  let box = document.getElementById("toast-box");
  if (!box) {
    box = document.createElement("div");
    box.id = "toast-box";
    box.className = "toast-box position-fixed bottom-0 end-0 p-3";
    box.setAttribute("aria-live", "polite");
    document.body.appendChild(box);
  }
  return box;
};

export default function showToast(status, message) {
  const type = TYPES[status] ? status : "invalid";

  const toast = document.createElement("div");
  toast.className =
    `toasty ${type} d-flex align-items-center gap-3 position-relative ` +
    "overflow-hidden fw-semibold rounded-3 px-3 py-3 mb-2";
  toast.setAttribute("role", type === "error" ? "alert" : "status");

  const icon = document.createElement("i");
  icon.className = `fa-solid ${TYPES[type]}`;
  icon.setAttribute("aria-hidden", "true");

  const text = document.createElement("span");
  text.textContent = message;

  toast.append(icon, text);
  getContainer().appendChild(toast);
  setTimeout(() => toast.remove(), DURATION_MS);
}

window.toast = showToast;
