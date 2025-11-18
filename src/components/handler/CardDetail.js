import { useState, useEffect, useRef } from "react";
import { apiFetch } from "./../../Server";
import { socket } from "./../../socket";
import { useParams } from "react-router-dom";
import { useAlert } from "../AlertContext";

export const useCardItemLeader = (card, onCardDeleted) => {
  const { showAlert } = useAlert();
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("comments");
  const [showBlockerModal, setShowBlockerModal] = useState(false);
  const [solutionText, setSolutionText] = useState("");
  const [editingField, setEditingField] = useState(null);
  const [members, setMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  
  // New states for comment features
  const [replyingTo, setReplyingTo] = useState(null);
  const [taggedSubtask, setTaggedSubtask] = useState(null);
  const [showSubtaskSuggestions, setShowSubtaskSuggestions] = useState(false);
  const [subtaskSuggestions, setSubtaskSuggestions] = useState([]);
  const [selectedSubtaskId, setSelectedSubtaskId] = useState(null);
  
  // New state for rejection mode
  const [rejectingSubtask, setRejectingSubtask] = useState(null);
  
  // New state for delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const inputRefs = useRef({});
  const commentsContainerRef = useRef(null);
  const commentInputRef = useRef(null);
  const { board_id } = useParams();

  // === FETCH DETAIL CARD ===
  const handleOpen = async () => {
    setOpen(true);
    setLoading(true);
    try {
      const data = await apiFetch(`/card/${card.card_id}/detail`);
      setDetail(data);

      // 🔥 Ambil data user yang sedang login (role, id)
      const me = await apiFetch(`/auth/auth/me`);
      setCurrentUser(me);

      // Fetch comments when opening card
      const commentsData = await apiFetch(`/comment/card/${card.card_id}`);
      setComments(commentsData || []);
    } catch (err) {
      console.error("❌ Gagal ambil detail card:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setDetail(null);
    setEditingField(null);
    setComments([]);
    setCommentText("");
    setReplyingTo(null);
    setTaggedSubtask(null);
    setRejectingSubtask(null);
    setSelectedSubtaskId(null);
    setShowDeleteModal(false);
  };

  // === DELETE CARD ===
  const handleDeleteCard = async () => {
    if (!detail) return;
    
    setProcessing(true);
    try {
      console.log("🗑️ Menghapus card dengan ID:", detail.card_id);
      
      // Kirim socket event sebelum menghapus (optional, untuk real-time notification)
      socket.emit("card_deleting", {
        card_id: detail.card_id,
        board_id: board_id,
        card_title: detail.card_title
      });

      await apiFetch(`/card/card/${detail.card_id}`, {
        method: "DELETE",
      });

      console.log("✅ Card berhasil dihapus dari database");
      
      // Kirim socket event setelah berhasil menghapus
      socket.emit("card_deleted", {
        card_id: detail.card_id,
        board_id: board_id,
        card_title: detail.card_title,
        type: "delete_card",
        message: `Card "${detail.card_title}" telah dihapus`
      });

      showAlert("🗑️ Card berhasil dihapus!");

      // Panggil callback untuk update parent component
      if (onCardDeleted) {
        console.log("🔄 Memanggil onCardDeleted dengan ID:", detail.card_id);
        onCardDeleted(detail.card_id);
      }
      
      // Tutup modal
      handleClose();
      
    } catch (err) {
      console.error("❌ Gagal menghapus card:", err);
      showAlert("Gagal menghapus card.");
    } finally {
      setProcessing(false);
      setShowDeleteModal(false);
    }
  };

  const handleSubtaskAction = async (subtask_id, action) => {
    if (!detail) return;
    
    if (action === "reject") {
      // Masuk ke mode rejection
      const subtask = detail.subtasks.find(s => s.subtask_id === subtask_id);
      if (subtask) {
        setRejectingSubtask(subtask);
        setActiveTab("comments");
        setCommentText(`#${subtask.subtask_title} `);
        setTaggedSubtask(subtask);
        
        // Focus ke input komentar
        setTimeout(() => {
          commentInputRef.current?.focus();
        }, 100);
      }
      return;
    }
    
    // Untuk approve, langsung proses
    setProcessing(true);
    try {
      await apiFetch(`/subtask/review-subtask`, {
        method: "PUT",
        body: JSON.stringify({
          subtask_id,
          status: action === "approve" ? "approved" : "rejected",
        }),
      });

      // 🔄 Refresh detail card (agar status subtask langsung berubah)
      const updated = await apiFetch(`/card/${detail.card_id}/detail`);
      setDetail(updated);
      
      if (action === "approve") {
        showAlert("✅ Subtask berhasil di-approve!");
      }
    } catch (err) {
      console.error("❌ Gagal update subtask:", err);
    } finally {
      setProcessing(false);
    }
  };

  // === HANDLE FINALIZE REJECTION ===
  const handleFinalizeRejection = async () => {
    if (!rejectingSubtask || !commentText.trim()) return;
    
    setProcessing(true);
    try {
      // 1. Update status subtask menjadi rejected
      await apiFetch(`/subtask/review-subtask`, {
        method: "PUT",
        body: JSON.stringify({
          subtask_id: rejectingSubtask.subtask_id,
          status: "rejected",
        }),
      });

      const commentData = {
        card_id: detail.card_id,
        user_id: currentUser?.user_id,
        subtask_id: rejectingSubtask.subtask_id,
        reason: commentText
      };

      await apiFetch("/comment/reject", {
        method: "POST",
        body: JSON.stringify(commentData),
      });

      // 3. Refresh data card
      const updatedCard = await apiFetch(`/card/${detail.card_id}/detail`);
      setDetail(updatedCard);
      
      // 4. Refresh comments
      const updatedComments = await apiFetch(`/comment/card/${detail.card_id}`);
      setComments(updatedComments || []);
      
      // 5. Reset state
      setCommentText("");
      setRejectingSubtask(null);
      setTaggedSubtask(null);
      setSelectedSubtaskId(rejectingSubtask.subtask_id);
      
      showAlert("❌ Subtask berhasil ditolak!");
    } catch (err) {
      console.error("❌ Gagal reject subtask:", err);
      showAlert("Gagal menolak subtask.");
    } finally {
      setProcessing(false);
    }
  };

  // === CANCEL REJECTION ===
  const handleCancelRejection = () => {
    setRejectingSubtask(null);
    setCommentText("");
    setTaggedSubtask(null);
  };

  // === PATCH CARD ===
  const updateCardField = async (field, value) => {
    if (!detail) return;
    try {
      const payload = { [field]: value };
      await apiFetch(`/card/${detail.card_id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setDetail((prev) => ({ ...prev, [field]: value }));
    } catch (err) {
      console.error("❌ Gagal update card:", err);
    }
  };

  // === UPDATE ASSIGNEE ===
  const updateAssignee = async (user_id, full_name) => {
    try {
      // 🟢 Update tampilan langsung (sebelum API)
      setDetail((prev) => ({
        ...prev,
        assignments: [
          {
            user: { full_name: full_name || "—", user_id },
          },
        ],
      }));

      // 🔹 Kirim ke server
      await apiFetch(`/card/${detail.card_id}/assign`, {
        method: "PATCH",
        body: JSON.stringify({ user_id }),
      });
    } catch (err) {
      console.error("❌ Gagal update assignee:", err);
    }
  };

  // === FETCH MEMBER PROJECT ===
  const fetchMembers = async (project_id) => {
    try {
      const res = await apiFetch(`/card/board/${board_id}/members`);
      console.log("📦 Data member:", res);
      // karena struktur { data: [...] }
      setMembers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("❌ Gagal ambil member:", err);
      setMembers([]); // fallback biar aman
    }
  };

  const handleSolveCardBlocker = async () => {
    const blocker = detail.card_blockers.find((b) => !b.is_resolved);
    if (!blocker) return;

    setProcessing(true);
    try {
      await apiFetch(`/solve-blocker/solve`, {
        method: "PATCH",
        body: JSON.stringify({
          type: "card",
          blocker_id: blocker.blocker_id,
          solution: solutionText,
          card_id: detail.card_id,
          board_id: detail.board_id || null,
        }),
      });

      setDetail((prev) => ({
        ...prev,
        card_blockers: prev.card_blockers.map((b) =>
          b.blocker_id === blocker.blocker_id ? { ...b, is_resolved: true } : b
        ),
      }));

      setShowBlockerModal(false);
      setSolutionText("");
    } catch (err) {
      console.error("❌ Gagal menyelesaikan blocker:", err);
    } finally {
      setProcessing(false);
    }
  };

  const handleAction = async (type) => {
    if (!detail) return;
    setProcessing(true);
    try {
      const endpoint =
        type === "approve"
          ? `/card/${detail.card_id}/approve`
          : `/card/${detail.card_id}/revise`;
      await apiFetch(endpoint, { method: "POST" });
      showAlert(
        type === "approve"
          ? "✅ Card berhasil di-approve!"
          : "🔁 Card dikembalikan untuk revisi!"
      );
      setDetail((prev) => ({
        ...prev,
        status: type === "approve" ? "done" : "in_progress",
      }));
      setOpen(false);
    } catch (err) {
      console.error(`❌ Gagal ${type} card:`, err);
    } finally {
      setProcessing(false);
    }
  };

  // === SUBTASK SUGGESTIONS HANDLER ===
  useEffect(() => {
    if (!commentText.includes('#') || !detail?.subtasks || rejectingSubtask) {
      setShowSubtaskSuggestions(false);
      return;
    }

    const lastHashIndex = commentText.lastIndexOf('#');
    const searchText = commentText.slice(lastHashIndex + 1).toLowerCase();
    
    if (searchText.length === 0) {
      setSubtaskSuggestions(detail.subtasks || []);
      setShowSubtaskSuggestions(true);
    } else {
      const filtered = detail.subtasks.filter(subtask =>
        subtask.subtask_title.toLowerCase().includes(searchText)
      );
      setSubtaskSuggestions(filtered);
      setShowSubtaskSuggestions(filtered.length > 0);
    }
  }, [commentText, detail?.subtasks, rejectingSubtask]);

  // === COMMENT HANDLERS ===
  const handleTagSubtask = (subtask) => {
    const lastHashIndex = commentText.lastIndexOf('#');
    const beforeHash = commentText.slice(0, lastHashIndex);
    const newCommentText = `${beforeHash}#${subtask.subtask_title} `;
    
    setCommentText(newCommentText);
    setTaggedSubtask(subtask);
    setShowSubtaskSuggestions(false);
  };

  const handleReplyComment = (commentId, userName) => {
    setReplyingTo({ commentId, userName });
    setCommentText(`@${userName} `);
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    
    // Jika dalam mode rejection, gunakan handleFinalizeRejection
    if (rejectingSubtask) {
      handleFinalizeRejection();
      return;
    }
    
    try {
      const commentData = {
        card_id: detail.card_id,
        user_id: currentUser?.user_id,
        comment_text: commentText,
        parent_comment_id: replyingTo?.commentId || null,
        tagged_subtask_id: taggedSubtask?.subtask_id || null
      };

      await apiFetch("/comment", {
        method: "POST",
        body: JSON.stringify(commentData),
      });
      
      // Reset form
      setCommentText("");
      setReplyingTo(null);
      setTaggedSubtask(null);
      setShowSubtaskSuggestions(false);
      
    } catch (err) {
      console.error("❌ Gagal menambahkan komentar:", err);
      showAlert("Gagal menambahkan komentar.");
    }
  };

  const handleEditComment = async (comment_id, newText) => {
    try {
      await apiFetch(`/comment/${comment_id}`, {
        method: "PUT",
        body: JSON.stringify({ comment_text: newText }),
      });
    } catch (err) {
      console.error("❌ Gagal mengubah komentar:", err);
    }
  };

  const handleDeleteComment = async (comment_id) => {
    if (!confirm("Hapus komentar ini?")) return;
    try {
      // Optimistic update
      setComments((prev) => prev.filter((c) => c.comment_id !== comment_id));
      
      await apiFetch(`/comment/${comment_id}`, { method: "DELETE" });
      
      // PERBAIKAN: Gunakan nama event yang konsisten
      socket.emit("comment:deleted", { 
        comment_id, 
        card_id: detail.card_id 
      });
      
      showAlert("🗑️ Komentar berhasil dihapus!");
      
    } catch (err) {
      console.error("❌ Gagal menghapus komentar:", err);
      
      // Rollback optimistic update jika error
      try {
        const updatedComments = await apiFetch(`/comment/card/${detail.card_id}`);
        setComments(updatedComments || []);
      } catch (refetchErr) {
        console.error("❌ Gagal refresh komentar:", refetchErr);
      }
      showAlert("Terjadi error saat menghapus komentar.");
    }
  };

  // === HANDLE OUTSIDE CLICK (untuk submit otomatis) ===
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (editingField) {
        const ref = inputRefs.current[editingField];
        if (ref && !ref.contains(e.target)) {
          const newValue = ref.querySelector("input, textarea, select")?.value;
          if (newValue !== undefined && newValue !== detail?.[editingField]) {
            updateCardField(editingField, newValue);
          }
          setEditingField(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [editingField, detail]);

  // === SOCKET EFFECT - DIPERBAIKI UNTUK KONSISTENSI ===
  useEffect(() => {
    if (!detail) return;

    socket.emit("join_card", detail.card_id);
    socket.emit("join_board", board_id);
    socket.emit("join_card_comments", detail.card_id);

    // Existing socket events untuk card dan subtask
    socket.on("subtask_status_changed", ({ subtask_id, status }) => {
      setDetail((prev) => ({
        ...prev,
        subtasks: prev.subtasks?.map((s) =>
          s.subtask_id === subtask_id ? { ...s, status } : s
        ),
      }));
    });

    socket.on("subtask_added", (newSubtask) => {
      setDetail((prev) => ({
        ...prev,
        subtasks: [
          ...(prev.subtasks || []).filter(
            (s) => s.subtask_id !== newSubtask.subtask_id
          ),
          newSubtask,
        ],
      }));
    });

    socket.on("subtask_assigned", (updatedSubtask) => {
      setDetail((prev) => {
        if (!prev?.subtasks) return prev;
        const newSubs = prev.subtasks.map((s) =>
          s.subtask_id === updatedSubtask.subtask_id
            ? { ...s, ...updatedSubtask }
            : s
        );
        return { ...prev, subtasks: newSubs };
      });
    });

    // Blocker events
    socket.on("blocker_reported", (blocker) => {
      console.log("🚨 [SOCKET] Blocker dilaporkan:", blocker);
      setDetail((prev) => {
        if (!prev?.subtasks) return prev;
        if (blocker.type === "subtask") {
          const updated = prev.subtasks.map((s) => {
            if (s.subtask_id === blocker.subtask_id) {
              const blockers = [...(s.subtask_blockers || []), {
                blocker_id: blocker.blocker_id,
                blocker_reason: blocker.blocker_reason,
                is_resolved: false,
                created_at: blocker.created_at,
              }];
              return { ...s, subtask_blockers: blockers };
            }
            return s;
          });
          return { ...prev, subtasks: updated };
        }
        return prev;
      });
    });

    socket.on("blocker_solved", (blocker) => {
      console.log("✅ [SOCKET] Blocker diselesaikan:", blocker);
      setDetail((prev) => {
        if (!prev?.subtasks) return prev;
        if (blocker.type === "subtask") {
          const updated = prev.subtasks.map((s) => {
            if (s.subtask_id === blocker.subtask_id) {
              const blockers = (s.subtask_blockers || []).map((b) =>
                b.blocker_id === blocker.blocker_id
                  ? { ...b, is_resolved: true, solution: blocker.solution }
                  : b
              );
              return { ...s, subtask_blockers: blockers };
            }
            return s;
          });
          return { ...prev, subtasks: updated };
        }
        return prev;
      });
    });

    // Card deleted event - dari server
    socket.on("card_deleted", (data) => {
      console.log("🗑️ [SOCKET] card_deleted received:", data);
      const { card_id, board_id: eventBoardId } = data;
      
      if (card_id === detail.card_id && String(eventBoardId) === String(board_id)) {
        console.log("🔄 Card ini dihapus oleh user lain, menutup modal...");
        showAlert("🗑️ Card telah dihapus!");
        handleClose();
        if (onCardDeleted) {
          onCardDeleted(card_id);
        }
      }
    });

    // =====================================================
    // 🗣️ COMMENT SOCKET EVENTS - DIPERBAIKI UNTUK KONSISTENSI
    // =====================================================
    
    socket.on("comment:new", (newComment) => {
      console.log("📨 [SOCKET] comment:new received:", newComment);
      if (newComment.card_id !== detail.card_id) return;
      
      setComments(prev => {
        // Cegah duplikasi komentar
        if (prev.find(c => c.comment_id === newComment.comment_id)) {
          return prev;
        }
        return [...prev, newComment];
      });
    });

    socket.on("comment:updated", (updatedComment) => {
      console.log("✏️ [SOCKET] comment:updated received:", updatedComment);
      if (updatedComment.card_id !== detail.card_id) return;
      
      setComments(prev =>
        prev.map((comment) => 
          comment.comment_id === updatedComment.comment_id ? updatedComment : comment
        )
      );
    });

    // PERBAIKAN: Handler untuk kedua event delete (konsisten dengan useCardHandlers)
    socket.on("comment:deleted", (deletedData) => {
      console.log("🗑️ [SOCKET] comment:deleted received:", deletedData);
      const { comment_id, card_id } = deletedData;
      
      if (card_id === detail.card_id) {
        setComments(prev => 
          prev.filter((c) => c.comment_id !== comment_id)
        );
      }
    });

    socket.on("comment_deleted", (deletedData) => {
      console.log("🗑️ [SOCKET] comment_deleted received:", deletedData);
      const { comment_id, card_id } = deletedData;
      
      if (card_id === detail.card_id) {
        setComments(prev => 
          prev.filter((c) => c.comment_id !== comment_id)
        );
      }
    });

    socket.on("comment:reject", (rejectComment) => {
      console.log("❌ [SOCKET] comment:reject received:", rejectComment);
      if (rejectComment.card_id !== detail.card_id) return;
      
      setComments((prev) => {
        // Cegah duplikasi
        if (prev.find(c => c.comment_id === rejectComment.comment_id)) {
          return prev;
        }
        return [...prev, rejectComment];
      });
      
      setActiveTab("comments");
      if (rejectComment.subtask_id) {
        setSelectedSubtaskId(rejectComment.subtask_id);
      }
      
      showAlert(`❌ Subtask ditolak: buka tab komentar untuk alasan.`);
    });

    // Event untuk typing indicator (opsional, untuk konsistensi)
    socket.on("comment_typing", ({ user_id, user_name, card_id, is_typing }) => {
      if (card_id === detail.card_id && user_id !== currentUser?.user_id) {
        console.log(`👤 ${user_name} is ${is_typing ? 'typing' : 'not typing'}`);
        // Bisa ditambahkan state untuk typing indicator jika diperlukan
      }
    });

    socket.on("card_status_changed", () => {
      // Kalau board ingin langsung update tanpa refresh
      // if (typeof fetchCards === "function") fetchCards();
    });

    return () => {
      socket.emit("leave_card", detail.card_id);
      socket.emit("leave_board", board_id);
      socket.emit("leave_card_comments", detail.card_id);
      
      // PERBAIKAN: Cleanup semua event listeners dengan tepat dan konsisten
      const events = [
        "subtask_status_changed", "subtask_added", "subtask_assigned",
        "blocker_reported", "blocker_solved", "card_deleted",
        "comment:new", "comment:updated", "comment:deleted", 
        "comment_deleted", "comment:reject", "comment_typing", 
        "card_status_changed",
      ];
      
      events.forEach(event => socket.off(event));
    };
  }, [detail, board_id, currentUser?.user_id, onCardDeleted]);

  // Auto scroll comments when new comment added
  useEffect(() => {
    if (commentsContainerRef.current) {
      commentsContainerRef.current.scrollTop = commentsContainerRef.current.scrollHeight;
    }
  }, [comments]);

  // Derived values
  const allSubtasksDone = detail?.subtasks?.length
    ? detail.subtasks.every((s) => s.status === "done")
    : false;

  return {
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
    
    // New comment states
    replyingTo,
    taggedSubtask,
    showSubtaskSuggestions,
    subtaskSuggestions,
    selectedSubtaskId,
    rejectingSubtask,
    
    // Delete modal state
    showDeleteModal,
    
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
    
    // Comment handlers
    setComments,
    setCommentText,
    handleAddComment,
    handleEditComment,
    handleDeleteComment,
    
    // New comment handlers
    setReplyingTo,
    setTaggedSubtask,
    setShowSubtaskSuggestions,
    handleTagSubtask,
    handleReplyComment,
    setSelectedSubtaskId,
    
    // Rejection handlers
    handleFinalizeRejection,
    handleCancelRejection,
    
    // Delete handlers
    handleDeleteCard,
    setShowDeleteModal,
    
    // Derived values
    allSubtasksDone
  };
};