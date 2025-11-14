// components/card/modals/BlockerReportModal.jsx
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { apiFetch } from "../Server";

export default function BlockerReportModal({ isOpen, onClose, targetType, targetId, board_id, card_id }) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
    e.preventDefault();

    if (!description.trim()) {
        return toast.error("Deskripsi kendala wajib diisi.");
    }

    try {
        setLoading(true);

        const payload = {
        type: targetType,      // "card" atau "subtask"
        id: targetId,          // id card atau subtask
        reason: description,   // alasan blocker
        board_id: board_id || null, // opsional, tambahkan jika kamu punya context
        card_id: card_id || null,   // opsional juga
        };

        await apiFetch("/solve-blocker/report", {
        method: "POST",
        body: JSON.stringify(payload),
        });

        toast.success("Laporan kendala berhasil dikirim.");
        onClose();
        setDescription("");
    } catch (err) {
        console.error("❌ Gagal mengirim laporan blocker:", err);
        toast.error(err.message || "Gagal mengirim laporan blocker.");
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
            <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>

            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              {targetType === "card" ? "Minta Solve ke Tim Lead" : "Laporkan Kendala Subtask"}
            </h2>

            <textarea
              className="w-full border rounded-lg p-2 text-sm"
              rows={4}
              placeholder="Jelaskan kendala yang dihadapi..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div className="flex justify-end mt-4 gap-2">
              <button
                onClick={onClose}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md"
              >
                {loading ? "Mengirim..." : "Kirim"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}