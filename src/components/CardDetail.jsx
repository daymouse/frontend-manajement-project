import { motion, AnimatePresence } from "framer-motion";
import { useCardItemLeader } from "./handler/CardDetail";
import {
  CheckCircle,
  AlertTriangle,
  X,
  Send,
  Reply,
  Ban,
} from "lucide-react";

export default function CardItemLeader({ card }) {
  const {
    // State
    open,
    detail,
    loading,
    processing,
    activeTab,
    showBlockerModal,
    solutionText,
    editingField,
    members,
    currentUser,
    
    // Refs
    inputRefs,
    commentsContainerRef,
    commentInputRef,
    
    // Handlers
    handleOpen,
    handleClose,
    handleSubtaskAction,
    setEditingField,
    setActiveTab,
    setShowBlockerModal,
    setSolutionText,
    updateAssignee,
    fetchMembers,
    handleSolveCardBlocker,
    handleAction,
    comments,
    commentText,
    setCommentText,
    handleAddComment,
    handleDeleteComment,
    handleEditComment,
    replyingTo,
    setReplyingTo,
    taggedSubtask,
    setTaggedSubtask,
    showSubtaskSuggestions,
    setShowSubtaskSuggestions,
    subtaskSuggestions,
    handleTagSubtask,
    handleReplyComment,
    selectedSubtaskId,
    rejectingSubtask,
    handleFinalizeRejection,
    handleCancelRejection,
    
    // Derived values
    allSubtasksDone
  } = useCardItemLeader(card);

  const dominant = "#622F10";

  const getStatusBadge = (status) => {
    if (status === "done") return "bg-green-100 text-green-700";
    if (status === "in_progress") return "bg-yellow-100 text-yellow-700";
    if (status === "review") return "bg-blue-100 text-blue-700";
    if (status === "rejected") return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-600";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      {/* CARD PREVIEW */}
      <motion.div
        onClick={handleOpen}
        whileHover={{ scale: 1.02 }}
        className="cursor-pointer p-5 rounded-2xl border border-gray-200 shadow-sm bg-white hover:shadow-lg transition-all duration-200"
      >
        <h3 className="font-semibold text-lg text-gray-800 mb-1 flex items-center gap-1">
          {card.card_title}
          {card.card_blockers?.some((b) => !b.is_resolved) && (
            <AlertTriangle size={14} className="text-red-500" />
          )}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2">{card.description}</p>
        <div className="flex justify-between items-center mt-3 text-sm">
          <span
            className={`px-2 py-1 rounded-lg font-medium capitalize ${
              card.status === "done"
                ? "bg-green-100 text-green-700"
                : card.status === "review"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {card.status}
          </span>
          <span
            className={`px-2 py-1 rounded-lg font-medium capitalize ${
              card.priority === "high"
                ? "bg-red-100 text-red-700"
                : card.priority === "medium"
                ? "bg-orange-100 text-orange-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {card.priority}
          </span>
        </div>
      </motion.div>

      {/* MODAL DETAIL */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.98 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.98 }}
              className="bg-white w-full max-w-6xl rounded-xl shadow-2xl relative overflow-hidden flex"
              style={{ maxHeight: "90vh", height: "90vh" }}
            >
              {/* === KONTEN KIRI === */}
              <div className="flex-1 p-8 overflow-y-auto">
                <button
                  onClick={handleClose}
                  className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 z-10"
                >
                  <X />
                </button>

                {loading ? (
                  <div className="text-center text-gray-500 py-10 animate-pulse">
                    Memuat detail card...
                  </div>
                ) : detail ? (
                  <>
                    {/* === HEADER (Inline Edit) === */}
                    <h1 className="text-2xl font-semibold text-gray-800">
                      {detail.card_title}
                    </h1>
                    <p className="text-gray-600 mt-1 mb-6">
                      {detail.description || "Tidak ada deskripsi."}
                    </p>

                    {/* === BLOCKERS === */}
                    {detail.card_blockers?.some((b) => !b.is_resolved) && (
                      <div className="mb-4 space-y-2">
                        {detail.card_blockers
                          .filter((b) => !b.is_resolved)
                          .map((b) => (
                            <div
                              key={b.blocker_id}
                              className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
                            >
                              <p className="font-medium">🧱 Blocker:</p>
                              <p>{b.blocker_reason}</p>
                            </div>
                          ))}
                        <button
                          onClick={() => setShowBlockerModal(true)}
                          className="w-full py-2 mt-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium"
                        >
                          Selesaikan Blocker
                        </button>
                      </div>
                    )}

                    {/* === SUBTASKS === */}
                    <div className="flex justify-between items-center mb-3">
                      <h2 className="font-semibold text-gray-700">Subtasks</h2>
                    </div>

                    {detail.subtasks?.length ? (
                      <div className="flex flex-col gap-3 max-h-80 overflow-y-auto">
                        {detail.subtasks?.map((s) => (
                          <div
                            key={s.subtask_id}
                            className={`p-3 rounded-lg border transition-all shadow-sm ${
                              selectedSubtaskId === s.subtask_id 
                                ? 'border-blue-300 bg-blue-50' 
                                : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="max-w-[65%]">
                                <div className="flex items-center gap-3 mb-1">
                                  <h3 className="font-medium text-gray-800 text-sm sm:text-base line-clamp-1">
                                    {s.subtask_title}
                                  </h3>
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-xs font-medium ${getStatusBadge(
                                      s.status
                                    )}`}
                                  >
                                    {s.status?.replace("_", " ") || "todo"}
                                  </span>
                                </div>
                                {s.description && (
                                  <p className="text-xs text-gray-500 line-clamp-2">
                                    {s.description}
                                  </p>
                                )}
                              </div>

                              <div className="text-right flex flex-col items-end gap-2">
                                <div className="text-xs text-gray-500">
                                  Est: {s.estimated_hours || 0}h | Act:{" "}
                                  {s.actual_hours || 0}h
                                </div>

                                {/* Status Icon & Action Buttons */}
                                <div className="flex items-center gap-2">
                                  {s.status === "done" && (
                                    <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
                                  )}
                                  
                                  {/* === TOMBOL APPROVE & REJECT (untuk Team Lead / Admin) === */}
                                  {s.status === "review" && (
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleSubtaskAction(s.subtask_id, "approve")}
                                        disabled={processing}
                                        className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50"
                                      >
                                        {processing ? "..." : "Approve"}
                                      </button>
                                      <button
                                        onClick={() => handleSubtaskAction(s.subtask_id, "reject")}
                                        disabled={processing}
                                        className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                                      >
                                        <Ban size={12} />
                                        {processing ? "..." : "Reject"}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic text-sm">
                        Tidak ada subtask.
                      </p>
                    )}

                    {/* === ACTIVITY - Hanya Comments === */}
                    <div className="mt-8">
                      <h3 className="font-semibold text-gray-700 mb-3">
                        Activity
                      </h3>
                      <div className="flex gap-3 border-b">
                        <button
                          onClick={() => setActiveTab("comments")}
                          className={`pb-2 px-3 capitalize border-b-2 ${
                            activeTab === "comments"
                              ? `border-[${dominant}] text-[${dominant}]`
                              : "border-transparent text-gray-500"
                          }`}
                        >
                          comments
                        </button>
                      </div>

                      <div className="py-4">
                        {activeTab === "comments" && (
                          <div className="space-y-4">
                            {/* Rejection Mode Banner */}
                            {rejectingSubtask && (
                              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Ban className="text-red-600" size={16} />
                                    <span className="font-semibold text-red-700">
                                      Menolak Subtask: {rejectingSubtask.subtask_title}
                                    </span>
                                  </div>
                                  <button
                                    onClick={handleCancelRejection}
                                    className="text-red-500 hover:text-red-700 text-sm"
                                  >
                                    ✕ Batalkan
                                  </button>
                                </div>
                                <p className="text-sm text-red-600">
                                  Silakan tulis alasan penolakan di bawah. Komentar ini akan otomatis menandai subtask dan mengubah statusnya menjadi "rejected".
                                </p>
                              </div>
                            )}

                            {/* Comments List */}
                            <div 
                              ref={commentsContainerRef}
                              className="space-y-4 max-h-64 overflow-y-auto"
                            >
                              {comments?.length > 0 ? (
                                comments.map((comment) => (
                                  <div
                                    key={comment.comment_id}
                                    className={`p-3 rounded-lg border ${
                                      comment.parent_comment_id ? 'ml-8 bg-gray-50' : 'bg-white'
                                    } ${
                                      comment.is_reject_comment 
                                        ? 'border-red-300 bg-red-50' 
                                        : comment.tagged_subtask_id === selectedSubtaskId 
                                          ? 'border-blue-300 bg-blue-50' 
                                          : 'border-gray-200'
                                    }`}
                                  >
                                    <div className="flex justify-between items-start mb-2">
                                      <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs">
                                          {comment.user?.full_name?.charAt(0) || "U"}
                                        </div>
                                        <span className="font-medium text-sm">
                                          {comment.user?.full_name || "Unknown User"}
                                        </span>
                                        {comment.tagged_subtask && (
                                          <span className={`px-2 py-1 text-xs rounded-full ${
                                            comment.is_reject_comment
                                              ? 'bg-red-100 text-red-700'
                                              : 'bg-blue-100 text-blue-700'
                                          }`}>
                                            #{comment.tagged_subtask.subtask_title}
                                            {comment.is_reject_comment && " ❌"}
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-xs text-gray-500">
                                        {formatDate(comment.created_at)}
                                      </span>
                                    </div>
                                    
                                    <p className="text-gray-700 text-sm mb-2 whitespace-pre-wrap">
                                      {comment.comment_text}
                                    </p>

                                    <div className="flex justify-between items-center">
                                      <button
                                        onClick={() => handleReplyComment(comment.comment_id, comment.user?.full_name)}
                                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#622F10]"
                                      >
                                        <Reply size={12} />
                                        Balas
                                      </button>
                                      
                                      {(comment.user_id === currentUser?.user_id) && (
                                        <button
                                          onClick={() => handleDeleteComment(comment.comment_id)}
                                          className="text-xs text-red-500 hover:text-red-700"
                                        >
                                          Hapus
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-gray-500 italic text-sm text-center py-4">
                                  Belum ada komentar.
                                </p>
                              )}
                            </div>

                            {/* Comment Input */}
                            <div className="border-t pt-4 relative">
                              {/* Reply Indicator */}
                              {replyingTo && (
                                <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3">
                                  <span className="text-sm text-blue-700">
                                    Membalas <strong>{replyingTo.userName}</strong>
                                  </span>
                                  <button
                                    onClick={() => setReplyingTo(null)}
                                    className="text-blue-500 hover:text-blue-700 text-sm"
                                  >
                                    ✕
                                  </button>
                                </div>
                              )}

                              {/* Subtask Suggestions */}
                              {showSubtaskSuggestions && (
                                <div className="absolute bottom-full mb-2 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                                  {subtaskSuggestions.map((subtask) => (
                                    <button
                                      key={subtask.subtask_id}
                                      onClick={() => handleTagSubtask(subtask)}
                                      className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                                    >
                                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                      <span className="flex-1">{subtask.subtask_title}</span>
                                      <span className={`text-xs px-2 py-1 rounded ${getStatusBadge(subtask.status)}`}>
                                        {subtask.status}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              )}

                              <div className="flex gap-2">
                                <div className="flex-1 relative">
                                  <textarea
                                    ref={commentInputRef}
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && e.ctrlKey) {
                                        handleAddComment();
                                      }
                                      if (e.key === '#' && !showSubtaskSuggestions && !rejectingSubtask) {
                                        setShowSubtaskSuggestions(true);
                                      }
                                    }}
                                    placeholder={
                                      rejectingSubtask 
                                        ? `Tulis alasan penolakan untuk subtask "${rejectingSubtask.subtask_title}"...` 
                                        : "Ketik komentar... Gunakan # untuk tag subtask. Ctrl+Enter untuk kirim."
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#622F10] focus:border-transparent"
                                    rows="3"
                                  />
                                </div>
                                <button
                                  onClick={handleAddComment}
                                  disabled={!commentText.trim() || processing}
                                  className={`self-end px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                                    rejectingSubtask 
                                      ? 'bg-red-600 hover:bg-red-700' 
                                      : 'bg-[#622F10] hover:bg-[#4e240c]'
                                  }`}
                                >
                                  <Send size={16} />
                                  {processing ? "..." : rejectingSubtask ? "Tolak" : "Kirim"}
                                </button>
                              </div>
                              
                              {/* Tagged Subtask Indicator */}
                              {taggedSubtask && (
                                <div className="flex items-center gap-2 mt-2 p-2 bg-blue-50 rounded-lg">
                                  <span className="text-sm text-blue-700">
                                    Menandai subtask: <strong>{taggedSubtask.subtask_title}</strong>
                                  </span>
                                  <button
                                    onClick={() => setTaggedSubtask(null)}
                                    className="text-blue-500 hover:text-blue-700 text-sm"
                                  >
                                    ✕
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-red-500 text-center py-10">
                    Gagal memuat detail card.
                  </p>
                )}
              </div>

              {/* === PANEL KANAN === */}
              {detail && (
                <div className="w-80 border-l border-gray-200 bg-gray-50 p-6 space-y-4 text-sm">
                  <h3 className="font-semibold text-gray-700">Details</h3>

                  {/* Assignee */}
                  <div ref={(el) => (inputRefs.current.assignee = el)}>
                    <p className="text-gray-500">Assignee</p>
                    {editingField === "assignee" ? (
                      <select
                        value={detail.assignments?.[0]?.user?.user_id || ""}
                        onChange={(e) => {
                          const user_id = e.target.value;
                          const selected = members.find((m) => m.user_id === parseInt(user_id));
                          updateAssignee(user_id, selected?.full_name);
                        }}
                        className="w-full border rounded-md p-1 text-sm"
                      >
                        {members.map((m) => (
                          <option key={m.user_id} value={m.user_id}>
                            {m.full_name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p
                        onClick={() => {
                          fetchMembers(detail.project_id);
                          setEditingField("assignee");
                        }}
                        className="font-medium cursor-pointer hover:text-[#622F10]"
                      >
                        {detail.assignments?.[0]?.user?.full_name || "—"}
                      </p>
                    )}
                  </div>

                  {/* Priority */}
                  <div ref={(el) => (inputRefs.current.priority = el)}>
                    <p className="text-gray-500">Priority</p>
                    {editingField === "priority" ? (
                      <select
                        autoFocus
                        defaultValue={detail.priority}
                        className="border rounded-md p-1 text-sm w-full"
                      >
                        <option value="low">low</option>
                        <option value="medium">medium</option>
                        <option value="high">high</option>
                      </select>
                    ) : (
                      <p
                        onClick={() => setEditingField("priority")}
                        className="font-medium capitalize cursor-pointer hover:text-[#622F10]"
                      >
                        {detail.priority}
                      </p>
                    )}
                  </div>

                  {/* Due date */}
                  <div ref={(el) => (inputRefs.current.due_date = el)}>
                    <p className="text-gray-500">Due date</p>
                    {editingField === "due_date" ? (
                      <input
                        type="date"
                        autoFocus
                        defaultValue={detail.due_date || ""}
                        className="border rounded-md p-1 text-sm w-full"
                      />
                    ) : (
                      <p
                        onClick={() => setEditingField("due_date")}
                        className="font-medium cursor-pointer hover:text-[#622F10]"
                      >
                        {detail.due_date || "—"}
                      </p>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <p className="text-gray-500">Status</p>
                    <p className="font-medium capitalize">{detail.status}</p>
                  </div>

                  {/* Estimasi */}
                  <div ref={(el) => (inputRefs.current.estimated_hours = el)}>
                    <p className="text-gray-500">Estimasi</p>
                    {editingField === "estimated_hours" ? (
                      <input
                        type="number"
                        autoFocus
                        min="0"
                        defaultValue={detail.estimated_hours || 0}
                        className="border rounded-md p-1 text-sm w-full"
                      />
                    ) : (
                      <p
                        onClick={() => setEditingField("estimated_hours")}
                        className="font-medium cursor-pointer hover:text-[#622F10]"
                      >
                        {detail.estimated_hours || 0} jam
                      </p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* === MODAL SOLVE BLOCKER === */}
      <AnimatePresence>
        {showBlockerModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white w-full max-w-md rounded-xl p-6 shadow-xl"
            >
              <h3 className="font-semibold text-gray-800 mb-3">
                Selesaikan Blocker
              </h3>

              <textarea
                className="w-full border rounded-md p-2 text-sm"
                rows={4}
                placeholder="Tulis tindakan penyelesaian..."
                value={solutionText}
                onChange={(e) => setSolutionText(e.target.value)}
              />

              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowBlockerModal(false)}
                  className="px-3 py-1 text-sm text-gray-600 border rounded-md"
                >
                  Batal
                </button>
                <button
                  disabled={processing}
                  onClick={handleSolveCardBlocker}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md"
                >
                  {processing ? "Menyimpan..." : "Selesai"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}