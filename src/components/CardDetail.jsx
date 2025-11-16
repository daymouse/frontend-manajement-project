import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useCardItemLeader } from "./handler/CardDetail";
import {
  CheckCircle,
  AlertTriangle,
  X,
  Send,
  Reply,
  Ban,
  User,
  Calendar,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
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
    comments,
    commentText,
    replyingTo,
    taggedSubtask,
    showSubtaskSuggestions,
    subtaskSuggestions,
    selectedSubtaskId,
    rejectingSubtask,
    allSubtasksDone,
    
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
    setCommentText,
    handleAddComment,
    handleDeleteComment,
    setReplyingTo,
    setTaggedSubtask,
    setShowSubtaskSuggestions,
    handleTagSubtask,
    handleReplyComment,
    setSelectedSubtaskId,
    handleFinalizeRejection,
    handleCancelRejection,
  } = useCardItemLeader(card);

  const dominant = "#4f46e5";
  const [showDetails, setShowDetails] = useState(false);
  const [sortedSubtasks, setSortedSubtasks] = useState([]);

  // Sort subtasks: done status di bawah, lainnya di atas
  useEffect(() => {
    if (detail?.subtasks) {
      const doneSubtasks = detail.subtasks.filter(s => s.status === "done");
      const otherSubtasks = detail.subtasks.filter(s => s.status !== "done");
      setSortedSubtasks([...otherSubtasks, ...doneSubtasks]);
    }
  }, [detail?.subtasks]);

  const getStatusBadge = (status) => {
    if (status === "done") return "bg-green-100 text-green-700";
    if (status === "in_progress") return "bg-yellow-100 text-yellow-700";
    if (status === "review") return "bg-blue-100 text-blue-700";
    if (status === "rejected") return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-600";
  };

  const getPriorityBadge = (priority) => {
    if (priority === "high") return "bg-red-100 text-red-700";
    if (priority === "medium") return "bg-orange-100 text-orange-700";
    if (priority === "low") return "bg-blue-100 text-blue-700";
    return "bg-gray-100 text-gray-600";
  };

  const getCardStatusBadge = (status) => {
    if (status === "done") return "bg-green-100 text-green-700";
    if (status === "review") return "bg-yellow-100 text-yellow-700";
    return "bg-gray-100 text-gray-600";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Tanggal tidak tersedia";
    
    try {
      return new Date(dateString).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Tanggal tidak valid";
    }
  };

  // Get today's date in YYYY-MM-DD format for due date validation
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Custom scrollbar styling
  const scrollbarStyles = `
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
  `;

  const renderCardPreview = () => (
    <motion.div
      onClick={handleOpen}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="cursor-pointer p-5 rounded-2xl border border-gray-200 shadow-sm bg-white hover:shadow-lg transition-all duration-300"
    >
      <h3 className="font-semibold text-lg text-gray-800 mb-2 flex items-center gap-2">
        {card.card_title}
        {card.card_blockers?.some((b) => !b.is_resolved) && (
          <AlertCircle size={16} className="text-red-500" />
        )}
      </h3>
      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{card.description}</p>
      <div className="flex justify-between items-center">
        <span className={`px-3 py-1 rounded-lg font-medium text-sm capitalize ${getCardStatusBadge(card.status)}`}>
          {card.status}
        </span>
        <span className={`px-3 py-1 rounded-lg font-medium text-sm capitalize ${getPriorityBadge(card.priority)}`}>
          {card.priority}
        </span>
      </div>
    </motion.div>
  );

  const renderHeader = () => (
    <div className="mb-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
        {detail.card_title}
      </h1>
      <p className="text-gray-600 text-sm sm:text-base">
        {detail.description || "Tidak ada deskripsi."}
      </p>
    </div>
  );

  const renderBlockers = () => {
    if (!detail.card_blockers?.some((b) => !b.is_resolved)) return null;

    return (
      <div className="mb-6 space-y-3">
        {detail.card_blockers
          .filter((b) => !b.is_resolved)
          .map((b) => (
            <div
              key={b.blocker_id}
              className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm"
            >
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle size={16} />
                <p className="font-semibold">Blocker:</p>
              </div>
              <p>{b.blocker_reason}</p>
            </div>
          ))}
        <button
          onClick={() => setShowBlockerModal(true)}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium transition-all duration-300 shadow-lg shadow-red-500/25"
        >
          Selesaikan Blocker
        </button>
      </div>
    );
  };

  const renderSubtasks = () => (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-gray-700 text-lg">Subtasks</h2>
      </div>

      {sortedSubtasks.length ? (
        <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
          {sortedSubtasks.map((s) => (
            <div
              key={s.subtask_id}
              className={`p-4 rounded-xl border transition-all duration-300 shadow-sm ${
                selectedSubtaskId === s.subtask_id 
                  ? 'border-indigo-300 bg-indigo-50' 
                  : s.status === "done" 
                    ? 'border-gray-200 bg-gray-50 opacity-75' 
                    : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                    <h3 className={`font-medium text-sm sm:text-base line-clamp-2 sm:line-clamp-1 ${
                      s.status === "done" ? "text-gray-500 line-through" : "text-gray-800"
                    }`}>
                      {s.subtask_title}
                    </h3>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusBadge(s.status)} self-start sm:self-auto`}>
                      {s.status?.replace("_", " ") || "todo"}
                    </span>
                  </div>
                  
                  {s.description && (
                    <p className={`text-xs line-clamp-2 mb-3 ${
                      s.status === "done" ? "text-gray-400" : "text-gray-500"
                    }`}>
                      {s.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                        s.status === "done" ? "opacity-50" : ""
                      }`}>
                        {s.assignee?.full_name?.charAt(0) || "?"}
                      </div>
                      <span className={`text-sm ${
                        s.status === "done" ? "text-gray-500" : "text-gray-600"
                      }`}>
                        {s.assignee?.full_name || "Belum ditugaskan"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className={`text-xs bg-gray-50 px-2 py-1 rounded-lg ${
                        s.status === "done" ? "text-gray-400" : "text-gray-500"
                      }`}>
                        Est: {s.estimated_hours || 0}h
                      </div>
                      {s.actual_hours > 0 && (
                        <div className={`text-xs bg-gray-50 px-2 py-1 rounded-lg ${
                          s.status === "done" ? "text-gray-400" : "text-gray-500"
                        }`}>
                          Act: {s.actual_hours}h
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:items-end">
                  <div className="flex items-center gap-2">
                    {s.status === "done" && (
                      <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
                    )}
                    
                    {s.status === "review" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSubtaskAction(s.subtask_id, "approve")}
                          disabled={processing}
                          className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          {processing ? (
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            "Approve"
                          )}
                        </button>
                        <button
                          onClick={() => handleSubtaskAction(s.subtask_id, "reject")}
                          disabled={processing}
                          className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          <Ban size={12} />
                          {processing ? (
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            "Reject"
                          )}
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
        <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-gray-500 italic text-sm">
            Tidak ada subtask.
          </p>
        </div>
      )}
    </div>
  );

  const renderRejectionBanner = () => {
    if (!rejectingSubtask) return null;

    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Ban className="text-red-600" size={16} />
            <span className="font-semibold text-red-700">
              Menolak Subtask: {rejectingSubtask.subtask_title}
            </span>
          </div>
          <button
            onClick={handleCancelRejection}
            className="text-red-500 hover:text-red-700 text-sm font-medium"
          >
            ✕ Batalkan
          </button>
        </div>
        <p className="text-sm text-red-600">
          Silakan tulis alasan penolakan di bawah. Komentar ini akan otomatis menandai subtask dan mengubah statusnya menjadi "rejected".
        </p>
      </div>
    );
  };

  const CommentItem = ({ comment, depth = 0 }) => {
    const isReply = depth > 0;
    
    const getUserName = () => {
      const user = comment.user || comment.users || {};
      return user.full_name || user.username || "Unknown User";
    };

    const getUserInitial = () => {
      const userName = getUserName();
      return userName.charAt(0).toUpperCase();
    };

    const handleReplyClick = () => {
      const userName = getUserName();
      handleReplyComment(comment.comment_id, userName);
    };

    const handleDeleteClick = () => {
      if (comment.comment_id) {
        handleDeleteComment(comment.comment_id);
      }
    };

    return (
      <div className={`${isReply ? 'mt-3' : ''}`}>
        <div
          className={`p-4 rounded-xl border ${
            isReply ? 'ml-8 bg-gray-50' : 'bg-white'
          } ${
            comment.is_reject_comment 
              ? 'border-red-300 bg-red-50' 
              : comment.tagged_subtask_id === selectedSubtaskId 
                ? 'border-indigo-300 bg-indigo-50' 
                : 'border-gray-200'
          } transition-colors`}
        >
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {getUserInitial()}
              </div>
              <span className="font-medium text-sm text-gray-800">
                {getUserName()}
              </span>
              {comment.tagged_subtask && (
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                  comment.is_reject_comment
                    ? 'bg-red-100 text-red-700'
                    : 'bg-indigo-100 text-indigo-700'
                }`}>
                  #{comment.tagged_subtask.subtask_title}
                  {comment.is_reject_comment && " ❌"}
                </span>
              )}
              {isReply && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Reply size={12} />
                  Balasan
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500">
              {formatDate(comment.created_at)}
            </span>
          </div>
          
          <p className="text-gray-700 text-sm mb-3 whitespace-pre-wrap">
            {comment.comment_text || "Komentar tidak tersedia"}
          </p>

          <div className="flex justify-between items-center">
            {/* Hapus tombol balas untuk semua komentar */}
            <div></div>
            
            {(comment.user_id === currentUser?.user_id) && (
              <button
                onClick={handleDeleteClick}
                className="text-xs text-red-500 hover:text-red-700 transition-colors font-medium"
              >
                Hapus
              </button>
            )}
          </div>
        </div>

        {comment.replies && Array.isArray(comment.replies) && comment.replies.length > 0 && (
          <div className="mt-2 space-y-2">
            {comment.replies.map((reply) => (
              <CommentItem 
                key={reply.comment_id || `reply-${Math.random()}`} 
                comment={reply} 
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderCommentsList = () => (
    <div ref={commentsContainerRef} className="space-y-4 max-h-64 overflow-y-auto custom-scrollbar">
      {comments?.length > 0 ? (
        comments.map((comment) => (
          <CommentItem key={comment.comment_id} comment={comment} />
        ))
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-gray-500 italic text-sm">
            Belum ada komentar.
          </p>
        </div>
      )}
    </div>
  );

  const renderReplyIndicator = () => {
    if (!replyingTo) return null;

    return (
      <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-xl p-3 mb-3">
        <span className="text-sm text-indigo-700 font-medium">
          Membalas <strong>{replyingTo.userName}</strong>
        </span>
        <button
          onClick={() => setReplyingTo(null)}
          className="text-indigo-500 hover:text-indigo-700 text-sm font-medium"
        >
          ✕
        </button>
      </div>
    );
  };

  const renderSubtaskSuggestions = () => {
    if (!showSubtaskSuggestions) return null;

    return (
      <div className="absolute bottom-full mb-2 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto custom-scrollbar">
        {subtaskSuggestions.map((subtask) => (
          <button
            key={subtask.subtask_id}
            onClick={() => handleTagSubtask(subtask)}
            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors border-b border-gray-100 last:border-b-0"
          >
            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
            <span className="flex-1 text-sm font-medium">{subtask.subtask_title}</span>
            <span className={`text-xs px-2 py-1 rounded-lg ${getStatusBadge(subtask.status)}`}>
              {subtask.status}
            </span>
          </button>
        ))}
      </div>
    );
  };

  const renderTaggedSubtaskIndicator = () => {
    if (!taggedSubtask) return null;

    return (
      <div className="flex items-center justify-between gap-2 mt-3 p-3 bg-indigo-50 rounded-xl">
        <span className="text-sm text-indigo-700 font-medium">
          Menandai subtask: <strong>{taggedSubtask.subtask_title}</strong>
        </span>
        <button
          onClick={() => setTaggedSubtask(null)}
          className="text-indigo-500 hover:text-indigo-700 text-sm font-medium"
        >
          ✕
        </button>
      </div>
    );
  };

  const renderCommentInput = () => (
    <div className="border-t border-gray-200 pt-4 relative">
      {renderReplyIndicator()}
      {renderSubtaskSuggestions()}

      <div className="flex flex-col sm:flex-row gap-3">
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
            className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 text-sm custom-scrollbar"
            rows="3"
          />
        </div>
        <button
          onClick={handleAddComment}
          disabled={!commentText.trim() || processing}
          className={`sm:self-end px-6 py-3 text-white rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium shadow-lg ${
            rejectingSubtask 
              ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-red-500/25' 
              : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-indigo-500/25'
          }`}
        >
          <Send size={16} />
          <span className="hidden sm:inline">
            {processing ? "..." : rejectingSubtask ? "Tolak" : "Kirim"}
          </span>
        </button>
      </div>
      
      {renderTaggedSubtaskIndicator()}
    </div>
  );

  const renderActivitySection = () => (
    <div className="mt-6">
      <h3 className="font-semibold text-gray-700 text-lg mb-4">Activity</h3>
      <div className="flex gap-3 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("comments")}
          className={`pb-3 px-4 capitalize border-b-2 font-medium transition-colors ${
            activeTab === "comments"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Komentar
        </button>
      </div>

      <div className="py-4">
        {activeTab === "comments" && (
          <div className="space-y-4">
            {renderRejectionBanner()}
            {renderCommentsList()}
            {renderCommentInput()}
          </div>
        )}
      </div>
    </div>
  );

  const renderEditableField = (field, label, children, isEditing) => (
    <div ref={(el) => (inputRefs.current[field] = el)} className="mb-4">
      <p className="text-gray-500 text-xs font-medium mb-1">{label}</p>
      {isEditing ? children : (
        <div
          onClick={() => {
            if (field === "assignee") fetchMembers(detail.project_id);
            setEditingField(field);
          }}
          className="font-medium text-gray-800 cursor-pointer hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors"
        >
          {children}
        </div>
      )}
    </div>
  );

  const renderAssigneeField = () =>
    renderEditableField(
      "assignee",
      "Assignee",
      editingField === "assignee" ? (
        <select
          value={detail.assignments?.[0]?.user?.user_id || ""}
          onChange={(e) => {
            const user_id = e.target.value;
            const selected = members.find((m) => m.user_id === parseInt(user_id));
            updateAssignee(user_id, selected?.full_name);
          }}
          className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {members.map((m) => (
            <option key={m.user_id} value={m.user_id}>
              {m.full_name}
            </option>
          ))}
        </select>
      ) : (
        <div className="flex items-center gap-2">
          <User size={16} className="text-gray-400" />
          {detail.assignments?.[0]?.user?.full_name || "—"}
        </div>
      ),
      editingField === "assignee"
    );

  const renderPriorityField = () =>
    renderEditableField(
      "priority",
      "Priority",
      editingField === "priority" ? (
        <select
          autoFocus
          defaultValue={detail.priority}
          className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 capitalize"
        >
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
        </select>
      ) : (
        <span className="capitalize">{detail.priority}</span>
      ),
      editingField === "priority"
    );

  const renderDueDateField = () =>
    renderEditableField(
      "due_date",
      "Due date",
      editingField === "due_date" ? (
        <input
          type="date"
          autoFocus
          min={getTodayDate()} // Batasi tidak boleh memilih hari yang sudah berlalu
          defaultValue={detail.due_date || ""}
          className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      ) : (
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-gray-400" />
          {detail.due_date || "—"}
        </div>
      ),
      editingField === "due_date"
    );

  const renderEstimatedHoursField = () =>
    renderEditableField(
      "estimated_hours",
      "Estimasi",
      editingField === "estimated_hours" ? (
        <input
          type="number"
          autoFocus
          min="0"
          defaultValue={detail.estimated_hours || 0}
          className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      ) : (
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-gray-400" />
          {`${detail.estimated_hours || 0} jam`}
        </div>
      ),
      editingField === "estimated_hours"
    );

  const renderSidePanel = () => (
    <div className={`w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-200 bg-gray-50 p-4 sm:p-6 space-y-4 text-sm overflow-y-auto custom-scrollbar ${
      showDetails ? 'block' : 'hidden lg:block'
    }`}>
      <h3 className="font-semibold text-gray-700 text-lg mb-4">Details</h3>
      {renderAssigneeField()}
      {renderPriorityField()}
      {renderDueDateField()}
      
      <div className="mb-4">
        <p className="text-gray-500 text-xs font-medium mb-1">Status</p>
        <p className="font-medium text-gray-800 capitalize">{detail.status}</p>
      </div>
      
      {renderEstimatedHoursField()}
    </div>
  );

  const renderModalContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-40">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-500 text-sm">Memuat detail card...</p>
          </div>
        </div>
      );
    }

    if (!detail) {
      return (
        <div className="text-center py-10">
          <p className="text-red-500 font-medium">
            Gagal memuat detail card.
          </p>
        </div>
      );
    }

    return (
      <>
        {renderHeader()}
        {renderBlockers()}
        {renderSubtasks()}
        {renderActivitySection()}
      </>
    );
  };

  const renderBlockerModal = () => (
    <AnimatePresence>
      {showBlockerModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl"
          >
            <h3 className="font-semibold text-gray-800 text-lg mb-4">
              Selesaikan Blocker
            </h3>

            <textarea
              className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={4}
              placeholder="Tulis tindakan penyelesaian..."
              value={solutionText}
              onChange={(e) => setSolutionText(e.target.value)}
            />

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowBlockerModal(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Batal
              </button>
              <button
                disabled={processing}
                onClick={handleSolveCardBlocker}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-sm rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-green-500/25"
              >
                {processing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                ) : (
                  "Selesai"
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderMainModal = () => (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-2 sm:p-4"
        >
          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            className="bg-white w-full max-w-6xl rounded-2xl sm:rounded-3xl shadow-2xl relative overflow-hidden flex flex-col lg:flex-row"
            style={{ maxHeight: "95vh", height: "95vh" }}
          >
            <style jsx>{scrollbarStyles}</style>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 z-20 bg-white/80 backdrop-blur-sm rounded-full p-2 text-gray-500 hover:text-gray-700 shadow-lg"
            >
              <X size={20} />
            </button>

            {/* Toggle Details Button for Mobile */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="lg:hidden absolute right-14 top-4 z-20 bg-white/80 backdrop-blur-sm rounded-full p-2 text-gray-500 hover:text-gray-700 shadow-lg"
            >
              {showDetails ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>

            {/* Main Content - Left Side */}
            <div className={`flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto custom-scrollbar ${showDetails ? 'hidden lg:block' : 'block'}`}>
              {renderModalContent()}
            </div>

            {/* Right Sidebar - Card Details */}
            {detail && renderSidePanel()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <style jsx>{scrollbarStyles}</style>
      {renderCardPreview()}
      {renderMainModal()}
      {renderBlockerModal()}
    </>
  );
}