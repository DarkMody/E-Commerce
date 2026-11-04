import { useEffect, useState } from "react";
import Pagination from "../../components/pagination/Pagination";
import Input from "../../components/input/input";
import Button from "../../components/button/button";
import Modal from "../../components/modal/modal";
import { TableRowsSkeleton, useDelayedLoading } from "../../components/loading";
import { SERVER_URL } from "../../config";

const ROLES = ["customer", "seller", "manager", "admin", "employee"];

const getMyId = () => {
  try {
    return JSON.parse(localStorage.getItem("userData"))?.id;
  } catch {
    return undefined;
  }
};
const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const SearchIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);

/* ---------- Confirm delete dialog ---------- */
function DeleteUserModal({ user, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/delete/user/${user.u_id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await res.json();
      window.toast(result.status, result.message);
      if (res.ok) onDeleted(user);
    } catch {
      window.toast("error", "Network error. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      title="Delete account"
      onClose={onClose}
      closeDisabled={deleting}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting}>
            Delete account
          </Button>
        </>
      }
    >
      <p className="mb-2">
        Delete the account of <strong>{user.name}</strong> ({user.email})?
      </p>
      <p className="text-secondary small mb-0">
        This can't be undone. Their orders are kept and will show as "Deleted
        account".
      </p>
    </Modal>
  );
}

export default function AdminRoles() {
  const myId = getMyId();
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [savingId, setSavingId] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const showSkeleton = useDelayedLoading(loading);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `${SERVER_URL}/api/users?page=${page}&search=${encodeURIComponent(search)}`,
          { credentials: "include" },
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Could not load users.");
        if (!cancelled) {
          setUsers(data.data);
          setTotalPages(data.pagination.totalPages);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [page, search, reloadKey]);

  const changeRole = async (user, newRole) => {
    const oldRole = user.role;
    setSavingId(user.u_id);
    // Update the UI right away; go back if the server refuses.
    setUsers((prev) =>
      prev.map((u) => (u.u_id === user.u_id ? { ...u, role: newRole } : u)),
    );
    try {
      // PATCH /api/role/edit/:u_id { role }
      const res = await fetch(`${SERVER_URL}/api/role/edit/${user.u_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role: newRole }),
      });
      const result = await res.json();
      if (!res.ok)
        throw new Error(result.message || "Could not update the role.");
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

  const handleDeleted = (user) => {
    setDeleting(null);
    setUsers((prev) => prev.filter((u) => u.u_id !== user.u_id));
    if (users.length === 1 && page > 1) setPage(page - 1);
    else setReloadKey((k) => k + 1); // fill the page again
  };

  return (
    <>
      <h1 className="dash-title">Edit Roles</h1>

      <div className="mb-4 dash-search">
        <Input
          type="search"
          name="userSearch"
          placeholder="Search by user email"
          aria-label="Search users by email"
          icon={<SearchIcon />}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      {error && (
        <div
          className="alert alert-danger d-flex flex-wrap justify-content-between align-items-center gap-2"
          role="alert"
        >
          <span>{error}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReloadKey((k) => k + 1)}
          >
            Try again
          </Button>
        </div>
      )}

      <div className="dash-panel">
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Joined</th>
                <th style={{ width: 190 }}>Role</th>
                <th style={{ width: 110 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading && showSkeleton && (
                <TableRowsSkeleton rows={8} cols={5} />
              )}
              {!loading && !error && users.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center text-secondary py-4">
                    No users found.
                  </td>
                </tr>
              )}
              {!loading &&
                users.map((u) => {
                  const isMe = u.u_id === myId;
                  return (
                    <tr key={u.u_id}>
                      <td className="fw-semibold">
                        {u.name}
                        {isMe && <span className="admin-badge ms-2">You</span>}
                      </td>
                      <td className="text-break">{u.email}</td>
                      <td className="text-secondary text-nowrap">
                        {formatDate(u.created_at)}
                      </td>
                      <td>
                        <select
                          className="form-select form-select-sm text-capitalize"
                          value={u.role}
                          disabled={
                            savingId === u.u_id || isMe || u.role == "seller"
                          }
                          onChange={(e) => changeRole(u, e.target.value)}
                          aria-label={`Role for ${u.name}`}
                          title={
                            isMe
                              ? "You can't change your own role"
                              : undefined || u.role == "seller"
                                ? "Seller role can't be changed"
                                : undefined
                          }
                        >
                          {ROLES.map((r) => {
                            if (r === "seller" || r === "admin") {
                              return (
                                <option
                                  key={r}
                                  disabled={true}
                                  title={`You have to make this user create new ${r} account`}
                                  value={r}
                                >
                                  {r}
                                </option>
                              );
                            }
                            return (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            );
                          })}
                        </select>
                      </td>
                      <td className="text-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="dash-danger-btn"
                          disabled={isMe}
                          onClick={() => setDeleting(u)}
                          aria-label={`Delete ${u.name}`}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {deleting && (
        <DeleteUserModal
          user={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={handleDeleted}
        />
      )}
    </>
  );
}
