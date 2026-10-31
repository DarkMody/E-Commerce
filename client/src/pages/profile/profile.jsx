import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Nav from "../../components/nav/nav";
import Follow from "../../components/follow/follow";
import Footer from "../../components/footer/footer";
import Button from "../../components/button/button";
import Input from "../../components/input/input";
import Modal from "../../components/modal/modal";
import { Skeleton } from "../../components/loading";
import { SERVER_URL } from "../../config";
import "./profile.css";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/* ---------- Edit profile dialog ---------- */
function EditProfileModal({ user, onClose, onSaved }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(`${SERVER_URL}/uploads/${user.image}`);
  const [touched, setTouched] = useState({});
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const blobUrlRef = useRef(null);
  useEffect(
    () => () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    },
    [],
  );

  const errors = {};
  if (!name.trim()) errors.name = "Enter your username";
  if (!EMAIL_REGEX.test(email.trim()))
    errors.email = "Enter a valid email address";

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      window.toast("invalid", "Please choose an image file");
      return;
    }
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    blobUrlRef.current = URL.createObjectURL(file);
    setImageFile(file);
    setPreview(blobUrlRef.current);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setTouched({ name: true, email: true });
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("email", email.trim());
      if (imageFile) formData.append("image", imageFile);

      const res = await fetch(`${SERVER_URL}/api/user/edit/${user.id}`, {
        method: "PATCH",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (data.status === "success") {
        onSaved(data.data);
        window.toast(data.status, "Profile edited successfully");
      } else {
        window.toast(data.status, data.message);
      }
    } catch {
      window.toast("error", "Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Edit profile"
      onClose={onClose}
      closeDisabled={saving}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="edit-profile-form" loading={saving}>
            Save changes
          </Button>
        </>
      }
    >
      <form
        id="edit-profile-form"
        className="d-flex flex-column gap-4"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="d-flex flex-column align-items-center gap-2">
          <img
            src={preview}
            alt="Profile preview"
            className="profile-form-avatar"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current.click()}
            disabled={saving}
          >
            Change photo
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleImageChange}
          />
        </div>

        <Input
          label="Username"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, name: true }))}
          error={touched.name ? errors.name : undefined}
          required
          disabled={saving}
        />
        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          error={touched.email ? errors.email : undefined}
          required
          disabled={saving}
        />
      </form>
    </Modal>
  );
}

/* ---------- Change password dialog ---------- */
function PasswordModal({ onClose }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touched, setTouched] = useState({});
  const [saving, setSaving] = useState(false);

  const errors = {};
  if (!currentPassword) errors.current = "Enter your current password";
  if (newPassword.length < 5)
    errors.new = "New password must be at least 5 characters";
  if (confirmPassword !== newPassword)
    errors.confirm = "New passwords do not match";

  const touch = (field) => () => setTouched((t) => ({ ...t, [field]: true }));

  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    if (saving) return;
    setTouched({ current: true, new: true, confirm: true });
    if (Object.keys(errors).length > 0) {
      window.toast("error", Object.values(errors)[0]);
      return;
    }

    setSaving(true);
    try {
      // ===================== BACKEND CONNECTION =====================
      // PATCH /api/user/password { currentPassword, newPassword } returns { status, message }
      const res = await fetch(`${SERVER_URL}/api/user/password`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      // ===============================================================

      if (data.status === "success") onClose();
      window.toast(data.status, data.message);
    } catch {
      window.toast("error", "Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Change password"
      onClose={onClose}
      closeDisabled={saving}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="change-password-form" loading={saving}>
            Update password
          </Button>
        </>
      }
    >
      <form
        id="change-password-form"
        className="d-flex flex-column gap-4"
        onSubmit={handleSubmitPassword}
        noValidate
      >
        <Input
          label="Current password"
          type="password"
          name="currentPassword"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          onBlur={touch("current")}
          error={touched.current ? errors.current : undefined}
          required
          disabled={saving}
        />
        <Input
          label="New password"
          type="password"
          name="newPassword"
          autoComplete="new-password"
          helperText="At least 5 characters"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          onBlur={touch("new")}
          error={touched.new ? errors.new : undefined}
          required
          disabled={saving}
        />
        <Input
          label="Confirm new password"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onBlur={touch("confirm")}
          error={touched.confirm ? errors.confirm : undefined}
          required
          disabled={saving}
        />
      </form>
    </Modal>
  );
}

/* ---------- Delete profile confirmation ---------- */
function DeleteModal({ user, onClose }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      // ===================== BACKEND CONNECTION =====================
      // DELETE /api/user/delete/:id returns { status, message }
      const res = await fetch(`${SERVER_URL}/api/user/delete/${user.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      // ===============================================================

      window.toast(data.status, data.message);
      if (data.status === "success") {
        window.location.href = "/"; // full reload so the app forgets the old session
        return;
      }
    } catch {
      window.toast("error", "Network error. Please try again.");
    }
    setDeleting(false);
  };

  return (
    <Modal
      title="Delete profile"
      onClose={onClose}
      closeDisabled={deleting}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting}>
            Delete profile
          </Button>
        </>
      }
    >
      <p className="mb-0">
        Are you sure you want to delete your profile? This cannot be undone.
      </p>
    </Modal>
  );
}

/* ---------- Loading skeleton ---------- */
function ProfileSkeleton() {
  return (
    <div className="profile-card mx-auto" role="status" aria-busy="true">
      <span className="visually-hidden">Loading profile…</span>
      <div className="d-flex flex-column align-items-center gap-3">
        <Skeleton circle width="112px" height="112px" />
        <Skeleton width="180px" height="1.6rem" />
        <Skeleton width="90px" height="1.6rem" rounded="999px" />
      </div>
      <div className="mt-4 d-flex flex-column gap-4">
        <Skeleton height="1.2rem" />
        <Skeleton height="1.2rem" />
        <Skeleton height="1.2rem" />
      </div>
    </div>
  );
}

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | "edit" | "password" | "delete"

  useEffect(() => {
    let cancelled = false;
    const fetchUser = async () => {
      try {
        // GET /api/user returns { data: { id, name, email, image, role, created_at } }
        const res = await fetch(`${SERVER_URL}/api/user`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!cancelled) setUser(data.data || null);
      } catch {
        if (!cancelled) window.toast("error", "Could not load your profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchUser();
    return () => {
      cancelled = true;
    };
  }, []);

  const closeModal = () => setModal(null);

  const handleSaved = (updatedUser) => {
    setUser(updatedUser);
    closeModal();
  };

  let content;
  if (loading) {
    content = <ProfileSkeleton />;
  } else if (!user) {
    content = (
      <div className="profile-card mx-auto text-center">
        <h1 className="h4 fw-bold mb-2">Profile not found</h1>
        <p className="text-secondary mb-4">Log in to see your profile.</p>
        <Button onClick={() => navigate("/login")}>Log in</Button>
      </div>
    );
  } else {
    const joinedDate = new Date(user.created_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    content = (
      <section className="profile-card mx-auto">
        <header className="d-flex flex-column align-items-center text-center">
          <img
            src={`${SERVER_URL}/uploads/${user.image}`}
            alt=""
            className="profile-avatar"
          />
          <h1 className="profile-name">{user.name}</h1>
          <span className="profile-badge">{user.role}</span>
        </header>

        <dl className="profile-details">
          <div className="profile-row">
            <dt>Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div className="profile-row">
            <dt>Member since</dt>
            <dd>{joinedDate}</dd>
          </div>
          <div className="profile-row">
            <dt>Role</dt>
            <dd className="text-capitalize">{user.role}</dd>
          </div>
        </dl>

        <div className="profile-actions">
          <Button onClick={() => setModal("edit")}>Edit profile</Button>
          <Button variant="outline" onClick={() => setModal("password")}>
            Change password
          </Button>
          <Button
            variant="outline"
            className="profile-delete"
            onClick={() => setModal("delete")}
          >
            Delete profile
          </Button>
        </div>
      </section>
    );
  }

  return (
    <>
      <Nav />
      <main className="profile-page container py-4 py-lg-5">{content}</main>

      {user && modal === "edit" && (
        <EditProfileModal
          user={user}
          onClose={closeModal}
          onSaved={handleSaved}
        />
      )}
      {modal === "password" && <PasswordModal onClose={closeModal} />}
      {user && modal === "delete" && (
        <DeleteModal user={user} onClose={closeModal} />
      )}

      <Follow />
      <Footer />
    </>
  );
}

export default Profile;
