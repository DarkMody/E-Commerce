import { useEffect, useId, useRef } from "react";

function Modal({
  title,
  onClose,
  closeDisabled = false,
  footer,
  size,
  children,
}) {
  const titleId = useId();
  const contentRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose; // always the latest onClose, without re-running the effects

  // Move focus into the dialog once, when it opens
  useEffect(() => {
    contentRef.current?.focus();
  }, []);

  // Escape key + stop the page behind from scrolling
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !closeDisabled) closeRef.current();
    };
    document.addEventListener("keydown", onKey);
    document.body.classList.add("modal-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("modal-open");
    };
  }, [closeDisabled]);

  return (
    <>
      <div className="modal-backdrop show"></div>
      <div
        className="modal d-block"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex="-1"
        onMouseDown={(e) => {
          // only a click directly on the dark area closes it (not a text selection that ends there)
          if (e.target === e.currentTarget && !closeDisabled)
            closeRef.current();
        }}
      >
        <div
          className={`modal-dialog modal-dialog-centered modal-dialog-scrollable ${size ? `modal-${size}` : ""}`}
        >
          <div className="modal-content" ref={contentRef} tabIndex="-1">
            <div className="modal-header">
              <h2 className="modal-title h5 fw-bold" id={titleId}>
                {title}
              </h2>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={onClose}
                disabled={closeDisabled}
              ></button>
            </div>
            <div className="modal-body">{children}</div>
            {footer && <div className="modal-footer">{footer}</div>}
          </div>
        </div>
      </div>
    </>
  );
}

export default Modal;
