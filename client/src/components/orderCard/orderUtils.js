/* Small helpers shared by the order card, the history page and the dialogs. */

export const STATUS = {
  PROCESSING: "processing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

// "Processing" / "processing" -> "processing"
export const statusKey = (order) => String(order?.status ?? "").toLowerCase();

export const formatDate = (value) => {
  if (value) {
    return new Date(value).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
};

// The server stores the location as a JSON string. Never crash if it's empty or broken.
export const parseLocation = (value) => {
  if (!value) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

// What the CUSTOMER may do (same rules as before)
export const canCustomerEdit = (key) =>
  key === STATUS.PROCESSING || key === STATUS.SHIPPED; // phone (location only while processing)
export const canCancel = (key) => key === STATUS.PROCESSING; // customer and manager
