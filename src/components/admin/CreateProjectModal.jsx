import { useState, useMemo } from "react";
import { X, Search, UserCog, MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "../../Server";

export default function CreateProjectModal({ onClose, fetchProjects, users }) {
  const [form, setForm] = useState({
    project_name: "",
    description: "",
    deadline: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [openMenu, setOpenMenu] = useState(null); // untuk dropdown tiap user

  // 🔍 Filter user berdasarkan pencarian & hindari duplikat
  const filteredUsers = useMemo(() => {
    const list = users.filter(
      (u) =>
        u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !members.some((mem) => mem.user_id === u.user_id)
    );
    if (isFocused && searchTerm.trim() === "") {
      return users.filter(
        (u) => !members.some((mem) => mem.user_id === u.user_id)
      );
    }
    return list;
  }, [users, searchTerm, members, isFocused]);

  // 🧩 Input handler
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ➕ Tambahkan user ke local state
  const handleAddUser = (user) => {
    if (members.some((m) => m.user_id === user.user_id)) return;
    setMembers((prev) => [...prev, { ...user, role: "member" }]);
  };

  // 🔄 Ubah role user
  const updateRole = (user_id, newRole) => {
    setMembers((prev) =>
      prev.map((m) => (m.user_id === user_id ? { ...m, role: newRole } : m))
    );
    setOpenMenu(null);
  };

  // ❌ Hapus user
  const removeUser = (user_id) => {
    setMembers((prev) => prev.filter((m) => m.user_id !== user_id));
    setOpenMenu(null);
  };

  // 🚀 Submit project ke backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const payload = { ...form, members };

    try {
      await apiFetch("/project/projects", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      fetchProjects();
      onClose();
    } catch (err) {
      console.error("❌ Error handleSubmit:", err);
      setErrorMsg("Gagal membuat project. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 200 }}
          className="bg-white w-full max-w-6xl p-6 sm:p-8 rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto border border-gray-100"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-5 border-b pb-3 flex-wrap gap-2">
            <h2 className="font-semibold text-xl text-gray-800 flex items-center gap-2">
              <UserCog size={20} /> Create New Project
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition"
            >
              <X size={22} />
            </button>
          </div>

          {errorMsg && (
            <div className="bg-red-100 text-red-600 px-3 py-2 rounded-lg mb-3 text-sm">
              {errorMsg}
            </div>
          )}

          {/* Grid Layout Responsif */}
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8"
          >
            {/* === KIRI: DATA PROJECT === */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="project_name"
                  value={form.project_name}
                  onChange={handleChange}
                  placeholder="e.g., Website Redesign"
                  className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Brief project details..."
                  className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deadline
                </label>
                <input
                  type="date"
                  name="deadline"
                  value={form.deadline}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>
            </div>

            {/* === KANAN: USER PROJECT MEMBER === */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Add Users (Admin or Member)
              </label>

              {/* Search Input */}
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
                />
                <input
                  type="text"
                  placeholder="Search user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setTimeout(() => setIsFocused(false), 150)}
                  className="w-full border border-gray-300 rounded-xl pl-9 p-2.5 
                            focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />

                {isFocused && (
                  <div className="absolute top-full left-0 w-full mt-1 z-10 border border-gray-200 rounded-xl max-h-40 overflow-y-auto shadow-sm bg-white">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((u) => (
                        <div
                          key={u.user_id}
                          onMouseDown={() => {
                            handleAddUser(u);
                            setSearchTerm("");
                            setIsFocused(false);
                          }}
                          className="p-2 cursor-pointer hover:bg-blue-50 transition"
                        >
                          {u.full_name}
                        </div>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-gray-500 text-center">
                        No user found
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Member List */}
              {members.length > 0 && (
                <div className="border-t pt-3 mt-3 space-y-2">
                  {members.map((m) => (
                    <div
                      key={m.user_id}
                      className="flex items-start justify-between bg-gray-50 border rounded-xl p-3 relative"
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-800">
                          {m.full_name}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Role: {m.role}
                        </div>
                      </div>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenu(openMenu === m.user_id ? null : m.user_id)
                          }
                          className="text-gray-500 hover:text-gray-700 p-1"
                        >
                          <MoreVertical size={18} />
                        </button>

                        <AnimatePresence>
                          {openMenu === m.user_id && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              className="absolute right-0 mt-2 w-32 bg-white border rounded-md shadow-lg text-sm z-20"
                            >
                              <button
                                type="button"
                                onClick={() => updateRole(m.user_id, "admin")}
                                className="block w-full text-left px-3 py-2 hover:bg-gray-100"
                              >
                                Set as Admin
                              </button>
                              <button
                                type="button"
                                onClick={() => updateRole(m.user_id, "member")}
                                className="block w-full text-left px-3 py-2 hover:bg-gray-100"
                              >
                                Set as Member
                              </button>
                              <button
                                type="button"
                                onClick={() => removeUser(m.user_id)}
                                className="block w-full text-left px-3 py-2 text-red-500 hover:bg-gray-100"
                              >
                                Remove
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="md:col-span-2 pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2.5 rounded-xl text-white font-medium transition ${
                  loading
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading ? "Creating..." : "Create Project"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
