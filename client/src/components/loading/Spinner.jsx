import "./loading.css";

/**
 * Round spinner.
 *   <Spinner />                  default size
 *   <Spinner size="sm" />        inside buttons / next to text
 *   <Spinner size="lg" />        big, for a whole page
 */
export default function Spinner({ size = "md", label = "Loading…", className = "" }) {
  const sizeClass = size === "sm" ? "spinner-border-sm" : "";
  const style = { color: "var(--dz-primary)" };
  if (size === "lg") {
    style.width = "3rem";
    style.height = "3rem";
  }

  return (
    <div className={`spinner-border ${sizeClass} ${className}`} style={style} role="status">
      <span className="visually-hidden">{label}</span>
    </div>
  );
}

/**
 * Centered spinner for a page or a big section.
 *   <PageLoader />                 fills about half the screen
 *   <PageLoader fullScreen />      fills the whole screen (used by App.jsx)
 */
export function PageLoader({ fullScreen = false, minHeight = "50vh" }) {
  return (
    <div
      className={`d-flex justify-content-center align-items-center ${fullScreen ? "vh-100" : ""}`}
      style={fullScreen ? undefined : { minHeight }}
    >
      <Spinner size="lg" />
    </div>
  );
}
