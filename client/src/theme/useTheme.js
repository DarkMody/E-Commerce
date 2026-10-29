import { useCallback, useEffect, useState } from "react";

const KEY = "theme"; // "light" | "dark"

const getInitial = () =>
  document.documentElement.getAttribute("data-bs-theme") || "light";

/**
 * Returns [theme, toggleTheme].
 * The very first value is set by the small script in index.html (no flash).
 * A saved choice wins; otherwise we follow the system setting.
 */
export default function useTheme() {
  const [theme, setTheme] = useState(getInitial);

  // Apply + save whenever it changes
  useEffect(() => {
    document.documentElement.setAttribute("data-bs-theme", theme);
  }, [theme]);

  // Follow the system if the user never chose manually
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e) => {
      if (!localStorage.getItem(KEY)) setTheme(e.matches ? "dark" : "light");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(KEY, next);
      } catch {
        /* storage blocked: the theme still changes for this visit */
      }
      return next;
    });
  }, []);

  return [theme, toggleTheme];
}
