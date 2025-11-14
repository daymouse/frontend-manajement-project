import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function SubtaskForm({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState({
    subtask_title: "",
    description: "",
    estimated_hours: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subtask_title.trim()) return alert("Judul subtask wajib diisi!");

    try {
      setLoading(true);
      await onSubmit(form);
      setForm({ subtask_title: "", description: "", estimated_hours: "" });
      onClose(); // Tutup modal setelah submit
    } catch (err) {
      console.error("Gagal menambah subtask:", err);
      alert("Gagal menambah subtask");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="subtask-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6 relative"
          >
            {/* Tombol close */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Tambah Subtask
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-sm text-gray-700 font-medium">
                  Judul Subtask <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="subtask_title"
                  placeholder="Contoh: Implementasi API Login"
                  value={form.subtask_title}
                  onChange={handleChange}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#622F10]/40"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-700 font-medium">
                  Deskripsi
                </label>
                <textarea
                  name="description"
                  placeholder="Tuliskan detail pekerjaan..."
                  value={form.description}
                  onChange={handleChange}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#622F10]/40 resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm text-gray-700 font-medium">
                  Estimasi (jam)
                </label>
                <input
                  type="number"
                  name="estimated_hours"
                  placeholder="Misal: 2"
                  min="0"
                  step="0.5"
                  value={form.estimated_hours}
                  onChange={handleChange}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#622F10]/40"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2 text-sm text-white rounded-lg ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-[#622F10] hover:bg-[#4E240C]"
                  }`}
                >
                  {loading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
