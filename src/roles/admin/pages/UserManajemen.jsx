// src/pages/admin/UserManagement/UserManagement.jsx
import { Search, ChevronDown, Plus, X } from "lucide-react";
import { useUserManagementHandler } from "../handler/UserManagementHandler";
import { useState, useRef, useEffect, useMemo } from "react";

export default function UserManagement() {
  const {
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
    // Add User modal states
    newUser,
    setNewUser,
    creatingUser,
    handleAddUser,
    showAddUserModal,
    setShowAddUserModal,
  } = useUserManagementHandler();

  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editingUserId, setEditingUserId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const editInputRef = useRef(null);

  // 🔹 Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    
    const lowercasedSearch = searchTerm.toLowerCase();
    return users.filter(user => 
      user.username?.toLowerCase().includes(lowercasedSearch) ||
      user.full_name?.toLowerCase().includes(lowercasedSearch) ||
      user.email?.toLowerCase().includes(lowercasedSearch) ||
      roles.find(r => r.role_id === user.role_id)?.role_name?.toLowerCase().includes(lowercasedSearch) ||
      user.current_task_status?.toLowerCase().includes(lowercasedSearch)
    );
  }, [users, searchTerm, roles]);

  // 🔹 Get status color and display text
  const getStatusInfo = (status) => {
    const statusMap = {
      'available': {
        color: 'bg-green-100 text-green-600',
        text: 'Available'
      },
      'working': {
        color: 'bg-blue-100 text-blue-600',
        text: 'Working'
      },
      'unavailable': {
        color: 'bg-red-100 text-red-600',
        text: 'Unavailable'
      },
      'break': {
        color: 'bg-yellow-100 text-yellow-600',
        text: 'Break'
      },
      'meeting': {
        color: 'bg-purple-100 text-purple-600',
        text: 'Meeting'
      }
    };

    const normalizedStatus = status?.toLowerCase() || 'unavailable';
    return statusMap[normalizedStatus] || statusMap['unavailable'];
  };

  // 🔹 Inline editing handlers
  const startEdit = (userId, field, currentValue) => {
    setEditingUserId(userId);
    setEditingField(field);
    setEditValue(currentValue || "");
  };

  const saveEdit = async () => {
    if (!editingUserId || !editingField) return;

    try {
      await handleInlineEdit(editingUserId, editingField, editValue);
      cancelEdit();
    } catch (err) {
      console.error("Gagal menyimpan edit:", err);
    }
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setEditingField(null);
    setEditValue("");
  };

  // 🔹 Handle click outside to save
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (editingField && editInputRef.current && !editInputRef.current.contains(e.target)) {
        if (editValue !== (users.find(u => u.user_id === editingUserId)?.[editingField] || "")) {
          saveEdit();
        } else {
          cancelEdit();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingField, editValue, editingUserId, users]);

  // 🔹 Handle key press for inline editing
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  // 🔹 Render editable field
  const renderEditableField = (user, field, isUsername = false) => {
    const currentValue = user[field] || "";
    
    if (editingUserId === user.user_id && editingField === field) {
      return (
        <div ref={editInputRef} className="editing-field">
          <input
            type={field === 'email' ? 'email' : 'text'}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyPress}
            className={`w-full border-2 border-blue-500 p-2 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none bg-white ${
              isUsername ? 'font-medium' : ''
            }`}
            autoFocus
          />
        </div>
      );
    }

    return (
      <div 
        className={`cursor-pointer hover:bg-blue-50 rounded-2xl p-2 transition-colors ${
          isUsername ? 'font-medium text-gray-800' : 'text-gray-600'
        } ${!currentValue ? 'text-gray-400 italic' : ''}`}
        onClick={() => startEdit(user.user_id, field, currentValue)}
      >
        {currentValue || "Klik untuk mengedit"}
      </div>
    );
  };

  return (
    <div className="p-6 font-poppins bg-white rounded-4xl relative">
      {/* 🔍 Search + Sort + Filter bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-4">
        <div className="relative w-full md:w-1/3">
          <input
            type="text"
            placeholder="Search anything"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-3xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>

        <div className="flex items-center gap-2 relative">
          {/* 🆕 Add User Button */}
          <button 
            onClick={() => setShowAddUserModal(true)}
            className="flex items-center gap-1 px-4 py-2 rounded-3xl border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
          >
            <Plus size={16} />
            Add User
          </button>

          {/* 🔽 Role Dropdown */}
          <div className="relative">
            <button
              onClick={() => setOpenRoleDropdown((prev) => !prev)}
              className="flex items-center gap-1 px-4 py-2 rounded-3xl border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
            >
              Role <ChevronDown size={16} />
            </button>

            {openRoleDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-lg z-50">
                <ul className="max-h-48 overflow-y-auto">
                  {roles.map((r) => (
                    <li
                      key={r.role_id}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      {r.role_name}
                    </li>
                  ))}
                </ul>
                {/* ➕ Tambah role baru */}
                <div
                  ref={containerRef}
                  className="border-t p-2 flex gap-2 justify-center items-center"
                >
                  {!showInput ? (
                    <button
                      onClick={() => {
                        setShowInput(true);
                        setTimeout(() => inputRef.current?.focus(), 50);
                      }}
                      className="px-2 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                      +
                    </button>
                  ) : (
                    <input
                      ref={inputRef}
                      type="text"
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newRole.trim()) {
                          handleCreateRole();
                        } else if (e.key === 'Escape') {
                          setShowInput(false);
                          setNewRole("");
                        }
                      }}
                      placeholder="Tambah role baru"
                      className="flex-1 border border-gray-300 rounded-2xl px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      disabled={creatingRole}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* STATUS */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
          <p className="text-red-600">⚠️ {error}</p>
        </div>
      )}
      {!loading && filteredUsers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? "Tidak ada user yang cocok dengan pencarian" : "Tidak ada user."}
        </div>
      )}

      {/* 📋 Header row */}
      {!loading && filteredUsers.length > 0 && (
        <div className="grid grid-cols-12 text-sm font-semibold text-gray-600 px-4 py-2 bg-gray-50 rounded-2xl mb-2">
          <div className="col-span-3">UserName</div>
          <div className="col-span-2">FullName</div>
          <div className="col-span-3">Email</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-2">Availability Status</div>
        </div>
      )}

      {/* 🧑‍💻 User Rows */}
      <div className="space-y-3">
        {filteredUsers.map((u, idx) => {
          const statusInfo = getStatusInfo(u.current_task_status);
          
          return (
            <div
              key={u.user_id || idx}
              className="grid grid-cols-12 items-center bg-gray-50 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all border border-gray-100"
            >
              {/* 👤 Username dengan inline edit */}
              <div className="col-span-3 flex items-center gap-3">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                    u.full_name || u.username || "User"
                  )}&background=random`}
                  alt={u.full_name}
                  className="w-10 h-10 rounded-full flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  {renderEditableField(u, 'username', true)}
                </div>
              </div>

              {/* 👤 FullName dengan inline edit */}
              <div className="col-span-2">
                {renderEditableField(u, 'full_name')}
              </div>

              {/* 📧 Email dengan inline edit */}
              <div className="col-span-3">
                {renderEditableField(u, 'email')}
              </div>

              {/* 👥 Role */}
              <div className="col-span-2 relative">
                {!u.role_id ? (
                  <button
                    onClick={() => setOpenUserRoleDropdown(u.user_id)}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-500 text-white rounded-2xl hover:bg-blue-600 transition-colors"
                  >
                    <Plus size={14} /> Add Role
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      setOpenUserRoleDropdown(
                        openUserRoleDropdown === u.user_id ? null : u.user_id
                      )
                    }
                    className="px-3 py-1 text-sm border border-gray-300 rounded-2xl bg-white hover:bg-gray-50 transition-colors"
                  >
                    {roles.find((r) => r.role_id === u.role_id)?.role_name || "—"}
                  </button>
                )}
                {openUserRoleDropdown === u.user_id && (
                  <div className="absolute z-50 mt-1 w-40 bg-white border border-gray-200 rounded-2xl shadow-lg">
                    <ul className="max-h-48 overflow-y-auto">
                      {roles.map((r) => (
                        <li
                          key={r.role_id}
                          onClick={() => handleUpdateRole(u.user_id, r.role_id)}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer transition-colors"
                        >
                          {r.role_name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* 🟢🔵🔴🟡 Availability Status */}
              <div className="col-span-2">
                <span
                  className={`px-3 py-1 text-xs rounded-full font-medium ${statusInfo.color}`}
                >
                  {statusInfo.text}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search result info */}
      {searchTerm && !loading && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Menampilkan {filteredUsers.length} dari {users.length} user
          {searchTerm && ` untuk pencarian "${searchTerm}"`}
        </div>
      )}

      {/* 🆕 Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Add New User</h2>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  className="w-full px-4 py-2 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Enter username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                  className="w-full px-4 py-2 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full px-4 py-2 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full px-4 py-2 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Enter password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  value={newUser.confirm_password}
                  onChange={(e) => setNewUser({...newUser, confirm_password: e.target.value})}
                  className="w-full px-4 py-2 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Confirm password"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowAddUserModal(false)}
                className="flex-1 px-4 py-2 rounded-2xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={creatingUser}
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                disabled={creatingUser}
                className="flex-1 px-4 py-2 rounded-2xl bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingUser ? "Adding..." : "Add User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}