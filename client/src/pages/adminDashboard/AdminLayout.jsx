import DashboardLayout from "../../components/dashboardLayout/dashboardLayout";

// Sidebar items. Add more later: one line here + one <Route> in App.jsx.
const LINKS = [
  { to: "/admin", label: "Main", end: true },
  { to: "/admin/roles", label: "Edit Roles" },
  { to: "/admin/orders", label: "All Orders" },
  { to: "/admin/checkProducts", label: "Check Products" },
];

export default function AdminLayout() {
  return <DashboardLayout label="Admin" links={LINKS} />;
}
