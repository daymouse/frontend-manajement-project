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

  // Get today's date in YYYY-MM-DD format for min date
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden text-sm md:text-base max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-center">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white font-doto">Create New Card</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-col md:flex-row">
          
          {/* Left Form */}
          <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-6">
            
            {/* Card Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Card Title</label>
              <input
                type="text"
                name="card_title"
                value={form.card_title}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300"
                placeholder="Enter card title..."
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-2xl px-4 py-3 h-24 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300"
                placeholder="Add a description..."
              />
            </div>

            {/* Date + Hours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Due Date</label>
                <input
                  type="date"
                  name="due_date"
                  value={form.due_date}
                  onChange={handleChange}
                  min={getTodayDate()}
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Estimated Hours</label>
                <input
                  type="number"
                  name="estimated_hours"
                  value={form.estimated_hours}
                  onChange={handleChange}
                  min="0"
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Priority</label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-2xl px-4 py-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300"
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
            </div>

            {/* Preview Owner */}
            {taskOwner && (
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <UserPlus className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-gray-800">Task Owner:</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-white border border-blue-300 rounded-xl px-3 py-2 text-sm flex items-center gap-2">
                    {taskOwner.full_name || taskOwner.username}
                    <button
                      type="button"
                      onClick={() => handleRemoveContributor(taskOwner.user_id)}
                      className="text-blue-400 hover:text-blue-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                </div>
              </div>
            )}

            {/* Preview Contributors */}
            {contributors.length > 0 && (
              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span className="font-semibold text-gray-800">Contributors:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {contributors.map((u) => (
                    <span
                      key={u.user_id}
                      className="bg-white border border-purple-300 rounded-xl px-3 py-2 text-sm flex items-center gap-2"
                    >
                      {u.full_name || u.username}
                      <button
                        type="button"
                        onClick={() => handleRemoveContributor(u.user_id)}
                        className="text-purple-400 hover:text-purple-600 transition-colors"
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
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200">
                <div className="flex items-center gap-2 mb-3">
                  <ListPlus className="w-4 h-4 text-indigo-600" />
                  <span className="font-semibold text-gray-800">Subtasks:</span>
                </div>
                <ul className="space-y-2">
                  {subtasks.map((s, i) => (
                    <li key={i} className="flex items-center justify-between bg-white border border-indigo-200 rounded-xl px-3 py-2">
                      <span className="text-gray-700">{s.title}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubtask(i)}
                        className="text-indigo-400 hover:text-indigo-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-all duration-300 flex-1 sm:flex-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg shadow-blue-500/25 flex-1 sm:flex-none"
              >
                Create Card
              </button>
            </div>
          </form>

          {/* Right Toolbar Buttons */}
          <div className="md:w-32 w-full md:border-l border-t md:border-t-0 border-gray-100 flex md:flex-col justify-around p-4 bg-gray-50 items-center gap-4 md:gap-6">
            <ToolbarButton
              icon={<UserPlus className="w-6 h-6 text-blue-600" />}
              label="Task Owner"
              onClick={() => openMemberPicker("owner")}
              showLabel={true}
            />
            <ToolbarButton
              icon={<Users className="w-6 h-6 text-blue-600" />}
              label="Contributors"
              onClick={() => openMemberPicker("contributor")}
              showLabel={true}
            />
            <ToolbarButton
              icon={<ListPlus className="w-6 h-6 text-blue-600" />}
              label="Subtasks"
              onClick={() => setIsSubtaskModalOpen(true)}
              showLabel={true}
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
function ToolbarButton({ icon, label, onClick, showLabel = false }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-blue-400 hover:shadow-md transition-all duration-300 w-full max-w-[100px] group"
    >
      <div className="p-2 bg-blue-50 rounded-xl">
        {icon}
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-gray-700 text-center group-hover:text-blue-600 transition-colors">
          {label}
        </span>
      )}
    </button>
  );
}