import { useEffect, useState } from "react";
import Pagination from "../../components/pagination/Pagination";
import { SERVER_URL } from "../../config";

const ROLES = ["customer", "seller", "manager", "admin", "employee"];
const PAGE_SIZE = 10;

export default function AdminRoles() {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null); // user whose role is being saved
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState(""); // debounced value sent to the server
  const [deletingId, setDeletingId] = useState(null); // user being deleted

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${SERVER_URL}/api/users?page=${page}&search=${encodeURIComponent(search)}`,
          { credentials: "include" },
        );
        if (!res.ok) throw new Error("Could not load users.");
        const data = await res.json();
        setUsers(data.data);
        setTotalPages(data.pagination.totalPages);
      } catch (err) {
        window.toast("error", err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page, search]);

  const changeRole = async (user, newRole) => {
    const oldRole = user.role;
    setSavingId(user.u_id);
    // Update the UI right away; revert if the server refuses.
    setUsers((prev) =>
      prev.map((u) => (u.u_id === user.u_id ? { ...u, role: newRole } : u)),
    );
    try {
      const res = await fetch(`${SERVER_URL}/api/role/edit/${user.u_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error("Could not update the role.");
      const result = await res.json();
      window.toast(result.status, result.message);
    } catch (err) {
      window.toast("error", err.message);
      setUsers((prev) =>
        prev.map((u) => (u.u_id === user.u_id ? { ...u, role: oldRole } : u)),
      );
    } finally {
      setSavingId(null);
    }
  };

  const deleteUser = async (user) => {
    if (
      !window.confirm(
        `Delete the account of ${user.name} (${user.email})? This can't be undone.`,
      )
    )
      return;

    setDeletingId(user.u_id);
    try {
      const res = await fetch(`${SERVER_URL}/api/delete/user/${user.u_id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Could not delete the account.");
      const result = await res.json();
      window.toast(result.status, result.message);

      setUsers((prev) => prev.filter((u) => u.u_id !== user.u_id));
      if (users.length === 1 && page > 1) setPage(page - 1);
    } catch (err) {
      window.toast("error", err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <h1 className="admin-title">Edit Roles</h1>
      <input
        type="search"
        className="form-control mb-4 admin-search"
        placeholder="Search by user email"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        aria-label="Search users by email"
      />
      <div className="admin-panel">
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th style={{ width: 200 }}>Role</th>
                <th style={{ width: 100 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="3" className="text-center py-4">
                    <div className="spinner-border" role="status"></div>
                  </td>
                </tr>
              )}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan="3" className="text-center text-secondary py-4">
                    No users found.
                  </td>
                </tr>
              )}
              {!loading &&
                users.map((u) => (
                  <tr key={u.u_id}>
                    <td className="fw-semibold">{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <select
                        className="form-select"
                        value={u.role}
                        disabled={savingId === u.u_id}
                        onChange={(e) => changeRole(u, e.target.value)}
                        aria-label={`Role for ${u.name}`}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-outline-danger btn-sm"
                        disabled={deletingId === u.u_id}
                        onClick={() => deleteUser(u)}
                        aria-label={`Delete ${u.name}`}
                      >
                        {deletingId === u.u_id ? (
                          <span className="spinner-border spinner-border-sm"></span>
                        ) : (
                          "Delete"
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </>
  );
}
