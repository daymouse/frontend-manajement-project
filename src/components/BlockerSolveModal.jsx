import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { apiFetch } from "../Server";
import { toast } from "react-hot-toast";
import { socket } from "../socket";

export default function BlockerSolveModal({ isOpen, onClose, subtaskId }) {
  const [blockers, setBlockers] = useState([]);
  const [solutions, setSolutions] = useState({}); // ✅ solusi per blocker_id
  const [loading, setLoading] = useState(false);

  // ✅ Ambil daftar laporan blocker saat modal dibuka
  useEffect(() => {
    if (!subtaskId || !isOpen) return;

    const fetchBlockers = async () => {
      try {
        const res = await apiFetch(`/solve-blocker/blocker/subtask/${subtaskId}`);
        setBlockers(res.data || []);
        setSolutions({}); // reset solusi tiap kali buka modal baru
      } catch (err) {
        console.error("❌ Gagal ambil daftar blocker:", err);
        toast.error("Gagal memuat laporan blocker");
      }
    };

    fetchBlockers();
  }, [subtaskId, isOpen]);

  // ✅ Fungsi untuk menyelesaikan blocker tertentu
  const handleSolve = async (blocker_id) => {
    const solutionText = solutions[blocker_id] || "";

    try {
      setLoading(true);

      await apiFetch(`/solve-blocker/solve`, {
        method: "PATCH",
        body: JSON.stringify({
          type: "subtask",
          blocker_id,
          solution: solutionText || null,
          card_id: blockers[0]?.subtasks?.card_id || null,
        }),
      });

      toast.success("Blocker diselesaikan!");
      setBlockers((prev) =>
        prev.map((b) =>
          b.blocker_id === blocker_id ? { ...b, is_resolved: true } : b
        )
      );

      socket.emit("blocker_solved", {
        type: "subtask",
        blocker_id,
        solution: solutionText,
        subtask_id: subtaskId,
      });

      // Tutup otomatis kalau semua blocker sudah selesai
      const hasActive = blockers.some((b) => !b.is_resolved);
      if (!hasActive) onClose();
    } catch (err) {
      console.error("❌ Gagal menyelesaikan blocker:", err);
      toast.error("Gagal menyelesaikan blocker");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-white rounded-xl w-full max-w-md shadow-xl p-6 relative"
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>

            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Daftar Laporan Blocker
            </h2>

            {blockers.length === 0 ? (
              <p className="text-sm text-gray-500">Tidak ada laporan blocker.</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {blockers.map((b) => (
                  <div
                    key={b.blocker_id}
                    className={`p-3 rounded-lg border ${
                      b.is_resolved
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <p className="text-sm text-gray-800 mb-2">
                      🧱 {b.blocker_reason}
                    </p>

                    {b.is_resolved ? (
                      <p className="text-xs text-green-600">
                        ✅ Sudah diselesaikan
                      </p>
                    ) : (
                      <>
                        <textarea
                          rows={3}
                          value={solutions[b.blocker_id] || ""}
                          onChange={(e) =>
                            setSolutions((prev) => ({
                              ...prev,
                              [b.blocker_id]: e.target.value,
                            }))
                          }
                          placeholder="Tulis solusi (opsional)..."
                          className="w-full border rounded-md p-2 text-sm"
                        />
                        <button
                          onClick={() => handleSolve(b.blocker_id)}
                          disabled={loading}
                          className="mt-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md"
                        >
                          {loading ? "Menyimpan..." : "Tandai Selesai"}
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
