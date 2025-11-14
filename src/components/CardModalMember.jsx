import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, Reply, Send } from "lucide-react";
import SubtaskForm from "./SubtaskForm";
import useCardHandlers from "./handler/CardModalMember";
import BlockerReportModal from "./BlockerReportModal";
import BlockerSolveModal from "./BlockerSolveModal";
import { useParams } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react";

export default function CardModalMember({ cardId, onClose }) {
  const dominant = "#622F10";
  const { board_id } = useParams();
  const [selectedSubtaskId, setSelectedSubtaskId] = useState(null);
  const commentInputRef = useRef(null);
  const commentsContainerRef = useRef(null);

  const {
    card,
    loading,
    showForm,
    setShowForm,
    currentUser,
    contributors,
    editingSubtaskId,
    setEditingSubtaskId,
    processingId,
    activeTab,
    setActiveTab,
    isOwner,
    ownerCard,
    handleAddSubtask,
    handleStartWork,
    handleAssignSubtask,
    handleFinishWork,
    handleReviewSubtask,
    openReportModal,
    openSolveModal,
    showReportModal,
    setShowReportModal,
    showSolveModal,
    setShowSolveModal,
    targetType,
    targetId,
    comments,
    commentText,
    setCommentText,
    handleAddComment,
    handleDeleteComment,
    handleEditComment,
    // New states and functions for comment features
    replyingTo,
    setReplyingTo,
    taggedSubtask,
    setTaggedSubtask,
    showSubtaskSuggestions,
    setShowSubtaskSuggestions,
    subtaskSuggestions,
    handleTagSubtask,
    handleReplyComment,
  } = useCardHandlers(cardId, commentInputRef);

  // Auto-scroll to bottom when new comments are added
  useEffect(() => {
    if (commentsContainerRef.current && activeTab === "comments") {
      commentsContainerRef.current.scrollTop = commentsContainerRef.current.scrollHeight;
    }
  }, [comments, activeTab]);

  if (!cardId) return null;

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
    <AnimatePresence>
      {!!cardId && (
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
            {/* Bagian kiri: Konten utama */}
            <div className="flex-1 p-8 overflow-y-auto">
              <button
                onClick={onClose}
                className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 z-10"
              >
                <X />
              </button>

              {loading ? (
                <div className="text-center text-gray-500 py-10 animate-pulse">
                  Memuat detail card...
                </div>
              ) : card ? (
                <>
                  {/* Judul & Deskripsi */}
                  <h1 className="text-2xl font-semibold text-gray-800">
                    {card.card_title}
                  </h1>
                  <p className="text-gray-600 mt-1 mb-6">
                    {card.description || "Tidak ada deskripsi."}
                  </p>
                  <div className="mb-2 flex items-center gap-3">
                  {(card.status === "in_progress" || card.status === "todo") && (
                      <button
                        onClick={() => openReportModal("card", card.card_id)}
                        className="p-1 rounded-md hover:bg-red-100 text-red-600 text-xs"
                        title="Laporkan kendala"
                      >
                        🚫 Report
                      </button>
                    )}
                  </div>

                  {/* Subtasks Header */}
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="font-semibold text-gray-700">Subtasks</h2>
                    {card.status !== "review" &&
                      card.status !== "done" &&
                      card?.assignments?.some(
                        (a) => a.user?.user_id === currentUser?.user_id
                      ) && (
                        <button
                          onClick={() => setShowForm(true)}
                          className="px-3 py-1 bg-[#622F10] text-white text-sm rounded-lg hover:bg-[#4e240c]"
                        >
                          + Tambah Subtask
                        </button>
                      )}
                  </div>

                  {/* Form tambah subtask */}
                  <SubtaskForm
                    isOpen={showForm}
                    onClose={() => setShowForm(false)}
                    onSubmit={handleAddSubtask}
                  />

                  {/* Daftar subtasks */}
                  {card.subtasks?.length ? (
                    <div className="flex flex-col gap-3 max-h-80 overflow-y-auto">
                      {card.subtasks.map((s) => (
                        <div
                          key={s.subtask_id}
                          className="p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-all shadow-sm"
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

                              {/* Assignee */}
                              <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 relative">
                                <div
                                  className={`flex items-center gap-2 cursor-pointer ${
                                    ownerCard.includes(currentUser?.user_id) &&
                                    card.status !== "review" &&
                                    card.status !== "done"
                                      ? "hover:bg-gray-100 px-2 py-1 rounded-md"
                                      : ""
                                  }`}
                                  onClick={() => {
                                    const canEdit =
                                      ownerCard.includes(
                                        currentUser?.user_id
                                      ) &&
                                      card.status !== "review" &&
                                      card.status !== "done";
                                    if (canEdit) {
                                      const newId =
                                        editingSubtaskId === s.subtask_id
                                          ? null
                                          : s.subtask_id;
                                      setEditingSubtaskId(newId);
                                    }
                                  }}
                                >
                                  <div className="w-6 h-6 bg-gradient-to-br from-violet-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs">
                                    {s.assignee?.full_name?.charAt(0) || "?"}
                                  </div>
                                  <span className="truncate">
                                    {s.assignee?.full_name ||
                                      "Belum ditugaskan"}
                                  </span>
                                </div>

                                {/* Dropdown assignee */}
                                {editingSubtaskId === s.subtask_id && (
                                  <div className="absolute top-full mt-1 left-0 bg-white border rounded-lg shadow-lg p-2 w-56 z-10">
                                    {contributors?.length ? (
                                      <>
                                        {/* 🔹 Tombol "Assign to Me" */}
                                        <div
                                          onClick={() => handleAssignSubtask(s.subtask_id, currentUser.user_id)}
                                          className="flex items-center gap-2 px-2 py-1 mb-1 rounded hover:bg-blue-50 cursor-pointer"
                                        >
                                          <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-xs">
                                            {currentUser.full_name.charAt(0)}
                                          </div>
                                          <div className="flex flex-col">
                                            <span className="font-medium">Assign to Me</span>
                                            <span className="text-xs text-gray-500">{currentUser.full_name}</span>
                                          </div>
                                        </div>

                                        <hr className="my-1 border-gray-200" />

                                        {/* 🔹 Daftar contributor */}
                                        {contributors.map((c) => (
                                          <div
                                            key={c.users.user_id}
                                            onClick={() =>
                                              handleAssignSubtask(s.subtask_id, c.users.user_id)
                                            }
                                            className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 cursor-pointer"
                                          >
                                            <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs">
                                              {c.users.full_name.charAt(0)}
                                            </div>
                                            <div className="flex flex-col">
                                              <span>{c.users.full_name}</span>
                                              <span className="text-xs text-gray-500 capitalize">
                                                {c.role}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </>
                                    ) : (
                                      <p className="text-xs text-gray-500 px-2">
                                        Tidak ada contributor.
                                      </p>
                                    )}
                                  </div>
                                )}

                              </div>
                              {!s.subtask_blockers?.length
                                ? null
                                : s.subtask_blockers.some((b) => !b.is_resolved) && (
                                    <button
                                      onClick={() => {
                                        setSelectedSubtaskId(s.subtask_id);
                                        setShowSolveModal(true);
                                      }}
                                      className="flex items-center gap-1 text-red-600 text-xs mt-1 hover:underline"
                                    >
                                      ⚠️ Blocker aktif
                                    </button>
                                  )}
                            </div>

                            {/* Tombol aksi kanan */}
                            <div className="text-right flex flex-col items-end gap-2">
                              <div className="text-xs text-gray-500">
                                Est: {s.estimated_hours || 0}h | Act:{" "}
                                {s.actual_hours || 0}h
                              </div>

                              <div className="flex items-center gap-2">
                                {s.status === "todo" && (
                                  <button
                                    onClick={() =>
                                      handleStartWork(s.subtask_id)
                                    }
                                    disabled={processingId === s.subtask_id}
                                    className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700"
                                  >
                                    {processingId === s.subtask_id
                                      ? "..."
                                      : "Mulai"}
                                  </button>
                                )}

                                {s.status === "in_progress" && (
                                  <button
                                    onClick={() =>
                                      handleFinishWork(s.subtask_id)
                                    }
                                    disabled={processingId === s.subtask_id}
                                    className="px-3 py-1 bg-orange-600 text-white text-xs rounded-lg hover:bg-orange-700"
                                  >
                                    {processingId === s.subtask_id
                                      ? "..."
                                      : "Selesai"}
                                  </button>
                                )}

                                {s.status === "rejected" && (
                                  <button
                                    onClick={() =>
                                      handleStartWork(s.subtask_id)
                                    }
                                    disabled={processingId === s.subtask_id}
                                    className="px-3 py-1 bg-yellow-600 text-white text-xs rounded-lg hover:bg-yellow-700"
                                  >
                                    {processingId === s.subtask_id
                                      ? "..."
                                      : "Kerjakan Revisi"}
                                  </button>
                                )}

                                {s.status === "review" && (
                                  <>
                                    {!isOwner ? ( // ⬅️ sekarang hanya muncul untuk reviewer (bukan owner)
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => handleReviewSubtask(s.subtask_id, "approved")}
                                          disabled={processingId === s.subtask_id}
                                          className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700"
                                        >
                                          {processingId === s.subtask_id ? "..." : "Approve"}
                                        </button>

                                        <button
                                          onClick={() => handleReviewSubtask(s.subtask_id, "rejected")}
                                          disabled={processingId === s.subtask_id}
                                          className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700"
                                        >
                                          {processingId === s.subtask_id ? "..." : "Reject"}
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-blue-700 font-semibold text-xs">
                                        ⏳ Menunggu review...
                                      </span>
                                    )}
                                  </>
                                )}
                                {s.status === "done" && (
                                  <span className="text-green-700 font-semibold text-xs flex items-center gap-1">
                                    <CheckCircle size={14} /> Selesai
                                  </span>
                                )}
                              </div>
                              {(s.status === "in_progress" || s.status === "todo") && (
                              <button
                                onClick={() => openReportModal("subtask", s.subtask_id)}
                                className="p-1 rounded-md hover:bg-red-100 text-red-600 text-xs"
                                title="Laporkan kendala"
                              >
                                🚫 Report
                              </button>
                            )}
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

                  {/* Activity Tabs - Hanya Comments */}
                  <div className="mt-8">
                    <h3 className="font-semibold text-gray-700 mb-3">
                      Activity
                    </h3>
                    <div className="flex gap-3 border-b">
                      <button
                        onClick={() => setActiveTab("comments")}
                        className={`pb-2 px-3 capitalize border-b-2 ${
                          activeTab === "comments"
                            ? "border-[#622F10] text-[#622F10]"
                            : "border-transparent text-gray-500"
                        }`}
                      >
                        comments
                      </button>
                    </div>

                    <div className="py-4">
                      {activeTab === "comments" && (
                        <div className="space-y-4">
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
                                    comment.tagged_subtask_id === selectedSubtaskId 
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
                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                          #{comment.tagged_subtask.subtask_title}
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
                                    
                                    {(comment.user_id === currentUser?.user_id || isOwner) && (
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
                                    if (e.key === '#' && !showSubtaskSuggestions) {
                                      setShowSubtaskSuggestions(true);
                                    }
                                  }}
                                  placeholder="Ketik komentar... Gunakan # untuk tag subtask. Ctrl+Enter untuk kirim."
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#622F10] focus:border-transparent"
                                  rows="3"
                                />
                              </div>
                              <button
                                onClick={handleAddComment}
                                disabled={!commentText.trim()}
                                className="self-end px-4 py-2 bg-[#622F10] text-white rounded-lg hover:bg-[#4e240c] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                              >
                                <Send size={16} />
                                Kirim
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
                  Gagal memuat detail kartu.
                </p>
              )}
            </div>

            {/* Panel kanan (Detail Card) */}
            {card && (
              <div className="w-80 border-l border-gray-200 bg-gray-50 p-6 space-y-4 text-sm">
                <h3 className="font-semibold text-gray-700">Details</h3>
                <div>
                  <p className="text-gray-500">Assignee</p>
                  <p className="font-medium">
                    {card.assignments
                      ?.map((a) => a.user?.full_name)
                      .join(", ") || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Priority</p>
                  <p className="font-medium capitalize">{card.priority}</p>
                </div>
                <div>
                  <p className="text-gray-500">Due date</p>
                  <p className="font-medium">{card.due_date || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <p className="font-medium capitalize">{card.status}</p>
                </div>
                <div>
                  <p className="text-gray-500">Estimasi</p>
                  <p className="font-medium">
                    {card.estimated_hours || 0} jam
                  </p>
                </div>
              </div>
            )}

            <BlockerReportModal
              isOpen={showReportModal}
              onClose={() => setShowReportModal(false)}
              targetType={targetType}
              targetId={targetId}
              board_id={board_id}
              card_id={card?.card_id}
            />

            <BlockerSolveModal
              isOpen={showSolveModal}
              onClose={() => setShowSolveModal(false)}
              subtaskId={selectedSubtaskId}
              board_id={board_id}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence> 
  );
}