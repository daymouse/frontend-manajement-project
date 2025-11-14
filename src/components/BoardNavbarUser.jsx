import { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { apiFetch } from "../Server";
import { UserPlus, Users } from "lucide-react";

export default function BoardNavbar() {
  const { board_id } = useParams();
  const location = useLocation();

  const [board, setBoard] = useState(null);

  const fetchBoard = async () => {
    try {
      const res = await apiFetch(`/board/${board_id}`, "GET");
      if (res.data) setBoard(res.data);
    } catch (err) {
      console.error("❌ Gagal mengambil data board:", err);
    }
  };

  useEffect(() => {
    if (board_id) fetchBoard();
  }, [board_id]);

  const tabs = [
    { name: "Board", path: `/user/board/${board_id}` },
    { name: "statistik", path: `/user/board/${board_id}/statistik` },
    { name: "Calendar", path: `/user/board/${board_id}/calender` },
  ];

  return (
    <div className="w-full border-b bg-white mb-2 rounded-2xl shadow-sm">
      {/* 🔹 Top Bar */}
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 text-blue-700 font-semibold flex items-center justify-center rounded-md uppercase">
            {board?.board_name?.[0] || "?"}
          </div>
          <h1 className="text-lg font-semibold">{board?.board_name || "Project"}</h1>
        </div>
      </div>

      {/* 🔹 Tabs */}
      <div className="flex items-center gap-2 px-6 border-t border-gray-200">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path;
          return (
            <Link
              key={tab.name}
              to={tab.path}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-all ${
                active
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.name}
            </Link>
          );
        })}
        <button className="ml-2 px-2 py-1 text-gray-500 hover:text-gray-700">+</button>
      </div>
    </div>
  );
}