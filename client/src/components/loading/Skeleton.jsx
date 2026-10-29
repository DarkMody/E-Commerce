import "./loading.css";

/**
 * One animated grey block. Build any loading layout from these.
 *   <Skeleton height="1rem" width="60%" />
 *   <Skeleton circle width="48px" height="48px" />   // avatar
 * Props: width, height, circle, rounded (any CSS radius), className, style
 */
export default function Skeleton({
  width = "100%",
  height = "1rem",
  circle = false,
  rounded,
  className = "",
  style,
}) {
  return (
    <span
      className={`placeholder placeholder-wave d-block ${className}`}
      style={{
        width,
        height,
        borderRadius: circle ? "50%" : rounded,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}
