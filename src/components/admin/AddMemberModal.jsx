import { useState } from "react";
import { Search, X } from "lucide-react";

export default function AddMemberModal({
  isDesktop = false,
  users = [],
  onAdd,
  onDragStart,
  onClose,
}) {
  const [search, setSearch] = useState("");

  const filteredUsers = users.filter((u) =>
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (isDesktop) {
    // 💻 Desktop Sidebar Mode (30%)
    return (
      <div className="w-[30%] bg-gray-50 border rounded-2xl p-4 shadow-sm">
        <h2 className="font-semibold mb-3 text-lg">Semua User</h2>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Cari user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* List */}
        <div className="h-[70vh] overflow-y-auto space-y-2">
          {filteredUsers.length === 0 ? (
            <p className="text-gray-500 text-sm">Tidak ada user ditemukan.</p>
          ) : (
            filteredUsers.map((u) => (
              <div
                key={u.user_id}
                draggable
                onDragStart={(e) => onDragStart(e, u.user_id)}
                className="p-2 bg-white border rounded-lg shadow-sm cursor-move hover:bg-purple-50 transition"
                title="Tarik ke kiri untuk menambah"
              >
                {u.full_name} | {u.roles_user?.role_name}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // 📱 Mobile Modal
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white w-[90%] max-h-[80vh] rounded-2xl shadow-lg p-4 overflow-y-auto relative">
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <h2 className="font-semibold text-lg mb-3">Tambah Member</h2>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Cari user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* List */}
        <div className="space-y-2">
          {filteredUsers.map((u) => (
            <div
              key={u.user_id}
              onClick={() => onAdd(u.user_id)}
              className="p-2 bg-gray-50 border rounded-lg shadow-sm hover:bg-green-100 cursor-pointer transition"
            >
              {u.full_name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
