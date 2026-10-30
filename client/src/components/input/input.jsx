import { forwardRef, useId, useState } from "react";
import "./input.css";

const EyeIcon = ({ off }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M3 3l18 18" />}
  </svg>
);

/**
 * Underline input.
 *
 * Props
 *  - label         text shown above the field (linked to it, clicking it focuses the input)
 *  - error         true = red field, or a string = red field + message under it
 *  - helperText    grey hint under the field (hidden while there is an error message)
 *  - required      adds a red * to the label and the native `required`
 *  - disabled, readOnly
 *  - icon          any node shown on the left, e.g. <i className="fa-solid fa-magnifying-glass" />
 *  - size          "sm" | "md" | "lg"                                      (default "md")
 *  - type          "password" automatically gets a show/hide button
 *  - className     goes on the WRAPPER (use it for spacing/width: "mb-3", "w-50")
 *  - inputClassName goes on the <input> itself (e.g. "text-center")
 *  - ref           works, so you can call inputRef.current.focus()
 *  - everything else (name, value, onChange, onBlur, onFocus, onKeyDown, placeholder,
 *    autoComplete, inputMode, min, max, maxLength...) is passed straight to the <input>
 */
const Input = forwardRef(function Input(
  {
    label,
    id,
    type = "text",
    error,
    helperText,
    required = false,
    disabled = false,
    readOnly = false,
    icon = null,
    size = "md",
    className = "",
    inputClassName = "",
    ...rest
  },
  ref,
) {
  const autoId = useId();
  const inputId = id || autoId;
  const errorId = `${inputId}-error`;
  const helpId = `${inputId}-help`;

  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const errorMessage = typeof error === "string" ? error : "";

  const describedBy =
    [
      rest["aria-describedby"],
      errorMessage ? errorId : helperText ? helpId : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  const wrapperClass = [
    "dz-field",
    `dz-field--${size}`,
    error && "dz-field--error",
    icon && "has-icon",
    isPassword && "has-toggle",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapperClass}>
      {label && (
        <label htmlFor={inputId} className="dz-field__label">
          {label}
          {required && (
            <span className="dz-field__star" aria-hidden="true">
              {" "}
              *
            </span>
          )}
        </label>
      )}

      <div className="dz-field__control">
        {icon && (
          <span className="dz-field__icon" aria-hidden="true">
            {icon}
          </span>
        )}

        <input
          {...rest}
          ref={ref}
          id={inputId}
          type={isPassword && showPassword ? "text" : type}
          className={`dz-field__input ${inputClassName}`.trim()}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />

        {isPassword && (
          <button
            type="button"
            className="dz-field__toggle"
            onClick={() => setShowPassword((s) => !s)}
            disabled={disabled}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            <EyeIcon off={showPassword} />
          </button>
        )}
      </div>

      {errorMessage ? (
        <p
          id={errorId}
          className="dz-field__message dz-field__message--error"
          aria-live="polite"
        >
          {errorMessage}
        </p>
      ) : (
        helperText && (
          <p id={helpId} className="dz-field__message">
            {helperText}
          </p>
        )
      )}
    </div>
  );
});

export default Input;
