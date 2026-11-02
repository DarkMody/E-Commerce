import DashboardLayout from "../../components/dashboardLayout/dashboardLayout";

const LINKS = [
  { to: "/manager", label: "Main", end: true },
  { to: "/manager/orders", label: "Orders" },
  { to: "/manager/couriers", label: "Couriers" },
];

/**
 * Routes (App.jsx):
 *   <Route path="/manager" element={<ManagerLayout />}>
 *     <Route index element={<ManagerMain />} />
 *     <Route path="orders" element={<ManagerOrders />} />
 *     <Route path="couriers" element={<ManagerCouriers />} />
 *   </Route>
 * TODO (security): only the roles "manager" and "admin" may open this route.
 */
export default function ManagerLayout() {
  return <DashboardLayout label="Manager" links={LINKS} />;
}
