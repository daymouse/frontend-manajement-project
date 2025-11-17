import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, Reply, Send, User, Calendar, Clock, AlertCircle, ChevronLeft, ChevronRight, MoreVertical, Edit, Trash2 } from "lucide-react";
import SubtaskForm from "./SubtaskForm";
import useCardHandlers from "./handler/CardModalMember";
import BlockerReportModal from "./BlockerReportModal";
import BlockerSolveModal from "./BlockerSolveModal";
import { useParams } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react";

export default function CardModalMember({ cardId, onClose }) {
  const dominant = "#4f46e5";
  const { board_id } = useParams();
  const [selectedSubtaskId, setSelectedSubtaskId] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const commentInputRef = useRef(null);
  const commentsContainerRef = useRef(null);
  const dropdownRefs = useRef({});
  const [sortedSubtasks, setSortedSubtasks] = useState([]);

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
    replyingTo,
    setReplyingTo,
    taggedSubtask,
    setTaggedSubtask,
    showSubtaskSuggestions,
    setShowSubtaskSuggestions,
    subtaskSuggestions,
    handleTagSubtask,
    handleReplyComment,
    handleInlineUpdate,
    handleDeleteSubtask,
    editingField,
    setEditingField,
    editingValue,
    setEditingValue,
    startEditing,
    cancelEditing,
    saveEditing,
  } = useCardHandlers(cardId, commentInputRef);

  // PERBAIKAN: Update sortedSubtasks setiap kali card berubah
  useEffect(() => {
    if (card?.subtasks) {
      const sorted = [...card.subtasks].sort((a, b) => {
        // Urutkan: done/approved di akhir, lainnya di awal
        const aIsDone = a.status === "done" || a.status === "approved";
        const bIsDone = b.status === "done" || b.status === "approved";
        
        if (aIsDone && !bIsDone) return 1;
        if (!aIsDone && bIsDone) return -1;
        return 0;
      });
      setSortedSubtasks(sorted);
    }
  }, [card?.subtasks]); // PERBAIKAN: Gunakan card?.subtasks sebagai dependency

  // PERBAIKAN: Tambahkan useEffect untuk menutup dropdown ketika status berubah
  useEffect(() => {
    // Tutup semua dropdown ketika card loading (setelah aksi selesai)
    if (loading) {
      setActiveDropdown(null);
      setEditingSubtaskId(null);
    }
  }, [loading]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isOutsideAll = Object.values(dropdownRefs.current).every(ref => 
        ref && !ref.contains(event.target)
      );
      
      if (isOutsideAll) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (commentsContainerRef.current && activeTab === "comments") {
      commentsContainerRef.current.scrollTop = commentsContainerRef.current.scrollHeight;
    }
  }, [comments, activeTab]);

  if (!cardId) return null;

  const getStatusBadge = (status) => {
    if (status === "done" || status === "approved") return "bg-green-100 text-green-700";
    if (status === "in_progress") return "bg-yellow-100 text-yellow-700";
    if (status === "review") return "bg-blue-100 text-blue-700";
    if (status === "rejected") return "bg-red-100 text-red-700";
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

  // PERBAIKAN: Tambahkan kondisi yang lebih ketat untuk editing
  const canEditSubtask = (subtask) => {
    if (!isOwner) return false;
    if (card.status === "review" || card.status === "done") return false;
    if (subtask.status === "done" || subtask.status === "approved") return false;
    return true;
  };

  const handleFieldClick = (subtaskId, field, currentValue) => {
    const subtask = sortedSubtasks.find(s => s.subtask_id === subtaskId);
    if (subtask && canEditSubtask(subtask)) {
      startEditing(subtaskId, field, currentValue);
    }
  };

  const handleFieldBlur = (subtaskId, field) => {
    if (editingField === `${subtaskId}-${field}` && editingValue.trim() !== "") {
      saveEditing(subtaskId, field);
    } else {
      cancelEditing();
    }
  };

  const handleFieldKeyDown = (e, subtaskId, field) => {
    if (e.key === 'Enter') {
      saveEditing(subtaskId, field);
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  const toggleDropdown = (subtaskId, event) => {
    event.stopPropagation();
    const subtask = sortedSubtasks.find(s => s.subtask_id === subtaskId);
    if (subtask && canEditSubtask(subtask)) {
      setActiveDropdown(activeDropdown === subtaskId ? null : subtaskId);
    }
  };

  const getDropdownRef = (subtaskId) => (el) => {
    dropdownRefs.current[subtaskId] = el;
  };

  // PERBAIKAN: Handler untuk toggle dropdown assignee dengan kondisi
  const toggleAssigneeDropdown = (subtaskId, event) => {
    event.stopPropagation();
    const subtask = sortedSubtasks.find(s => s.subtask_id === subtaskId);
    if (subtask && canEditSubtask(subtask)) {
      setEditingSubtaskId(editingSubtaskId === subtaskId ? null : subtaskId);
    }
  };

  // PERBAIKAN: Handler untuk aksi subtask yang otomatis update UI
  const handleStartWorkWithUpdate = async (subtaskId) => {
    await handleStartWork(subtaskId);
    // UI akan otomatis update karena card.subtasks berubah dan useEffect triggered
  };

  const handleFinishWorkWithUpdate = async (subtaskId) => {
    await handleFinishWork(subtaskId);
    // UI akan otomatis update karena card.subtasks berubah dan useEffect triggered
  };

  const handleAssignSubtaskWithUpdate = async (subtaskId, userId) => {
    await handleAssignSubtask(subtaskId, userId);
    setEditingSubtaskId(null); // Tutup dropdown setelah assign
  };

  const CommentItem = ({ comment, depth = 0 }) => {
    if (!comment) return null;
    
    const isReply = depth > 0;
    
    const getUserName = () => {
      const user = comment.user || comment.users || {};
      return user.full_name || user.username || "Unknown User";
    };

    const getUserInitial = () => {
      const userName = getUserName();
      return userName.charAt(0).toUpperCase();
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
            comment.tagged_subtask_id === selectedSubtaskId 
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
                <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium">
                  #{comment.tagged_subtask.subtask_title || "Subtask"}
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
            {(comment.user_id === currentUser?.user_id || isOwner) && (
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

  const handleCommentKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleAddComment();
    }
    if (e.key === '#' && !showSubtaskSuggestions) {
      setShowSubtaskSuggestions(true);
    }
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setCommentText("");
  };

  const handleCancelTag = () => {
    setTaggedSubtask(null);
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

  return (
    <AnimatePresence>
      {!!cardId && (
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
              onClick={onClose}
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
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-gray-500 text-sm">Memuat detail card...</p>
                  </div>
                </div>
              ) : card ? (
                <>
                  {/* Header */}
                  <div className="mb-6">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                      {card.card_title || "Untitled Card"}
                    </h1>
                    <p className="text-gray-600 text-sm sm:text-base">
                      {card.description || "Tidak ada deskripsi."}
                    </p>
                    
                    {/* Report Button */}
                    <div className="mt-3">
                      {(card.status === "in_progress" || card.status === "todo") && (
                        <button
                          onClick={() => openReportModal("card", card.card_id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-xs font-medium transition-colors"
                        >
                          <AlertCircle size={14} />
                          Laporkan Kendala
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Subtasks Section */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="font-semibold text-gray-700 text-lg">Subtasks</h2>
                      {card.status !== "review" &&
                        card.status !== "done" &&
                        card?.assignments?.some(
                          (a) => a.user?.user_id === currentUser?.user_id
                        ) && (
                          <button
                            onClick={() => setShowForm(true)}
                            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all duration-300 shadow-lg shadow-indigo-500/25 font-medium"
                          >
                            + Tambah Subtask
                          </button>
                        )}
                    </div>

                    {/* Subtask Form */}
                    <SubtaskForm
                      isOpen={showForm}
                      onClose={() => setShowForm(false)}
                      onSubmit={handleAddSubtask}
                    />

                    {/* Subtasks List */}
                    {sortedSubtasks.length ? (
                      <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                        {sortedSubtasks.map((s) => {
                          const canEdit = canEditSubtask(s);
                          const isCompleted = s.status === "done" || s.status === "approved";
                          
                          return (
                            <div
                              key={s.subtask_id}
                              className={`p-4 rounded-xl border transition-all duration-300 shadow-sm relative ${
                                selectedSubtaskId === s.subtask_id 
                                  ? 'border-indigo-300 bg-indigo-50' 
                                  : isCompleted
                                    ? 'border-gray-200 bg-gray-50 opacity-75' 
                                    : 'border-gray-200 bg-white hover:bg-gray-50'
                              }`}
                            >
                              {/* PERBAIKAN: Dropdown titik tiga vertikal dengan kondisi yang diperbaiki */}
                              {canEdit && (
                                <div 
                                  className="absolute right-4 top-4 z-10"
                                  ref={getDropdownRef(s.subtask_id)}
                                >
                                  <button
                                    onClick={(e) => toggleDropdown(s.subtask_id, e)}
                                    className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                                  >
                                    <MoreVertical size={16} className="text-gray-500" />
                                  </button>
                                  
                                  <AnimatePresence>
                                    {activeDropdown === s.subtask_id && (
                                      <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-32"
                                      >
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openReportModal("subtask", s.subtask_id);
                                            setActiveDropdown(null);
                                          }}
                                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                          <AlertCircle size={14} />
                                          Report
                                        </button>
                                        {s.status === "todo" && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (confirm("Yakin ingin menghapus subtask ini?")) {
                                                handleDeleteSubtask(s.subtask_id);
                                                setActiveDropdown(null);
                                              }
                                            }}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                          >
                                            <Trash2 size={14} />
                                            Hapus
                                          </button>
                                        )}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              )}

                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 pr-8">
                                <div className="flex-1">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                    {editingField === `${s.subtask_id}-subtask_title` && canEdit ? (
                                      <input
                                        type="text"
                                        value={editingValue}
                                        onChange={(e) => setEditingValue(e.target.value)}
                                        onBlur={() => handleFieldBlur(s.subtask_id, 'subtask_title')}
                                        onKeyDown={(e) => handleFieldKeyDown(e, s.subtask_id, 'subtask_title')}
                                        className="font-medium text-gray-800 text-sm sm:text-base border border-indigo-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                                        autoFocus
                                      />
                                    ) : (
                                      <h3 
                                        className={`font-medium text-sm sm:text-base line-clamp-2 sm:line-clamp-1 ${
                                          isCompleted ? "text-gray-500 line-through" : "text-gray-800"
                                        } ${
                                          canEdit
                                            ? 'cursor-pointer hover:bg-gray-100 rounded-lg px-2 py-1 transition-colors' 
                                            : ''
                                        }`}
                                        onClick={() => handleFieldClick(s.subtask_id, 'subtask_title', s.subtask_title)}
                                      >
                                        {s.subtask_title || "Untitled Subtask"}
                                      </h3>
                                    )}
                                    <span
                                      className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusBadge(
                                        s.status
                                      )} self-start sm:self-auto`}
                                    >
                                      {s.status?.replace("_", " ") || "todo"}
                                    </span>
                                  </div>
                                  
                                  {editingField === `${s.subtask_id}-description` && canEdit ? (
                                    <textarea
                                      value={editingValue}
                                      onChange={(e) => setEditingValue(e.target.value)}
                                      onBlur={() => handleFieldBlur(s.subtask_id, 'description')}
                                      onKeyDown={(e) => handleFieldKeyDown(e, s.subtask_id, 'description')}
                                      className="text-xs text-gray-500 border border-indigo-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full resize-none"
                                      rows="2"
                                      autoFocus
                                    />
                                  ) : (
                                    <p 
                                      className={`text-xs line-clamp-2 mb-3 ${
                                        isCompleted ? "text-gray-400" : "text-gray-500"
                                      } ${
                                        canEdit
                                          ? 'cursor-pointer hover:bg-gray-100 rounded-lg px-2 py-1 transition-colors' 
                                          : ''
                                      }`}
                                      onClick={() => handleFieldClick(s.subtask_id, 'description', s.description || '')}
                                    >
                                      {s.description || "Klik untuk menambah deskripsi..."}
                                    </p>
                                  )}

                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      {/* PERBAIKAN: Dropdown assignee yang berfungsi dengan kondisi */}
                                      <div className="relative">
                                        <div
                                          className={`flex items-center gap-2 ${
                                            canEdit
                                              ? "cursor-pointer hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors"
                                              : ""
                                          }`}
                                          onClick={(e) => {
                                            if (canEdit) {
                                              toggleAssigneeDropdown(s.subtask_id, e);
                                            }
                                          }}
                                        >
                                          <div className={`w-6 h-6 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                                            isCompleted ? "opacity-50" : ""
                                          }`}>
                                            {s.assignee?.full_name?.charAt(0) || "?"}
                                          </div>
                                          <span className={`text-sm truncate max-w-20 sm:max-w-32 ${
                                            isCompleted ? "text-gray-500" : "text-gray-600"
                                          }`}>
                                            {s.assignee?.full_name || "Belum ditugaskan"}
                                          </span>
                                        </div>

                                        {/* PERBAIKAN: Dropdown contributor */}
                                        {editingSubtaskId === s.subtask_id && canEdit && (
                                          <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-64 z-50">
                                            {contributors?.length ? (
                                              <>
                                                <div
                                                  onClick={() => {
                                                    handleAssignSubtaskWithUpdate(s.subtask_id, currentUser.user_id);
                                                  }}
                                                  className="flex items-center gap-3 p-2 mb-2 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors border border-blue-100"
                                                >
                                                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                                    {currentUser.full_name?.charAt(0) || "U"}
                                                  </div>
                                                  <div className="flex flex-col">
                                                    <span className="font-medium text-sm">Assign to Me</span>
                                                    <span className="text-xs text-gray-500">{currentUser.full_name || "User"}</span>
                                                  </div>
                                                </div>

                                                <hr className="my-2 border-gray-200" />

                                                <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                                  {contributors.map((c) => (
                                                    <div
                                                      key={c.users?.user_id || `contributor-${Math.random()}`}
                                                      onClick={() => {
                                                        handleAssignSubtaskWithUpdate(s.subtask_id, c.users?.user_id);
                                                      }}
                                                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                                    >
                                                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                                        {c.users?.full_name?.charAt(0) || "C"}
                                                      </div>
                                                      <div className="flex flex-col">
                                                        <span className="text-sm font-medium">{c.users?.full_name || "Contributor"}</span>
                                                        <span className="text-xs text-gray-500 capitalize">
                                                          {c.role || "member"}
                                                        </span>
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              </>
                                            ) : (
                                              <p className="text-xs text-gray-500 px-2 text-center py-4">
                                                Tidak ada contributor.
                                              </p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {editingField === `${s.subtask_id}-estimated_hours` && canEdit ? (
                                        <input
                                          type="number"
                                          value={editingValue}
                                          onChange={(e) => setEditingValue(e.target.value)}
                                          onBlur={() => handleFieldBlur(s.subtask_id, 'estimated_hours')}
                                          onKeyDown={(e) => handleFieldKeyDown(e, s.subtask_id, 'estimated_hours')}
                                          className="text-xs text-gray-500 border border-indigo-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-16"
                                          min="0"
                                          step="0.5"
                                          autoFocus
                                        />
                                      ) : (
                                        <div 
                                          className={`text-xs bg-gray-50 px-2 py-1 rounded-lg ${
                                            isCompleted ? "text-gray-400" : "text-gray-500"
                                          } ${
                                            canEdit
                                              ? 'cursor-pointer hover:bg-gray-100 transition-colors' 
                                              : ''
                                          }`}
                                          onClick={() => handleFieldClick(s.subtask_id, 'estimated_hours', s.estimated_hours || '0')}
                                        >
                                          Est: {s.estimated_hours || 0}h
                                        </div>
                                      )}
                                      
                                      {s.actual_hours > 0 && (
                                        <div className={`text-xs bg-gray-50 px-2 py-1 rounded-lg ${
                                          isCompleted ? "text-gray-400" : "text-gray-500"
                                        }`}>
                                          Act: {s.actual_hours}h
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {s.subtask_blockers && s.subtask_blockers.length > 0 && 
                                  s.subtask_blockers.some((b) => !b.is_resolved) && (
                                    <button
                                      onClick={() => {
                                        setSelectedSubtaskId(s.subtask_id);
                                        setShowSolveModal(true);
                                      }}
                                      className="flex items-center gap-1 text-red-600 text-xs mt-1 hover:underline"
                                    >
                                      <AlertCircle size={12} />
                                      Blocker aktif
                                    </button>
                                  )}
                                </div>

                                <div className="flex flex-col gap-2 sm:items-end mt-2 sm:mt-0">
                                  <div className="flex flex-wrap gap-2 justify-end items-center">
                                    {s.status === "todo" && (
                                      <button
                                        onClick={() => handleStartWorkWithUpdate(s.subtask_id)}
                                        disabled={processingId === s.subtask_id || isCompleted}
                                        className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 min-w-16 justify-center order-1"
                                      >
                                        {processingId === s.subtask_id ? (
                                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                          "Mulai"
                                        )}
                                      </button>
                                    )}

                                    {s.status === "in_progress" && (
                                      <button
                                        onClick={() => handleFinishWorkWithUpdate(s.subtask_id)} 
                                        disabled={processingId === s.subtask_id || isCompleted}
                                        className="px-3 py-1.5 bg-orange-600 text-white text-xs rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 min-w-16 justify-center order-1"
                                      >
                                        {processingId === s.subtask_id ? (
                                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                          "Selesai"
                                        )}
                                      </button>
                                    )}

                                    {s.status === "rejected" && (
                                      <button
                                        onClick={() => handleStartWorkWithUpdate(s.subtask_id)}
                                        disabled={processingId === s.subtask_id || isCompleted}
                                        className="px-3 py-1.5 bg-yellow-600 text-white text-xs rounded-lg hover:bg-yellow-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 min-w-16 justify-center order-1"
                                      >
                                        {processingId === s.subtask_id ? (
                                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                          "Revisi"
                                        )}
                                      </button>
                                    )}

                                    {/* PERBAIKAN: Hilangkan tombol approve/reject untuk member */}
                                    {s.status === "review" && (
                                      <span className="text-blue-700 font-semibold text-xs flex items-center gap-1 order-1">
                                        <Clock size={12} />
                                        Menunggu review...
                                      </span>
                                    )}

                                    {isCompleted && (
                                      <span className="text-green-700 font-semibold text-xs flex items-center gap-1 order-1">
                                        <CheckCircle size={14} />
                                        Selesai
                                      </span>
                                    )}

                                    {!isOwner && (s.status === "in_progress" || s.status === "todo") && !isCompleted && (
                                      <button
                                        onClick={() => openReportModal("subtask", s.subtask_id)}
                                        className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-xs font-medium transition-colors order-2"
                                      >
                                        <AlertCircle size={12} />
                                        Report
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-gray-500 italic text-sm">
                          Tidak ada subtask.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Comments Section */}
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
                          <div 
                            ref={commentsContainerRef}
                            className="space-y-4 max-h-64 overflow-y-auto custom-scrollbar"
                          >
                            {comments && comments.length > 0 ? (
                              comments.map((comment) => (
                                <CommentItem 
                                  key={comment.comment_id || `comment-${Math.random()}`} 
                                  comment={comment} 
                                />
                              ))
                            ) : (
                              <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
                                <p className="text-gray-500 italic text-sm">
                                  Belum ada komentar.
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="border-t border-gray-200 pt-4 relative">
                            {replyingTo && (
                              <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-xl p-3 mb-3">
                                <span className="text-sm text-indigo-700 font-medium">
                                  Membalas <strong>{replyingTo.userName}</strong>
                                </span>
                                <button
                                  onClick={handleCancelReply}
                                  className="text-indigo-500 hover:text-indigo-700 text-sm font-medium"
                                >
                                  ✕
                                </button>
                              </div>
                            )}

                            {showSubtaskSuggestions && (
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
                            )}

                            <div className="flex flex-col sm:flex-row gap-3">
                              <div className="flex-1 relative">
                                <textarea
                                  ref={commentInputRef}
                                  value={commentText}
                                  onChange={(e) => setCommentText(e.target.value)}
                                  onKeyDown={handleCommentKeyDown}
                                  placeholder="Ketik komentar... Gunakan # untuk tag subtask. Ctrl+Enter untuk kirim."
                                  className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 text-sm custom-scrollbar"
                                  rows="3"
                                />
                              </div>
                              <button
                                onClick={handleAddComment}
                                disabled={!commentText.trim()}
                                className="sm:self-end px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium shadow-lg shadow-indigo-500/25"
                              >
                                <Send size={16} />
                                <span className="hidden sm:inline">Kirim</span>
                              </button>
                            </div>
                            
                            {taggedSubtask && (
                              <div className="flex items-center justify-between gap-2 mt-3 p-3 bg-indigo-50 rounded-xl">
                                <span className="text-sm text-indigo-700 font-medium">
                                  Menandai subtask: <strong>{taggedSubtask.subtask_title}</strong>
                                </span>
                                <button
                                  onClick={handleCancelTag}
                                  className="text-indigo-500 hover:text-indigo-700 text-sm font-medium"
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
                <div className="text-center py-10">
                  <p className="text-red-500 font-medium">
                    Gagal memuat detail kartu.
                  </p>
                </div>
              )}
            </div>

            {/* Right Sidebar - Card Details */}
            {card && (
              <div className={`w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-200 bg-gray-50 p-4 sm:p-6 space-y-4 text-sm overflow-y-auto custom-scrollbar ${
                showDetails ? 'block' : 'hidden lg:block'
              }`}>
                <h3 className="font-semibold text-gray-700 text-lg mb-4">Details</h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-500 text-xs font-medium mb-1">Assignee</p>
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      <p className="font-medium text-gray-800">
                        {card.assignments
                          ?.map((a) => a.user?.full_name)
                          .join(", ") || "—"}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-gray-500 text-xs font-medium mb-1">Priority</p>
                    <p className="font-medium text-gray-800 capitalize">{card.priority}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-500 text-xs font-medium mb-1">Due Date</p>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-400" />
                      <p className="font-medium text-gray-800">{card.due_date || "—"}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-gray-500 text-xs font-medium mb-1">Status</p>
                    <p className="font-medium text-gray-800 capitalize">{card.status}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-500 text-xs font-medium mb-1">Estimasi</p>
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-gray-400" />
                      <p className="font-medium text-gray-800">
                        {card.estimated_hours || 0} jam
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modals */}
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