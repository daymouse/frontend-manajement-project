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
  const [menuOpen, setMenuOpen] = useState(false); // 🔹 kontrol menu mobile

  // Fetch cards
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
      console.error("Gagal fetch cards:", err);
    }
  };

  useEffect(() => {
    if (!board_id) return;

    socket.emit("join_board", board_id);

    // 🔹 Timlead menerima notifikasi approve
    socket.on("project_approved", (data) => {
      alert(data.message || "✅ Project disetujui oleh admin!");
      fetchProjectByBoard(); // Refresh status project
    });

    socket.on("card_status_inProgres", (data) => {
      console.log("📡 [SOCKET] Card status changed:", data);
      fetchCards(); // Re-fetch biar kolom board update
    });

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

    socket.on("card_status_revisi", (data) => {
    console.log("📡 [SOCKET] inProgress event:", data, "board_id param:", board_id);
    if (String(data.board_id) !== String(board_id)) return;

    if (typeof toast !== "undefined" && toast?.info) {
      toast.info(data.message || "Card dikembalikan untuk revisi (In Progress)");
    } else {
      console.log(data.message || "Card dikembalikan untuk revisi (In Progress)");
    }

    fetchCards(); // refresh list card
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

    return () => {
      socket.emit("leave_board", board_id);
      socket.off("project_approved");
      socket.off("card_status_inProgres");
      socket.off("card_status_review");
      socket.off("card_status_revisi");
      socket.off("card_status_done");
    };
  }, [board_id]);


  useEffect(() => {
    if (board_id) fetchCards();
  }, [board_id]);

  // 🔹 Endpoint done project
  const handleReviewProject = async () => {
    if (!confirm("Tandai project ini sebagai selesai?")) return;
    try {
      const res = await apiFetch(`/project/projects/${board_id}/review`, {
        method: "PATCH",
      });
      alert(res.message || "Project berhasil diselesaikan!");
    } catch (err) {
      console.error("Gagal menyelesaikan project:", err);
      alert("Gagal menyelesaikan project");
    }
  };

  const columns = [
    { key: "todo", label: "To Do", color: "bg-gray-100" },
    { key: "in_progress", label: "In Progress", color: "bg-blue-100" },
    { key: "review", label: "Review", color: "bg-yellow-100" },
    { key: "done", label: "Done", color: "bg-green-100" },
  ];

  return (
    <div className="p-6 bg-white min-h-screen rounded-4xl font-poppins">
      <div className="flex items-center justify-between mb-6 relative">
        <h1 className="text-2xl font-bold">📌 Project Board Leader</h1>

        {/* 🔹 Desktop buttons */}
        <div className="hidden sm:flex gap-3">
          <button
            onClick={() => setOpenModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            + New Card
          </button>
          <button
            onClick={handleReviewProject}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            ✅ Done Project
          </button>
        </div>

        {/* 🔹 Mobile menu */}
        <div className="sm:hidden relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <MoreVertical className="w-6 h-6 text-gray-700" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 bg-white shadow-lg rounded-lg border w-40 z-50">
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
                  handleDoneProject();
                  setMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                ✅ Done Project
              </button>
            </div>
          )}
        </div>
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

      {/* Modal Create Card */}
      <CardModal
        board_id={board_id}
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        onCreated={fetchCards}
      />
    </div>
  );
}
