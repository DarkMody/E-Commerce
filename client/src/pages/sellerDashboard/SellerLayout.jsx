import DashboardLayout from "../../components/dashboardLayout/dashboardLayout";

const LINKS = [
  { to: "/seller", label: "Main", end: true },
  { to: "/seller/products", label: "My Products" },
  { to: "/seller/orders", label: "Orders" },
];

/**
 * Routes (App.jsx):
 *   <Route path="/seller" element={<SellerLayout />}>
 *     <Route index element={<SellerMain />} />
 *     <Route path="products" element={<SellerProducts />} />
 *     <Route path="orders" element={<SellerOrders />} />
 *   </Route>
 * TODO (security): only the role "seller" may open this route.
 */
export default function SellerLayout() {
  return <DashboardLayout label="Seller" links={LINKS} />;
}
