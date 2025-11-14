import { X, Users } from "lucide-react";

export default function ProjectDetailModal({ project, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[500px] p-6 rounded-2xl shadow-lg max-h-[90vh] overflow-y-auto animate-fadeIn">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg text-gray-800">
            Detail Project
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-bold text-indigo-700">
              {project.project_name}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Deadline:{" "}
              {project.deadline
                ? new Date(project.deadline).toLocaleDateString("id-ID")
                : "-"}
            </p>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-1">Deskripsi</h4>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              {project.description || "Tidak ada deskripsi."}
            </p>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Users size={18} /> Anggota Project
            </h4>
            {project.members?.length > 0 ? (
              <ul className="space-y-1">
                {project.members.map((m) => (
                  <li
                    key={m.user_id}
                    className="text-sm flex items-center justify-between bg-gray-100 p-2 rounded-lg"
                  >
                    <span>{m.full_name}</span>
                    <span className="text-xs text-gray-500">
                      {m.role === "admin" ? "👑 Admin" : "👤 Member"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">
                Tidak ada anggota terdaftar.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
