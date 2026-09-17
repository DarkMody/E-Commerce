import "./profile.css";
import { useState, useEffect } from "react";
import { SERVER_URL } from "../../config";
import Nav from "../../components/nav/nav";
import Follow from "../../components/follow/follow";
import Footer from "../../components/footer/footer";

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- Edit profile modal state ---
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // --- Change password modal state ---
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // --- Delete profile state ---
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(`${SERVER_URL}/api/user`, {
          credentials: "include",
        });
        const data = await res.json();
        console.log(data);
        setUser(data.data);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  function openEditModal() {
    setEditName(user.name);
    setEditEmail(user.email);
    setImageFile(null);
    setImagePreview(`${SERVER_URL}/uploads/${user.image}`);
    setShowEditModal(true);
  }

  function closeEditModal() {
    if (editSaving) return;
    setShowEditModal(false);
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    setEditSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", editName);
      formData.append("email", editEmail);
      if (imageFile) {
        formData.append("images", imageFile);
      }

      const res = await fetch(`${SERVER_URL}/api/user/edit/${user.id}`, {
        method: "PATCH",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      console.log(data);
      if (data.status == "success") {
        setUser(data.data);
        setShowEditModal(false);
        window.toast(data.status, "Profile edited successfully");
      } else {
        window.toast(data.status, data.message);
      }
    } finally {
      setEditSaving(false);
    }
  }

  function openPasswordModal() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setShowPasswordModal(true);
  }

  function closePasswordModal() {
    if (passwordSaving) return;
    setShowPasswordModal(false);
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPasswordError("");

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/user/password`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Could not change password.");
      }

      setShowPasswordModal(false);
    } catch (err) {
      setPasswordError(err.message || "Something went wrong.");
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete your profile? This cannot be undone.",
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/user`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Could not delete profile.");
      window.location.href = "/";
    } catch (err) {
      alert(err.message || "Something went wrong.");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="profile-page profile-page--center">
        <p className="profile-status">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-page profile-page--center">
        <p className="profile-status">Profile not found.</p>
      </div>
    );
  }

  const joinedDate = new Date(user.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <Nav></Nav>
      <div className="profile-page">
        <div className="profile-card">
          <div className="profile-header">
            <img
              src={`${SERVER_URL}/uploads/${user.image}`}
              alt={user.name}
              className="profile-avatar"
            />
            <h1 className="profile-name">{user.name}</h1>
            <span className="profile-badge">{user.role}</span>
          </div>

          <div className="profile-details">
            <div className="profile-row">
              <span className="profile-label">Email</span>
              <span className="profile-value">{user.email}</span>
            </div>
            <div className="profile-row">
              <span className="profile-label">Member since</span>
              <span className="profile-value">{joinedDate}</span>
            </div>
            <div className="profile-row">
              <span className="profile-label">Role</span>
              <span className="profile-value">{user.role}</span>
            </div>
          </div>

          <div className="profile-actions">
            <button
              className="profile-btn profile-btn--primary"
              onClick={openEditModal}
            >
              Edit profile
            </button>
            <button
              className="profile-btn profile-btn--secondary"
              onClick={openPasswordModal}
            >
              Change password
            </button>
            <button
              className="profile-btn profile-btn--danger"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete profile"}
            </button>
          </div>
        </div>
      </div>

      {/* Edit profile overlay */}
      {showEditModal && (
        <div className="profile-overlay" onClick={closeEditModal}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h2>Edit profile</h2>
              <button
                className="profile-modal-close"
                onClick={closeEditModal}
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="profile-form">
              <div className="profile-form-avatar-wrap">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="profile-form-avatar"
                />
                <label
                  htmlFor="profile-image-input"
                  className="profile-form-avatar-btn"
                >
                  Change photo
                </label>
                <input
                  id="profile-image-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  hidden
                />
              </div>

              <label className="profile-form-field">
                <span>Username</span>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </label>

              <label className="profile-form-field">
                <span>Email</span>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                />
              </label>

              <div className="profile-form-actions">
                <button
                  type="button"
                  className="profile-btn profile-btn--secondary"
                  onClick={closeEditModal}
                  disabled={editSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="profile-btn profile-btn--primary"
                  disabled={editSaving}
                >
                  {editSaving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change password overlay */}
      {showPasswordModal && (
        <div className="profile-overlay" onClick={closePasswordModal}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h2>Change password</h2>
              <button
                className="profile-modal-close"
                onClick={closePasswordModal}
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="profile-form">
              <label className="profile-form-field">
                <span>Current password</span>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </label>

              <label className="profile-form-field">
                <span>New password</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </label>

              <label className="profile-form-field">
                <span>Confirm new password</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </label>

              {passwordError && (
                <p className="profile-form-error">{passwordError}</p>
              )}

              <div className="profile-form-actions">
                <button
                  type="button"
                  className="profile-btn profile-btn--secondary"
                  onClick={closePasswordModal}
                  disabled={passwordSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="profile-btn profile-btn--primary"
                  disabled={passwordSaving}
                >
                  {passwordSaving ? "Updating..." : "Update password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Follow></Follow>
      <Footer></Footer>
    </>
  );
}

export default Profile;
