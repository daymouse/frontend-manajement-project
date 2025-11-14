import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../../../Server";
import CardModalMember from "../../../components/CardModalMember";
import { socket } from "./../../../socket";
import { AlertTriangle } from "lucide-react";

export default function Task() {
  const { board_id } = useParams();
  const [tasks, setTasks] = useState({
    todo: [],
    in_progress: [],
    review: [],
    done: [],
  });
  const [selectedCardId, setSelectedCardId] = useState(null);

  const fetchCards = async () => {
    try {
      console.log("📡 [FRONTEND] GET /card/board/" + board_id);
      const res = await apiFetch(`/card/board/${board_id}`, "GET");
      console.log("✅ [RESPONSE /card/board]", res);

      if (res.cards) {
        const grouped = { todo: [], in_progress: [], review: [], done: [] };
        res.cards.forEach((card) => {
          if (grouped[card.status]) grouped[card.status].push(card);
        });
        setTasks(grouped);
      }
    } catch (err) {
      console.error("❌ [FRONTEND] Gagal fetch cards:", err);
    }
  };

  useEffect(() => {
    if (board_id) fetchCards();
  }, [board_id]);

  useEffect(() => {
    if (!board_id) return;

    socket.emit("join_board", board_id);

    socket.on("card_status_revisi", (data) => {
      console.log("📡 [SOCKET] revisi event:", data, "board_id param:", board_id);
      if (String(data.board_id) !== String(board_id)) return;
      console.log(data.message || "Card dikembalikan untuk revisi (In Progress)");
      fetchCards();
    });

    socket.on("card_status_done", (data) => {
      console.log("📡 [SOCKET] done event:", data, "board_id param:", board_id);
      if (String(data.board_id) !== String(board_id)) return;
      console.log(
        data.message ||
          `Card selesai! Total waktu aktual: ${data.total_actual_hours || 0} jam`
      );
      fetchCards();
    });

    socket.on("card_status_inProgres", (data) => {
      console.log("📡 [SOCKET] inProgres event:", data, "board_id param:", board_id);
      if (String(data.board_id) !== String(board_id)) return;
      console.log(data.message || "Card dimulai (In Progress)");
      fetchCards();
    });

    socket.on("card_status_review", (data) => {
      console.log("📡 [SOCKET] review event:", data, "board_id param:", board_id);
      if (String(data.board_id) !== String(board_id)) return;
      console.log(data.message || "Card dipindahkan ke Review");
      fetchCards();
    });

    return () => {
      socket.emit("leave_board", board_id);
      socket.off("card_status_revisi");
      socket.off("card_status_done");
      socket.off("card_status_inProgres");
      socket.off("card_status_review");
    };
  }, [board_id]);

  const columns = [
    { key: "todo", label: "To Do", color: "bg-gray-100" },
    { key: "in_progress", label: "In Progress", color: "bg-blue-100" },
    { key: "review", label: "Review", color: "bg-yellow-100" },
    { key: "done", label: "Done", color: "bg-green-100" },
  ];

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-600";
      case "medium":
        return "bg-orange-100 text-orange-600";
      case "low":
        return "bg-blue-100 text-blue-600";
      default:
        return "bg-gray-100 text-gray-500";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "todo":
        return "bg-gray-200 text-gray-700";
      case "in_progress":
        return "bg-yellow-100 text-yellow-700";
      case "review":
        return "bg-orange-100 text-orange-700";
      case "done":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-500";
    }
  };

  return (
    <div className="p-6 bg-white min-h-screen rounded-4xl font-poppins">

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((col) => (
          <div
            key={col.key}
            className="flex flex-col rounded-2xl bg-gray-50 shadow-sm"
          >
            <div
              className={`p-3 rounded-t-2xl font-semibold text-gray-700 ${col.color}`}
            >
              {col.label}
            </div>

            <div className="flex-1 bg-white rounded-b-2xl p-4 space-y-4 min-h-[300px]">
              {tasks[col.key].length > 0 ? (
                tasks[col.key].map((task) => (
                  <div
                    key={task.card_id}
                    className="p-4 bg-white rounded-xl shadow hover:shadow-md border transition cursor-pointer"
                    onClick={() => setSelectedCardId(task.card_id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 text-sm capitalize flex items-center gap-1">
                          {task.card_title || "Tanpa Judul"}
                          {task.card_blockers?.some((b) => !b.is_resolved) && (
                            <span
                              title="Card memiliki blocker aktif"
                              className="text-red-500"
                            >
                              <AlertTriangle size={14} />
                            </span>
                          )}
                        </h3>

                        {task.description && (
                          <p className="text-gray-500 text-xs mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex gap-2 mt-3">
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(
                              task.status
                            )}`}
                          >
                            {task.status
                              .replace("_", " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(
                              task.priority
                            )}`}
                          >
                            {task.priority || "Normal"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm text-center py-8">
                  Tidak ada tugas
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedCardId && (
        <CardModalMember
          cardId={selectedCardId}
          onClose={() => setSelectedCardId(null)}
        />
      )}
    </div>
  );
}
