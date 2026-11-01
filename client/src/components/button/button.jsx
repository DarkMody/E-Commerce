import "./button.css";

const VARIANTS = {
  primary: "btn-primary",
  outline: "btn-outline-primary",
  accent: "btn-accent",
  ghost: "btn-ghost",
  danger: "btn-danger",
};
const SIZES = { sm: "btn-sm", md: "", lg: "btn-lg" };

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
