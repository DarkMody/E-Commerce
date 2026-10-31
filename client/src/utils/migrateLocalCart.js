import { SERVER_URL } from "../config";

export async function migrateLocalCart() {
  let cart = [];
  try {
    cart = JSON.parse(localStorage.getItem("localCart")) || [];
  } catch {
    cart = [];
  }

  await Promise.all(
    cart.map((item) =>
      fetch(`${SERVER_URL}/api/cart/${item.productId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: item.quantity }),
      }).catch(() => {}),
    ),
  );

  localStorage.removeItem("localCart");
}
