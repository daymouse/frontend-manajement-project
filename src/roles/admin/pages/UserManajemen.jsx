// src/pages/admin/UserManagement/UserManagement.jsx
import { Search, ChevronDown, Plus, X, Trash2, Edit } from "lucide-react";
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
    handleDeleteUser,
    userToDelete,
    setUserToDelete,
    deletingUser,
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
  const [isMobile, setIsMobile] = useState(false);
  const editInputRef = useRef(null);

  // 🔹 Detect mobile screen
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
            className={`w-full border-2 border-blue-500 p-1 md:p-2 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm md:text-base ${
              isUsername ? 'font-medium' : ''
            }`}
            autoFocus
          />
        </div>
      );
    }

    return (
      <div 
        className={`cursor-pointer hover:bg-blue-50 rounded-xl md:rounded-2xl p-1 md:p-2 transition-colors flex items-center gap-1 ${
          isUsername ? 'font-medium text-gray-800' : 'text-gray-600'
        } ${!currentValue ? 'text-gray-400 italic' : ''}`}
        onClick={() => startEdit(user.user_id, field, currentValue)}
      >
        <span className="truncate">{currentValue || "Klik untuk mengedit"}</span>
        <Edit size={14} className="text-gray-400 flex-shrink-0" />
      </div>
    );
  };

  // 🔹 Mobile User Card
  const MobileUserCard = ({ user }) => {
    const statusInfo = getStatusInfo(user.current_task_status);
    
    return (
      <div className="bg-gray-50 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all border border-gray-100">
        {/* Header dengan avatar dan actions */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                user.full_name || user.username || "User"
              )}&background=random`}
              alt={user.full_name}
              className="w-10 h-10 rounded-full flex-shrink-0"
            />
            <div>
              <div className="font-medium text-gray-800">
                {user.username || "No username"}
              </div>
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${statusInfo.color}`}>
                {statusInfo.text}
              </span>
            </div>
          </div>
          <button
            onClick={() => setUserToDelete(user)}
            className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
            title="Delete user"
          >
            <Trash2 size={18} />
          </button>
        </div>

        {/* User Details */}
        <div className="space-y-2 text-sm">
          <div>
            <label className="text-gray-500 text-xs">Full Name</label>
            {renderEditableField(user, 'full_name')}
          </div>
          <div>
            <label className="text-gray-500 text-xs">Email</label>
            {renderEditableField(user, 'email')}
          </div>
          <div>
            <label className="text-gray-500 text-xs">Role</label>
            <div className="relative">
              {!user.role_id ? (
                <button
                  onClick={() => setOpenUserRoleDropdown(user.user_id)}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                >
                  <Plus size={14} /> Add Role
                </button>
              ) : (
                <button
                  onClick={() =>
                    setOpenUserRoleDropdown(
                      openUserRoleDropdown === user.user_id ? null : user.user_id
                    )
                  }
                  className="px-3 py-1 text-sm border border-gray-300 rounded-xl bg-white hover:bg-gray-50 transition-colors w-full text-left"
                >
                  {roles.find((r) => r.role_id === user.role_id)?.role_name || "—"}
                </button>
              )}
              {openUserRoleDropdown === user.user_id && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg">
                  <ul className="max-h-48 overflow-y-auto">
                    {roles.map((r) => (
                      <li
                        key={r.role_id}
                        onClick={() => handleUpdateRole(user.user_id, r.role_id)}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer transition-colors"
                      >
                        {r.role_name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 🔹 Desktop User Row
  const DesktopUserRow = ({ user, idx }) => {
    const statusInfo = getStatusInfo(user.current_task_status);
    
    return (
      <div className="grid grid-cols-12 items-center bg-gray-50 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all border border-gray-100">
        {/* 👤 Username dengan inline edit */}
        <div className="col-span-3 flex items-center gap-3">
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
              user.full_name || user.username || "User"
            )}&background=random`}
            alt={user.full_name}
            className="w-10 h-10 rounded-full flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            {renderEditableField(user, 'username', true)}
          </div>
        </div>

        {/* 👤 FullName dengan inline edit */}
        <div className="col-span-2">
          {renderEditableField(user, 'full_name')}
        </div>

        {/* 📧 Email dengan inline edit */}
        <div className="col-span-3">
          {renderEditableField(user, 'email')}
        </div>

        {/* 👥 Role */}
        <div className="col-span-2 relative">
          {!user.role_id ? (
            <button
              onClick={() => setOpenUserRoleDropdown(user.user_id)}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-500 text-white rounded-2xl hover:bg-blue-600 transition-colors"
            >
              <Plus size={14} /> Add Role
            </button>
          ) : (
            <button
              onClick={() =>
                setOpenUserRoleDropdown(
                  openUserRoleDropdown === user.user_id ? null : user.user_id
                )
              }
              className="px-3 py-1 text-sm border border-gray-300 rounded-2xl bg-white hover:bg-gray-50 transition-colors"
            >
              {roles.find((r) => r.role_id === user.role_id)?.role_name || "—"}
            </button>
          )}
          {openUserRoleDropdown === user.user_id && (
            <div className="absolute z-50 mt-1 w-40 bg-white border border-gray-200 rounded-2xl shadow-lg">
              <ul className="max-h-48 overflow-y-auto">
                {roles.map((r) => (
                  <li
                    key={r.role_id}
                    onClick={() => handleUpdateRole(user.user_id, r.role_id)}
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
        <div className="col-span-1">
          <span
            className={`px-3 py-1 text-xs rounded-full font-medium ${statusInfo.color}`}
          >
            {statusInfo.text}
          </span>
        </div>

        {/* 🗑️ Delete Button */}
        <div className="col-span-1 flex justify-center">
          <button
            onClick={() => setUserToDelete(user)}
            className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
            title="Delete user"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 font-poppins bg-white rounded-2xl md:rounded-4xl relative">
      {/* 🔍 Search + Sort + Filter bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-4">
        <div className="relative w-full md:w-1/3">
          <input
            type="text"
            placeholder="Search anything"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-2xl md:rounded-3xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm md:text-base"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-between">
          {/* 🆕 Add User Button */}
          <button 
            onClick={() => setShowAddUserModal(true)}
            className="flex items-center gap-1 px-3 md:px-4 py-2 rounded-2xl md:rounded-3xl border border-gray-300 bg-white hover:bg-gray-50 transition-colors text-sm md:text-base flex-1 md:flex-none justify-center"
          >
            <Plus size={16} />
            <span className="hidden md:inline">Add User</span>
            <span className="md:hidden">Add</span>
          </button>

          {/* 🔽 Role Dropdown */}
          <div className="relative flex-1 md:flex-none">
            <button
              onClick={() => setOpenRoleDropdown((prev) => !prev)}
              className="flex items-center gap-1 px-3 md:px-4 py-2 rounded-2xl md:rounded-3xl border border-gray-300 bg-white hover:bg-gray-50 transition-colors w-full text-sm md:text-base justify-center"
            >
              <span className="hidden md:inline">Role</span>
              <span className="md:hidden">Roles</span>
              <ChevronDown size={16} />
            </button>

            {openRoleDropdown && (
              <div className="absolute right-0 mt-2 w-48 md:w-56 bg-white border border-gray-200 rounded-xl md:rounded-2xl shadow-lg z-50">
                <ul className="max-h-48 overflow-y-auto">
                  {roles.map((r) => (
                    <li
                      key={r.role_id}
                      className="px-3 md:px-4 py-2 hover:bg-gray-100 cursor-pointer transition-colors text-sm md:text-base"
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
                      className="flex-1 border border-gray-300 rounded-xl md:rounded-2xl px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
        <div className="bg-red-50 border border-red-200 rounded-xl md:rounded-2xl p-4 mb-4">
          <p className="text-red-600">⚠️ {error}</p>
        </div>
      )}
      {!loading && filteredUsers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? "Tidak ada user yang cocok dengan pencarian" : "Tidak ada user."}
        </div>
      )}

      {/* 📋 Desktop Header row */}
      {!loading && filteredUsers.length > 0 && !isMobile && (
        <div className="grid grid-cols-12 text-sm font-semibold text-gray-600 px-4 py-2 bg-gray-50 rounded-2xl mb-2 hidden md:grid">
          <div className="col-span-3">UserName</div>
          <div className="col-span-2">FullName</div>
          <div className="col-span-3">Email</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1">Action</div>
        </div>
      )}

      {/* 🧑‍💻 User Rows */}
      <div className="space-y-3">
        {filteredUsers.map((u, idx) => 
          isMobile ? (
            <MobileUserCard key={u.user_id || idx} user={u} />
          ) : (
            <DesktopUserRow key={u.user_id || idx} user={u} idx={idx} />
          )
        )}
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
          <div className="bg-white rounded-2xl md:rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl md:rounded-t-3xl">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800">Add New User</h2>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Form */}
            <div className="p-4 md:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  className="w-full px-3 md:px-4 py-2 rounded-xl md:rounded-2xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm md:text-base"
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
                  className="w-full px-3 md:px-4 py-2 rounded-xl md:rounded-2xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm md:text-base"
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
                  className="w-full px-3 md:px-4 py-2 rounded-xl md:rounded-2xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm md:text-base"
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
                  className="w-full px-3 md:px-4 py-2 rounded-xl md:rounded-2xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm md:text-base"
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
                  className="w-full px-3 md:px-4 py-2 rounded-xl md:rounded-2xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm md:text-base"
                  placeholder="Confirm password"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-4 md:p-6 border-t border-gray-200 sticky bottom-0 bg-white rounded-b-2xl md:rounded-b-3xl">
              <button
                onClick={() => setShowAddUserModal(false)}
                className="flex-1 px-4 py-2 rounded-xl md:rounded-2xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors text-sm md:text-base"
                disabled={creatingUser}
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                disabled={creatingUser}
                className="flex-1 px-4 py-2 rounded-xl md:rounded-2xl bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
              >
                {creatingUser ? "Adding..." : "Add User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🗑️ Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl md:rounded-3xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                Delete User
              </h3>
              <p className="text-gray-600 mb-6">
                anda yakin ingin hapus  <strong>{userToDelete.username}</strong>? 
                Tindakan ini tidak dapat dibatalkan.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setUserToDelete(null)}
                  className="flex-1 px-4 py-2 rounded-xl md:rounded-2xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={deletingUser}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={deletingUser}
                  className="flex-1 px-4 py-2 rounded-xl md:rounded-2xl bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingUser ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}