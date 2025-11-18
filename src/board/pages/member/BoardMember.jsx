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

  // 🔹 Handler untuk ketika card dihapus
  const handleCardDeleted = (deletedCardId) => {
    console.log("🗑️ Card dihapus dengan ID:", deletedCardId);
    
    // Update state tasks tanpa perlu refresh
    setTasks(prevTasks => {
      const updatedTasks = { ...prevTasks };
      
      // Hapus card dari semua kolom
      Object.keys(updatedTasks).forEach(status => {
        updatedTasks[status] = updatedTasks[status].filter(
          card => card.card_id !== deletedCardId
        );
      });
      
      return updatedTasks;
    });

    // Jika card yang sedang dibuka di modal dihapus, tutup modal
    if (selectedCardId === deletedCardId) {
      setSelectedCardId(null);
    }
  };

  const fetchCards = async () => {
    try {
      const res = await apiFetch(`/card/board/${board_id}`, "GET");

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

    // 🔹 Listen untuk card status changes dari endpoint time-logs
    socket.on("card_status_inProgress", (data) => {
      console.log("📡 [SOCKET] card_status_inProgres event:", data, "board_id param:", board_id);
      if (String(data.board_id) !== String(board_id)) return;
      console.log(data.message || "Card dimulai (In Progress)");
      fetchCards();
    });

    // 🔹 Listen untuk subtask status changes (dari emit di card room)
    socket.on("subtask_status_changed", (data) => {
      console.log("📡 [SOCKET] subtask_status_changed event:", data);
      // Refresh cards karena status card mungkin berubah
      fetchCards();
    });

    socket.on("card_status_changed", (data) => {
      console.log("📡 [SOCKET] card_status_changed event:", data);
      // Refresh cards karena status card mungkin berubah
      fetchCards();
    });

    // 🔹 Listen untuk card events lainnya
    socket.on("card_status_revisi", (data) => {
      console.log("📡 [SOCKET] revisi event:", data, "board_id param:", board_id);
      if (String(data.board_id) !== String(board_id)) return;
      console.log(data.message || "Card dikembalikan untuk revisi (In Progress)");
      fetchCards();
    });

    socket.on("card_doneOrInProgres", (data) => {
      console.log("📡 [SOCKET] card_doneOrInProgres event:", data);

      if (String(data.board_id) !== String(board_id)) return;

      console.log(`Card status berubah menjadi: ${data.new_status}`);
      fetchCards();
    });

    // 🔹 Listen untuk blocker events
    socket.on("blocker_reported", (data) => {
      console.log("🚨 [SOCKET] blocker_reported:", data);
      if (String(data.board_id) === String(board_id)) {
        fetchCards();
      }
    });

    socket.on("blocker_solved", (data) => {
      console.log("✅ [SOCKET] blocker_solved:", data);
      if (String(data.board_id) === String(board_id)) {
        fetchCards();
      }
    });

    // 🔹 Listen untuk card updates lainnya
    socket.on("card_updated", (data) => {
      console.log("🔄 [SOCKET] card_updated:", data);
      if (String(data.board_id) === String(board_id)) {
        fetchCards();
      }
    });

    socket.on("card_assigned", (data) => {
      console.log("👤 [SOCKET] card_assigned:", data);
      if (String(data.board_id) === String(board_id)) {
        fetchCards();
      }
    });

    // 🔹 PERBAIKAN: Socket listener untuk card_deleted
    socket.on("card_deleted", (data) => {
      console.log("🗑️ [SOCKET] card_deleted received in Member Task:", data);
      const { card_id, board_id: eventBoardId } = data;
      
      // Pastikan event ini untuk board yang sedang dibuka
      if (String(eventBoardId) === String(board_id)) {
        console.log("🔄 Card dihapus oleh user lain, update UI...");
        
        // Gunakan handler yang sama untuk konsistensi
        handleCardDeleted(card_id);
        
        // Optional: Tampilkan notifikasi
        console.log("🗑️ Card telah dihapus oleh user lain!");
      }
    });

    return () => {
      socket.emit("leave_board", board_id);
      
      // Cleanup semua event listeners
      const events = [
        "card_status_inProgress",
        "subtask_status_changed",
        "card_status_changed",
        "card_status_revisi",
        "card_doneOrInProgres",
        "blocker_reported",
        "blocker_solved",
        "card_updated",
        "card_assigned",
        "card_deleted",
      ];
      
      events.forEach(event => socket.off(event));
    };
  }, [board_id, handleCardDeleted]); // 🔹 Tambahkan handleCardDeleted ke dependencies

  const columns = [
    { key: "todo", label: "To Do", color: "bg-gray-100" },
    { key: "in_progress", label: "In Progress", color: "bg-blue-100" },
    { key: "review", label: "Review", color: "bg-yellow-100" },
    { key: "done", label: "Done", color: "bg-green-100" },
  ];

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-600 border border-red-200";
      case "medium":
        return "bg-orange-100 text-orange-600 border border-orange-200";
      case "low":
        return "bg-blue-100 text-blue-600 border border-blue-200";
      default:
        return "bg-gray-100 text-gray-500 border border-gray-200";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "todo":
        return "bg-gray-100 text-gray-700 border border-gray-200";
      case "in_progress":
        return "bg-yellow-100 text-yellow-700 border border-yellow-200";
      case "review":
        return "bg-orange-100 text-orange-700 border border-orange-200";
      case "done":
        return "bg-green-100 text-green-700 border border-green-200";
      default:
        return "bg-gray-100 text-gray-500 border border-gray-200";
    }
  };

  const getBlockerCount = (card) => {
    if (!card.card_blockers) return 0;
    return card.card_blockers.filter(blocker => !blocker.is_resolved).length;
  };

  const getSubtaskProgress = (card) => {
    if (!card.subtasks || card.subtasks.length === 0) return { percent: 0, done: 0, total: 0 };
    
    const total = card.subtasks.length;
    const done = card.subtasks.filter(st => st.status === 'done').length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    
    return { percent, done, total };
  };

  return (
    <div className="min-h-screen bg-white rounded-b-4xl font-poppins">
      {/* Container utama dengan shadow */}
      <div className="bg-gray-50 rounded-b-2xl p-6 h-full shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 h-full">
          {columns.map((col) => (
            <div
              key={col.key}
              className="flex flex-col rounded-2xl bg-white shadow-md hover:shadow-lg transition-shadow duration-300 h-full min-h-[500px]"
            >
              {/* Header kolom */}
              <div
                className={`p-4 rounded-t-2xl font-semibold text-gray-700 ${col.color} sticky top-0 z-10 shadow-sm border-b`}
              >
                <div className="flex justify-between items-center">
                  <span>{col.label}</span>
                  <span className="text-xs font-normal bg-white px-2 py-1 rounded-full text-gray-500 shadow-sm">
                    {tasks[col.key].length}
                  </span>
                </div>
              </div>

              {/* Area card dengan scroll */}
              <div className="flex-1 rounded-b-2xl p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-200px)]">
                {tasks[col.key].length > 0 ? (
                  tasks[col.key].map((task) => {
                    const blockerCount = getBlockerCount(task);
                    const progress = getSubtaskProgress(task);
                    
                    return (
                      <div
                        key={task.card_id}
                        className="p-4 bg-white rounded-xl shadow-md hover:shadow-lg border border-gray-100 transition-all duration-200 cursor-pointer hover:border-blue-200 hover:translate-y-[-2px] group"
                        onClick={() => setSelectedCardId(task.card_id)}
                      >
                        {/* Header dengan judul dan blocker indicator */}
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-800 text-sm capitalize flex items-center gap-1 flex-1">
                            {task.card_title || "Tanpa Judul"}
                            {blockerCount > 0 && (
                              <span
                                title={`${blockerCount} blocker aktif`}
                                className="text-red-500 flex items-center gap-1"
                              >
                                <AlertTriangle size={14} />
                                <span className="text-xs font-medium">{blockerCount}</span>
                              </span>
                            )}
                          </h3>
                          
                          {/* Priority badge */}
                          {task.priority && (
                            <span
                              className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(
                                task.priority
                              )}`}
                            >
                              {task.priority}
                            </span>
                          )}
                        </div>

                        {/* Deskripsi */}
                        {task.description && (
                          <p className="text-gray-500 text-xs mb-3 line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        {/* Progress bar untuk subtask */}
                        {progress.total > 0 && (
                          <div className="mb-3">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Progress</span>
                              <span>{progress.done}/{progress.total} ({progress.percent}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress.percent}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {/* Footer dengan status dan assignees */}
                        <div className="flex justify-between items-center mt-3">
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(
                              task.status
                            )}`}
                          >
                            {task.status
                              .replace("_", " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>

                          {/* Assignees avatars */}
                          {task.assignments && task.assignments.length > 0 && (
                            <div className="flex -space-x-2">
                              {task.assignments.slice(0, 3).map((assignment, index) => (
                                <div
                                  key={assignment.user?.user_id || index}
                                  className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                                  title={assignment.user?.user_name || 'Unknown'}
                                >
                                  {assignment.user?.user_name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                              ))}
                              {task.assignments.length > 3 && (
                                <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white">
                                  +{task.assignments.length - 3}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Estimated hours */}
                        {task.estimated_hours && (
                          <div className="mt-2 text-xs text-gray-500">
                            ⏱️ {task.estimated_hours} jam
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                    <p className="text-sm text-center">
                      Tidak ada tugas
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Card Modal */}
      {selectedCardId && (
        <CardModalMember
          cardId={selectedCardId}
          onClose={() => setSelectedCardId(null)}
          onCardUpdate={fetchCards} // Refresh cards ketika card diupdate di modal
          onCardDeleted={handleCardDeleted} // 🔹 TAMBAHKAN INI untuk handle delete dari modal
        />
      )}
    </div>
  );
}