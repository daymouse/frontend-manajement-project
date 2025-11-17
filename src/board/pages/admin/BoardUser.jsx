import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../../../Server";
import CardModal from "../../../components/CardModal";
import CardItem from "../../../components/CardDetail";
import { MoreVertical } from "lucide-react";
import { socket } from "./../../../socket";

export default function Task() {
  const { board_id } = useParams();
  const [tasks, setTasks] = useState({
    todo: [],
    in_progress: [],
    review: [],
    done: [],
  });
  const [openModal, setOpenModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isReviewRequested, setIsReviewRequested] = useState(false);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch cards
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

  const fetchProjectDetail = async () => {
    try {
      // panggil endpoint dengan boardId
      const res = await apiFetch(`/chat/project/${board_id}`, { method: "GET" });

      // simpan data project ke state
      setProject(res.project);
    } catch (err) {
      console.error("❌ Error fetchProjectDetail:", err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (board_id) {
      fetchProjectDetail();
      fetchCards();
    }
  }, [board_id]);

  useEffect(() => {
    if (!board_id) return;

    socket.emit("join_board", board_id);

    // 🔹 Listen untuk card status changes dari endpoint time-logs
    socket.on("card_status_inProgress", (data) => {
      console.log("📡 [SOCKET] card_status_inProgress event:", data, "board_id param:", board_id);
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

    socket.on("card_review_status", (data) => {
      console.log("📡 [SOCKET] card_review_status event:", data);
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

    // 🔹 Timlead menerima notifikasi approve
    socket.on("project_approved", (data) => {
      console.log("📡 [SOCKET] project_approved:", data);
      if (String(data.board_id) === String(board_id)) {
        if (typeof toast !== "undefined" && toast?.success) {
          toast.success(data.message || "✅ Project disetujui oleh admin!");
        } else {
          console.log(data.message || "✅ Project disetujui oleh admin!");
        }
      }
    });

    // 🔹 Additional events untuk leader-specific
    socket.on("card_status_review", (data) => {
      console.log("📡 [SOCKET] review event:", data, "board_id param:", board_id);
      if (String(data.board_id) !== String(board_id)) return;
      if (typeof toast !== "undefined" && toast?.success) {
        toast.success(data.message || "Card dipindahkan ke Review");
      } else {
        console.log(data.message || "Card dipindahkan ke Review");
      }
      fetchCards();
    });

    // ✅ Saat card di-approve
    socket.on("card_status_done", (data) => {
      console.log("📡 [SOCKET] done event:", data, "board_id param:", board_id);
      if (String(data.board_id) !== String(board_id)) return;

      if (typeof toast !== "undefined" && toast?.success) {
        toast.success(
          data.message ||
            `Card selesai! Total waktu aktual: ${data.total_actual_hours || 0} jam`
        );
      } else {
        console.log(
          data.message ||
            `Card selesai! Total waktu aktual: ${data.total_actual_hours || 0} jam`
        );
      }
      fetchCards();
    });

    // 🔹 Listen untuk project review status
    socket.on("project_review_requested", (data) => {
      console.log("📡 [SOCKET] project_review_requested:", data);
      if (String(data.board_id) === String(board_id)) {
        setIsReviewRequested(true);
        if (typeof toast !== "undefined" && toast?.success) {
          toast.success(data.message || "✅ Permintaan review project berhasil dikirim!");
        } else {
          console.log(data.message || "✅ Permintaan review project berhasil dikirim!");
        }
      }
    });

    return () => {
      socket.emit("leave_board", board_id);
      
      // Cleanup semua event listeners
      const events = [
        "card_status_inProgress",
        "subtask_status_changed",
        "card_review_status",
        "card_status_revisi",
        "card_doneOrInProgres",
        "blocker_reported",
        "blocker_solved",
        "card_updated",
        "card_assigned",
        "project_approved",
        "card_status_review",
        "card_status_done",
        "project_review_requested"
      ];
      
      events.forEach(event => socket.off(event));
    };
  }, [board_id]);

  // 🔹 Endpoint request review project
  const handleReviewProject = async () => {
    if (!confirm("Ajukan project untuk direview oleh admin?")) return;
    try {
      const res = await apiFetch(`/project-review/${board_id}/request-review`, {
        method: "PUT",
      });
      
      alert(res.message || "Permintaan review project berhasil dikirim!");
      setIsReviewRequested(true);
      
    } catch (err) {
      console.error("Gagal mengajukan review project:", err);
      alert("Gagal mengajukan review project");
    }
  };

  const columns = [
    { key: "todo", label: "To Do", color: "bg-gray-100" },
    { key: "in_progress", label: "In Progress", color: "bg-blue-100" },
    { key: "review", label: "Review", color: "bg-yellow-100" },
    { key: "done", label: "Done", color: "bg-green-100" },
  ];

  // Cek apakah project status adalah "done"
  const isProjectDone = project?.status === "done";

  return (
    <div className="p-6 bg-white min-h-screen rounded-b-4xl font-poppins">
      <div className="flex items-center justify-between mb-6 relative">
        <h1 className="text-2xl font-bold">📌 Project Board Leader</h1>

        {/* 🔹 Desktop buttons - HANYA tampil jika project bukan "done" */}
        {!isProjectDone && (
          <div className="hidden sm:flex gap-3">
            <button
              onClick={() => setOpenModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              + New Card
            </button>
            <button
              onClick={handleReviewProject}
              disabled={isReviewRequested}
              className={`px-4 py-2 rounded-lg ${
                isReviewRequested 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-green-600 hover:bg-green-700"
              } text-white`}
            >
              {isReviewRequested ? "⏳ Menunggu Review" : "✅ Ajukan Review"}
            </button>
          </div>
        )}

        {/* 🔹 Mobile menu - HANYA tampil jika project bukan "done" */}
        {!isProjectDone && (
          <div className="sm:hidden relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <MoreVertical className="w-6 h-6 text-gray-700" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 bg-white shadow-lg rounded-lg border w-48 z-50">
                <button
                  onClick={() => {
                    setOpenModal(true);
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  + New Card
                </button>
                <button
                  onClick={() => {
                    if (!isReviewRequested) {
                      handleReviewProject();
                    }
                    setMenuOpen(false);
                  }}
                  disabled={isReviewRequested}
                  className={`w-full text-left px-4 py-2 ${
                    isReviewRequested ? "text-gray-400" : "hover:bg-gray-100"
                  }`}
                >
                  {isReviewRequested ? "⏳ Menunggu Review" : "✅ Ajukan Review"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tampilkan status project jika sudah done */}
        {isProjectDone && (
          <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium">
            ✅ Project Selesai
          </div>
        )}
      </div>

      {/* board columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((col) => (
          <div key={col.key} className="flex flex-col">
            <div
              className={`p-3 rounded-t-xl font-semibold text-gray-700 ${col.color}`}
            >
              {col.label}
            </div>

            <div className="flex-1 bg-white rounded-b-xl shadow p-3 space-y-3 min-h-[200px]">
              {tasks[col.key].map((task) => (
                <CardItem key={task.card_id} card={task} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Create Card - HANYA tampil jika project bukan "done" */}
      {!isProjectDone && (
        <CardModal
          board_id={board_id}
          isOpen={openModal}
          onClose={() => setOpenModal(false)}
          onCreated={fetchCards}
        />
      )}
    </div>
  );
}