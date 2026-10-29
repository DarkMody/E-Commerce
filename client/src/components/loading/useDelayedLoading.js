import { useEffect, useState } from "react";

/**
 * Stops loading screens from flashing when the server answers very fast.
 * Returns true only if `loading` has lasted longer than `delay` ms.
 *
 *   const showLoading = useDelayedLoading(loading);
 *   if (loading) return showLoading ? <OrderGridSkeleton /> : null;
 */
export default function useDelayedLoading(loading, delay = 200) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!loading) {
      setShow(false);
      return;
    }
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [loading, delay]);

  return show;
}
