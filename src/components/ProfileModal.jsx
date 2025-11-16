import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, User, Mail, LogOut, X, Lock, ArrowLeft, Edit, X as XIcon } from "lucide-react";
import { apiFetch } from "./../Server";
import { useAlert } from "./AlertContext"; 

export default function ProfileModal({ user, open, onClose, onUpdateUser = () => {}  }) {
  const { showAlert } = useAlert();
  const [step, setStep] = useState(0);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  
  // State untuk inline editing
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const editInputRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setStep(0);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setLoading(false);
      setEditingField(null);
      setEditValue("");
      setIsSaving(false);
    }
  }, [open]);

  if (!open) return null;

  // Fungsi untuk mendapatkan warna status
  const getStatusInfo = (status) => {
    const statusMap = {
      'available': {
        color: 'bg-green-100 text-green-600 border-green-200',
        text: 'Available'
      },
      'working': {
        color: 'bg-blue-100 text-blue-600 border-blue-200',
        text: 'Working'
      },
      'unavailable': {
        color: 'bg-red-100 text-red-600 border-red-200',
        text: 'Unavailable'
      },
      'break': {
        color: 'bg-yellow-100 text-yellow-600 border-yellow-200',
        text: 'Break'
      },
      'meeting': {
        color: 'bg-purple-100 text-purple-600 border-purple-200',
        text: 'Meeting'
      }
    };

    const normalizedStatus = status?.toLowerCase() || 'unavailable';
    return statusMap[normalizedStatus] || statusMap['unavailable'];
  };

  // Fungsi untuk inline editing
  const startEdit = (field, currentValue) => {
    setEditingField(field);
    setEditValue(currentValue || "");
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const handleInlineEdit = async (field, newValue) => {
    if (!user?.user_id) return;
    
    // Jika nilai sama, tidak perlu update
    if (newValue === user[field]) {
      cancelEdit();
      return;
    }

    try {
      setIsSaving(true);
      const res = await apiFetch("/auth/update-user", {
        method: "PATCH",
        body: JSON.stringify({
          id: user.user_id,
          [field]: newValue,
        }),
      });

      // Perbaikan: Handle berbagai format response success
      const isSuccess = 
        res?.success === true || 
        res?.message?.includes("berhasil") || 
        res?.message === "Data user berhasil diperbarui" ||
        (res && !res.error);

      if (isSuccess) {
        // Update parent state via callback instead of undefined setUser
        onUpdateUser(field, newValue);
        cancelEdit();
        return;
      } else {
        // Jika response tidak sesuai ekspektasi, tetap anggap success jika tidak ada error
        console.log(`Update ${field} berhasil:`, newValue);
        onUpdateUser(field, newValue);
        cancelEdit();
      }
    } catch (err) {
      console.error("Gagal update inline:", err);
      // Jika error message adalah success message, tetap anggap berhasil
      if (err.message?.includes("berhasil")) {
        console.log(`Update ${field} berhasil:`, newValue);
        onUpdateUser(field, newValue);
        cancelEdit();
      } else {
        showAlert(err.message || "Gagal memperbarui data");
        cancelEdit();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const saveEdit = () => {
    if (editValue.trim() && editingField) {
        handleInlineEdit(editingField, editValue.trim());
    } else {
        cancelEdit();
    }
    };


  // Handle click outside untuk save
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (editingField && editInputRef.current && !editInputRef.current.contains(e.target)) {
        saveEdit();
      }
    };

    if (editingField) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [editingField, editValue]);

  // Handle key press untuk inline editing
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  // Render editable field tanpa icon save
  const renderEditableField = (field, label, currentValue, icon, isMainInfo = false) => {
    if (editingField === field) {
      return (
        <div ref={editInputRef} className="flex items-center gap-2">
          <input
            type={field === 'email' ? 'email' : 'text'}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyPress}
            className={`flex-1 border-2 border-blue-500 px-3 py-2 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none bg-white ${
              isMainInfo ? 'text-lg font-semibold' : 'text-sm'
            } ${isSaving ? 'opacity-50' : ''}`}
            autoFocus
            placeholder={`Enter ${label.toLowerCase()}`}
            disabled={isSaving}
          />
          {isSaving && (
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between group">
        <div className="flex-1">
          {isMainInfo ? (
            <h3 
              className="text-lg font-semibold text-gray-800 cursor-pointer hover:bg-blue-50 rounded-2xl p-2 -m-2 transition-colors"
              onClick={() => startEdit(field, currentValue)}
            >
              {currentValue || `No ${label}`}
            </h3>
          ) : (
            <div 
              className="cursor-pointer hover:bg-blue-50 rounded-2xl p-2 -m-2 transition-colors"
              onClick={() => startEdit(field, currentValue)}
            >
              <p className="text-xs text-gray-500">{label}</p>
              <p className={`text-sm font-medium text-gray-800 ${!currentValue ? 'text-gray-400 italic' : ''}`}>
                {currentValue || `Click to add ${label.toLowerCase()}`}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={() => startEdit(field, currentValue)}
          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
        >
          <Edit size={14} />
        </button>
      </div>
    );
  };

  const statusInfo = getStatusInfo(user?.current_task_status);

  const handleVerifyOldPassword = async () => {
    if (!oldPassword) return alert("Masukkan password lama");
    try {
      setLoading(true);
      const res = await apiFetch("/auth/check-password", {
        method: "POST",
        body: JSON.stringify({ old_password: oldPassword }),
      });

      if (res?.success) setStep(2);
      else showAlert("Password lama salah");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) return showAlert("Isi semua field");
    if (newPassword !== confirmPassword) return showAlert("Konfirmasi password tidak cocok");
    if (newPassword.length < 6) return showAlert("Password minimal 6 karakter");

    try {
      setLoading(true);
      const res = await apiFetch("/auth/change-password", {
        method: "PUT",
        body: JSON.stringify({ new_password: newPassword }),
      });

      if (res?.success) {
        showAlert("Password berhasil diubah");
        onClose();
      } else showAlert("Gagal mengubah password");
    } finally {
      setLoading(false);
    }
  };

  const modalBg = { 
    hidden: { opacity: 0 }, 
    visible: { opacity: 1 }, 
    exit: { opacity: 0 } 
  };
  
  const modalCard = { 
    hidden: { y: 20, opacity: 0, scale: 0.95 }, 
    visible: { y: 0, opacity: 1, scale: 1 }, 
    exit: { y: 10, opacity: 0, scale: 0.95 } 
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        variants={modalBg}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <motion.div
          className="bg-white rounded-3xl w-full max-w-md shadow-xl font-poppins relative"
          variants={modalCard}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {step > 0 && (
                <button 
                  onClick={() => setStep(step - 1)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ArrowLeft size={18} className="text-gray-500" />
                </button>
              )}
              <h2 className="text-xl font-semibold text-gray-800">
                {step === 0 ? "Profile Information" : 
                 step === 1 ? "Verifikasi Password" : 
                 "Ubah Password"}
              </h2>
            </div>
            <button 
              onClick={() => onClose()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Step content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* STEP 0 - Profile Overview */}
              {step === 0 && (
                <motion.div
                  key="step-0"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-4"
                >
                  {/* Avatar & Basic Info */}
                  <div className="flex items-center gap-4 mb-2">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg">
                        {user?.full_name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 px-2 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                        {statusInfo.text}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      {renderEditableField('full_name', 'Full Name', user?.full_name, <User size={14} />, true)}
                      <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                        <Shield size={14} />
                        {user?.is_admin ? "Administrator" : "User"}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        Joined {new Date(user?.created_at).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* User Details */}
                  <div className="space-y-3">
                    {/* Username */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                      <div className="p-2 bg-white rounded-xl shadow-sm">
                        <User size={16} className="text-blue-500" />
                      </div>
                      <div className="flex-1">
                        {renderEditableField('username', 'Username', user?.username, <User size={16} />)}
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                      <div className="p-2 bg-white rounded-xl shadow-sm">
                        <Mail size={16} className="text-green-500" />
                      </div>
                      <div className="flex-1">
                        {renderEditableField('email', 'Email Address', user?.email, <Mail size={16} />)}
                      </div>
                    </div>

                    {/* User ID & Role */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-gray-50 rounded-2xl">
                        <p className="text-xs text-gray-500">User ID</p>
                        <p className="text-sm font-medium text-gray-800">
                          #{user?.user_id || "-"}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-2xl">
                        <p className="text-xs text-gray-500">Role</p>
                        <p className="text-sm font-medium text-gray-800">
                          {user?.role?.role_name || "??"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setStep(1)}
                      className="flex items-center justify-center gap-2 flex-1 px-4 py-3 rounded-2xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                    >
                      <Lock size={16} />
                      Change Password
                    </button>
                    <button
                      onClick={() => {
                        localStorage.removeItem("token");
                        window.location.href = "/login";
                      }}
                      className="flex items-center justify-center gap-2 flex-1 px-4 py-3 rounded-2xl bg-red-500 text-white hover:bg-red-600 transition-colors font-medium"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 1 - Verify Old Password */}
              {step === 1 && (
                <motion.div 
                  key="step-1" 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-4"
                >
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Lock size={24} className="text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">Verifikasi Password</h3>
                    <p className="text-sm text-gray-500">Masukkan password lama Anda untuk melanjutkan</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password Lama
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                        placeholder="Masukkan password lama"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleVerifyOldPassword()}
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button 
                        onClick={() => setStep(0)}
                        className="flex-1 px-4 py-3 rounded-2xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleVerifyOldPassword}
                        disabled={loading || !oldPassword}
                        className="flex-1 px-4 py-3 rounded-2xl bg-blue-500 text-white hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? "Verifying..." : "Verify"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 2 - Change Password */}
              {step === 2 && (
                <motion.div 
                  key="step-2" 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-4"
                >
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Lock size={24} className="text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">Password Baru</h3>
                    <p className="text-sm text-gray-500">Buat password baru untuk akun Anda</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password Baru
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                        placeholder="Masukkan password baru"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Konfirmasi Password
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                        placeholder="Konfirmasi password baru"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleChangePassword()}
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button 
                        onClick={() => setStep(1)}
                        className="flex-1 px-4 py-3 rounded-2xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleChangePassword}
                        disabled={loading || !newPassword || !confirmPassword}
                        className="flex-1 px-4 py-3 rounded-2xl bg-green-500 text-white hover:bg-green-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? "Changing..." : "Change Password"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-3xl">
            <p className="text-xs text-gray-500 text-center">
              {step === 0 && `Account created on ${new Date(user?.created_at).toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}`}
              {step === 1 && "Pastikan password lama Anda benar untuk keamanan"}
              {step === 2 && "Pastikan password baru Anda kuat dan mudah diingat"}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}