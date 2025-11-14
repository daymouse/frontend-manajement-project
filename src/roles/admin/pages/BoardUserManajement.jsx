import { useParams } from "react-router-dom";
import { Trash2, Users, UserPlus } from "lucide-react";
import NavbarBoard from "../../../../components/BoardNavbar";
import AddMemberModal from "../../../../components/admin/AddMemberModal";
import BoardUserManagement from "../BoardUserManagement";

export default function UserManagement() {
  const { board_id } = useParams();
  const {
    members,
    users,
    loading,
    isModalOpen,
    setIsModalOpen,
    addMember,
    removeMember,
    handleDragStart,
    handleDrop,
    handleDragOver,
  } = BoardUserManagement(board_id);

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen rounded-3xl font-poppins">
      <NavbarBoard />

      {/* Header */}
      <div className="flex items-center justify-between mb-8 border-b border-gray-200 pb-3">
        <div className="flex items-center gap-3"></div>

        {/* Tombol Mobile */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="lg:hidden flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-all duration-200 active:scale-95 shadow-md"
        >
          <UserPlus size={18} />
          <span>Add</span>
        </button>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex gap-6">
        {/* 🧩 Kiri - Project Members */}
        <div
          className="w-[70%] bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <h2 className="font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <Users className="text-green-600" size={18} /> Project Members
          </h2>

          {loading ? (
            <p className="text-gray-500 animate-pulse">Loading members...</p>
          ) : members.length === 0 ? (
            <p className="text-gray-500 italic">
              Belum ada member dalam project ini.
            </p>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-1 gap-4">
              {members.map((m) => (
                <div
                  key={m.user_id}
                  className="flex justify-between items-center bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div>
                    <h3 className="font-medium text-gray-800">
                      {m.users?.full_name}{" "}
                      <span className="text-gray-400 text-sm">
                        | {m.users?.roles_user?.role_name}
                      </span>
                    </h3>
                    <p className="text-sm text-gray-500">{m.role}</p>
                  </div>
                  <button
                    onClick={() => removeMember(m.user_id)}
                    className="text-red-500 hover:text-red-700 hover:scale-110 transition-all duration-150"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 🧩 Kanan - Semua Users */}
        <AddMemberModal
          isDesktop={true}
          users={users}
          onAdd={addMember}
          onDragStart={handleDragStart}
        />
      </div>

      {/* 📱 Mobile Modal */}
      {isModalOpen && (
        <AddMemberModal
          isDesktop={false}
          users={users}
          onAdd={addMember}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
