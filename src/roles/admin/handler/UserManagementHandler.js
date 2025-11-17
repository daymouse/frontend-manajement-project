// src/pages/admin/UserManagement/UserManagementHandler.js
import { useState, useRef, useEffect } from "react";
import { apiFetch } from "./../../../Server";

export const useUserManagementHandler = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  // 🔽 dropdown & input state
  const [openRoleDropdown, setOpenRoleDropdown] = useState(false);
  const [openUserRoleDropdown, setOpenUserRoleDropdown] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [creatingRole, setCreatingRole] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // ➕ state untuk add user
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    confirm_password: "",
    full_name: "",
    email: "",
  });
  const [creatingUser, setCreatingUser] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  
  // 🗑️ state untuk delete user
  const [userToDelete, setUserToDelete] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);

  const token = localStorage.getItem("token");

  // === FETCH USERS ===
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/users/users", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // === FETCH ROLES ===
  const fetchRoles = async () => {
    try {
      const res = await apiFetch("/roles/role", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoles(res || []);
    } catch (err) {
      console.error("❌ Error fetchRoles:", err);
    }
  };

  // === CREATE ROLE ===
  const handleCreateRole = async () => {
    if (!newRole.trim()) return;
    setCreatingRole(true);
    try {
      const res = await apiFetch("/roles/role", {
        method: "POST",
        body: JSON.stringify({ NameRole: newRole }),
      });

      if (res.data) {
        setRoles((prev) => [...prev, ...res.data]);
        setNewRole("");
        setShowInput(false);
      }
    } catch (err) {
      console.error("❌ Error createRole:", err);
    } finally {
      setCreatingRole(false);
    }
  };

  // === UPDATE ROLE USER ===
  const handleUpdateRole = async (userId, roleId) => {
    try {
      await apiFetch(`/users/update-role/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ aturRole: roleId }),
      });
      
      // Update local state immediately tanpa refresh
      setUsers(prev => prev.map(user => 
        user.user_id === userId 
          ? { ...user, role_id: roleId }
          : user
      ));
      
      setOpenUserRoleDropdown(null);
    } catch (err) {
      console.error("❌ Error updateRole:", err);
      // Rollback jika error
      fetchUsers();
    }
  };

  // === DELETE USER ===
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setDeletingUser(true);
    try {
      await apiFetch(`/users/user/${userToDelete.user_id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Remove user from local state immediately
      setUsers(prev => prev.filter(user => user.user_id !== userToDelete.user_id));
      setUserToDelete(null);
      
      alert("✅ User berhasil dihapus");
    } catch (err) {
      console.error("❌ Error deleteUser:", err);
      alert("❌ Gagal menghapus user");
    } finally {
      setDeletingUser(false);
    }
  };

  const handleInlineEdit = async (userId, field, newValue) => {
    try {
      // update state dulu biar langsung terasa
      setUsers((prev) =>
        prev.map((u) => (u.user_id === userId ? { ...u, [field]: newValue } : u))
      );

      // kirim ke backend
      await apiFetch("/auth/update-user", {
        method: "PATCH",
        body: JSON.stringify({
          id: userId,
          [field]: newValue,
        }),
      });

      console.log(`User ${userId} berhasil diperbarui di kolom ${field}`);
    } catch (err) {
      console.error("Gagal update inline:", err);
      setError("Gagal memperbarui data user");
      // rollback kalau gagal
      fetchUsers();
    }
  };

  // === ADD USER ===
  const handleAddUser = async () => {
    const { username, password, confirm_password, full_name, email } = newUser;

    // Validasi sederhana di frontend
    if (!username || !password || !confirm_password || !full_name || !email) {
      alert("Semua field wajib diisi!");
      return;
    }

    if (password !== confirm_password) {
      alert("Konfirmasi password tidak cocok!");
      return;
    }

    setCreatingUser(true);

    try {
      const res = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username,
          password,
          full_name,
          email,
        }),
      });

      if (res?.data) {
        alert("✅ User berhasil ditambahkan");

        // Reset form input
        setNewUser({
          username: "",
          password: "",
          confirm_password: "",
          full_name: "",
          email: "",
        });

        setShowAddUserModal(false);
        fetchUsers(); // Refresh data user
      } else if (res?.error) {
        alert(`❌ Gagal: ${res.error}`);
      }
    } catch (err) {
      console.error("❌ Error addUser:", err);
      alert("Gagal menambahkan user.");
    } finally {
      setCreatingUser(false);
    }
  };

  // === OUTSIDE CLICK HANDLER (input tambah role) ===
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showInput && containerRef.current && !containerRef.current.contains(e.target)) {
        if (newRole.trim()) handleCreateRole();
        setShowInput(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showInput, newRole]);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  return {
    users,
    roles,
    loading,
    error,
    openRoleDropdown,
    setOpenRoleDropdown,
    openUserRoleDropdown,
    setOpenUserRoleDropdown,
    newRole,
    setNewRole,
    creatingRole,
    showInput,
    setShowInput,
    inputRef,
    containerRef,
    handleCreateRole,
    handleUpdateRole,
    handleInlineEdit,
    handleDeleteUser,
    
    // 🗑️ Delete user states
    userToDelete,
    setUserToDelete,
    deletingUser,

    // 🧩 Tambahan untuk Add User
    newUser,
    setNewUser,
    creatingUser,
    handleAddUser,
    showAddUserModal,
    setShowAddUserModal,
  };
};