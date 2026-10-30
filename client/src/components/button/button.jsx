import "./button.css";

const VARIANTS = {
  primary: "btn-primary", // everyday: soft hover
  outline: "btn-outline-primary",
  accent: "btn-accent", // lime
  ghost: "btn-ghost",
  danger: "btn-danger",
};
const SIZES = { sm: "btn-sm", md: "", lg: "btn-lg" };

/**
 * Props
 *  - children        button text (or `text`, the old prop, still works)
 *  - variant         "primary" | "outline" | "accent" | "ghost" | "danger"   (default "primary")
 *  - size            "sm" | "md" | "lg"                                      (default "md")
 *  - featured        true = signature accent-sweep hover (primary variant only).
 *                    Use on the 2-3 main actions: Add to cart, Pay, Checkout.
 *  - loading         shows a spinner and blocks clicks
 *  - disabled, fullWidth, icon (any node, shown before the text)
 *  - onClick         (old `onclick` still works)
 *  - type, id, className, and any other normal button attribute
 */
function Button({
  children,
  text,
  variant = "primary",
  size = "md",
  featured = false,
  loading = false,
  disabled = false,
  fullWidth = false,
  icon = null,
  id,
  className = "",
  onClick,
  onclick,
  ...rest
}) {
  const classes = [
    "btn dz-btn rounded-pill fw-semibold d-inline-flex align-items-center justify-content-center gap-2",
    VARIANTS[variant] || VARIANTS.primary,
    SIZES[size],
    featured && variant === "primary" && "btn-sweep",
    fullWidth && "w-100",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      id={id}
      className={classes}
      onClick={onClick ?? onclick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <span
          className="spinner-border spinner-border-sm"
          aria-hidden="true"
        ></span>
      ) : (
        icon
      )}
      <span>{children ?? text}</span>
    </button>
  );
}

export default Button;
