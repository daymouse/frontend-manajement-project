// components/CardModal/SubtaskModal.jsx
import { X } from "lucide-react";
import { useState } from "react";

export default function SubtaskModal({
  subtasks,
  handleAddSubtask,
  handleRemoveSubtask,
  onClose
}) {
  const [input, setInput] = useState("");

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-[999]">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-violet-50">
          <h3 className="font-bold">Add Subtasks</h3>
          <button onClick={onClose} className="hover:bg-gray-100 p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 border rounded-xl px-3 py-2"
              placeholder="Subtask title..."
            />
            <button
              onClick={() => {
                handleAddSubtask(input);
                setInput("");
              }}
              className="px-4 py-2 bg-violet-500 text-white rounded-xl"
            >
              Add
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {subtasks.length > 0 ? subtasks.map((s, i) => (
              <div key={i} className="flex justify-between bg-violet-50 rounded-xl px-3 py-2">
                <span>{s.title}</span>
                <button onClick={() => handleRemoveSubtask(i)}>
                  <X className="w-4 h-4 text-violet-500 hover:text-violet-700" />
                </button>
              </div>
            )) : <p className="text-gray-400 text-sm text-center">No subtasks added</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
