// components/CardModal/MemberModal.jsx
import { X, Search } from "lucide-react";

export default function MemberModal({
  title,
  users,
  searchTerm,
  setSearchTerm,
  handleSelectUser,
  onClose
}) {
  const filtered = users.filter((u) =>
    (u.full_name || u.username).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-[999]">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h3 className="font-bold">{title}</h3>
          <button onClick={onClose} className="hover:bg-gray-100 p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-3 border-b">
          <div className="flex items-center gap-2 bg-gray-50 border rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm"
              placeholder="Search member..."
            />
          </div>
        </div>

        <div className="p-4 max-h-80 overflow-y-auto space-y-2">
          {filtered.length > 0 ? filtered.map((u) => (
            <div
              key={u.user_id}
              onClick={() => { handleSelectUser(u); onClose(); }}
              className="flex items-center gap-3 p-2 rounded-xl cursor-pointer hover:bg-violet-50 border hover:border-violet-200"
            >
              <div className="w-8 h-8 rounded-full bg-violet-500 text-white flex items-center justify-center">
                {(u.full_name || u.username).charAt(0)}
              </div>
              <span>{u.full_name || u.username}</span>
            </div>
          )) : (
            <p className="text-gray-400 text-sm text-center py-6">
              No members found
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
