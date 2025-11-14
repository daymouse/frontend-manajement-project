// components/CardModal/CardModal.jsx

import { useState } from "react";
import { X, Users, UserPlus, ListPlus } from "lucide-react";
import MemberModal from "./MemberAdd";
import SubtaskModal from "./SubtaskModal";
import { useCardHandlers } from "./handler/CardModal";

export default function CardModal({ board_id, isOpen, onClose, onCreated }) {
  const {
    form,
    taskOwner,
    contributors,
    subtasks,
    searchTerm,
    setSearchTerm,
    handleChange,
    fetchMembers,
    handleSelectUser,
    handleRemoveContributor,
    handleAddSubtask,
    handleRemoveSubtask,
    handleSubmit,
    users,
    activeRole,
  } = useCardHandlers(board_id, onCreated, onClose);

  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isSubtaskModalOpen, setIsSubtaskModalOpen] = useState(false);

  const openMemberPicker = async (role) => {
    await fetchMembers(role);
    setIsMemberModalOpen(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden text-sm md:text-base">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Create New Card</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col md:flex-row">
          
          {/* Left Form */}
          <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[75vh]">
            
            {/* Card Title */}
            <div className="space-y-1">
              <label className="font-semibold text-gray-700">Card Title</label>
              <input
                type="text"
                name="card_title"
                value={form.card_title}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:border-violet-500 focus:ring-0"
                placeholder="Enter card title..."
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="font-semibold text-gray-700">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 h-24 resize-none focus:border-violet-500"
                placeholder="Add a description..."
              />
            </div>

            {/* Date + Hours */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Due Date</label>
                <input
                  type="date"
                  name="due_date"
                  value={form.due_date}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:border-violet-500"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Estimated Hours</label>
                <input
                  type="number"
                  name="estimated_hours"
                  value={form.estimated_hours}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:border-violet-500"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-1">
              <label className="font-semibold text-gray-700">Priority</label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-white focus:border-violet-500"
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
            </div>

            {/* Preview Owner */}
            {taskOwner && (
              <div className="p-3 rounded-xl bg-violet-50 border border-violet-200 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-violet-600" />
                <span className="font-semibold text-gray-800">
                  Owner: {taskOwner.full_name || taskOwner.username}
                </span>
              </div>
            )}

            {/* Preview Contributors */}
            {contributors.length > 0 && (
              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span className="font-semibold text-gray-800">Contributors:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {contributors.map((u) => (
                    <span
                      key={u.user_id}
                      className="bg-white border border-purple-300 rounded-xl px-3 py-1 text-sm flex items-center gap-1"
                    >
                      {u.full_name || u.username}
                      <button
                        type="button"
                        onClick={() => handleRemoveContributor(u.user_id)}
                        className="text-purple-400 hover:text-purple-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Preview Subtasks */}
            {subtasks.length > 0 && (
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200">
                <div className="flex items-center gap-2 mb-2">
                  <ListPlus className="w-4 h-4 text-indigo-600" />
                  <span className="font-semibold text-gray-800">Subtasks:</span>
                </div>
                <ul className="list-disc ml-6 text-gray-700 space-y-1">
                  {subtasks.map((s, i) => (
                    <li key={i}>{s.title}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold hover:from-violet-600 hover:to-purple-700"
              >
                Create
              </button>
            </div>
          </form>

          {/* Right Toolbar Buttons */}
          <div className="md:w-20 w-full md:border-l border-t md:border-t-0 border-gray-100 flex md:flex-col justify-around p-4 bg-gray-50 items-center">
            <ToolbarButton
              icon={<UserPlus className="w-5 h-5 text-violet-600" />}
              label="Set Owner"
              onClick={() => openMemberPicker("owner")}
            />
            <ToolbarButton
              icon={<Users className="w-5 h-5 text-violet-600" />}
              label="Add Contributors"
              onClick={() => openMemberPicker("contributor")}
            />
            <ToolbarButton
              icon={<ListPlus className="w-5 h-5 text-violet-600" />}
              label="Add Subtasks"
              onClick={() => setIsSubtaskModalOpen(true)}
            />
          </div>

        </div>
      </div>

      {/* Modals */}
      {isMemberModalOpen && (
        <MemberModal
          title={activeRole === "owner" ? "Select Task Owner" : "Select Contributors"}
          users={users}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          handleSelectUser={handleSelectUser}
          onClose={() => setIsMemberModalOpen(false)}
        />
      )}

      {isSubtaskModalOpen && (
        <SubtaskModal
          subtasks={subtasks}
          handleAddSubtask={handleAddSubtask}
          handleRemoveSubtask={handleRemoveSubtask}
          onClose={() => setIsSubtaskModalOpen(false)}
        />
      )}
    </div>
  );
}

/* Button Component */
function ToolbarButton({ icon, label, onClick }) {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className="p-2 bg-white border rounded-xl shadow-sm hover:border-violet-400 transition-all"
      >
        {icon}
      </button>
      <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        {label}
      </div>
    </div>
  );
}
