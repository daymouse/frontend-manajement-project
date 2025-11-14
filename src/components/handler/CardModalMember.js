import { useState, useEffect } from "react";
import { apiFetch } from "../../Server";
import { socket } from "../../socket";

export default function useCardHandlers(cardId, commentInputRef) {
  const [card, setCard] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [editingSubtaskId, setEditingSubtaskId] = useState(null);
  const [contributors, setContributors] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("comments");
  const [targetType, setTargetType] = useState(null);
  const [targetId, setTargetId] = useState(null);
  const [solveBlockerId, setSolveBlockerId] = useState(null);
  const [selectedSubtaskId, setSelectedSubtaskId] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showSolveModal, setShowSolveModal] = useState(false);

  // New states for comment features
  const [replyingTo, setReplyingTo] = useState(null);
  const [taggedSubtask, setTaggedSubtask] = useState(null);
  const [showSubtaskSuggestions, setShowSubtaskSuggestions] = useState(false);
  const [subtaskSuggestions, setSubtaskSuggestions] = useState([]);

  const openReportModal = (type, id) => {
    setTargetType(type);
    setTargetId(id);
    setShowReportModal(true);
  };

  const openSolveModal = (id) => {
    setSolveBlockerId(id);
    setShowSolveModal(true);
  };

  /* =====================================================
     🧩 FETCH USER LOGIN
  ===================================================== */
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const me = await apiFetch("/auth/auth/me");
        setCurrentUser(me);
      } catch (err) {
        console.error("❌ Gagal memuat user login:", err);
      }
    };
    fetchUser();
  }, []);

  /* =====================================================
     🧩 FETCH CARD DETAIL
  ===================================================== */
  useEffect(() => {
    if (!cardId) return;
    setLoading(true);
    const load = async () => {
      try {
        const data = await apiFetch(`/card/${cardId}/detail`);
        setCard(data);
      } catch (err) {
        console.error("❌ Gagal memuat data card:", err);
        setCard(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [cardId]);

  // =====================================================
  // 🧩 FETCH COMMENTS
  // =====================================================
  useEffect(() => {
    if (!cardId) return;

    const fetchComments = async () => {
      try {
        const data = await apiFetch(`/comment/card/${cardId}`);
        setComments(data || []);
      } catch (err) {
        console.error("❌ Gagal memuat komentar:", err);
        setComments([]);
      }
    };

    fetchComments();
  }, [cardId]);

  /* =====================================================
     🧩 FETCH CONTRIBUTORS
  ===================================================== */
  useEffect(() => {
    if (!cardId) return;
    const fetchContributors = async () => {
      try {
        const res = await apiFetch(`/subtask/${cardId}/task-contributors`);
        setContributors(res?.data || res || []);
      } catch (err) {
        console.error("❌ Gagal memuat contributors:", err);
        setContributors([]);
      }
    };
    fetchContributors();
  }, [cardId]);

  const ownerCard = card?.assignments?.map((a) => a.user?.user_id) || [];
  const isOwner = ownerCard.includes(currentUser?.user_id);

  /* =====================================================
     ⚡ SOCKET.IO INTEGRASI - COMMENT FEATURES
  ===================================================== */
  useEffect(() => {
    if (!cardId) return;

    socket.emit("join_card", cardId);
    socket.emit("join_card_comments", cardId);

    // Existing socket events
    socket.on("subtask_status_changed", ({ subtask_id, status }) => {
      setCard((prev) => ({
        ...prev,
        subtasks: prev.subtasks?.map((s) =>
          s.subtask_id === subtask_id ? { ...s, status } : s
        ),
      }));
    });

    socket.on("subtask_added", (newSubtask) => {
      setCard((prev) => ({
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
      setCard((prev) => {
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
      setCard((prev) => {
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
      setCard((prev) => {
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

    // Comment events
    socket.on("comment:new", (newComment) => {
      setComments((prev) => [...prev, newComment]);
      
      // Notify user if they are mentioned in a subtask
      if (newComment.tagged_subtask_id && 
          card?.subtasks?.find(s => s.subtask_id === newComment.tagged_subtask_id)?.assigned_to === currentUser?.user_id) {
        alert(`💬 Anda disebutkan dalam komentar untuk subtask: ${newComment.tagged_subtask?.subtask_title}`);
      }
    });

    socket.on("comment:updated", (updated) => {
      setComments((prev) =>
        prev.map((c) => (c.comment_id === updated.comment_id ? updated : c))
      );
    });

    socket.on("comment:deleted", ({ comment_id }) => {
      setComments((prev) => prev.filter((c) => c.comment_id !== comment_id));
    });

    socket.on("comment:reject", (rejectComment) => {
      setComments((prev) => [...prev, rejectComment]);
      setActiveTab("comments");
      if (rejectComment.subtask_id) {
        setSelectedSubtaskId(rejectComment.subtask_id);
      }
      alert(`❌ Subtask #${rejectComment.subtask_id} ditolak: buka tab komentar untuk alasan.`);
    });

    return () => {
      socket.emit("leave_card", cardId);
      socket.emit("leave_card_comments", cardId);
      socket.off("subtask_status_changed");
      socket.off("subtask_added");
      socket.off("subtask_assigned");
      socket.off("blocker_reported");
      socket.off("blocker_solved");
      socket.off("comment:new");
      socket.off("comment:updated");
      socket.off("comment:deleted");
      socket.off("comment_typing");
      socket.off("comment:reject");
    };
  }, [cardId, card?.subtasks, currentUser?.user_id]);

  /* =====================================================
     🔍 SUBTASK SUGGESTIONS HANDLER
  ===================================================== */
  useEffect(() => {
    if (!commentText.includes('#') || !card?.subtasks) {
      setShowSubtaskSuggestions(false);
      return;
    }

    const lastHashIndex = commentText.lastIndexOf('#');
    const searchText = commentText.slice(lastHashIndex + 1).toLowerCase();
    
    if (searchText.length === 0) {
      setSubtaskSuggestions(card.subtasks || []);
      setShowSubtaskSuggestions(true);
    } else {
      const filtered = card.subtasks.filter(subtask =>
        subtask.subtask_title.toLowerCase().includes(searchText)
      );
      setSubtaskSuggestions(filtered);
      setShowSubtaskSuggestions(filtered.length > 0);
    }
  }, [commentText, card?.subtasks]);

  /* =====================================================
   💬 COMMENT HANDLERS - ENHANCED
  ===================================================== */

  const handleTagSubtask = (subtask) => {
    const lastHashIndex = commentText.lastIndexOf('#');
    const beforeHash = commentText.slice(0, lastHashIndex);
    const newCommentText = `${beforeHash}#${subtask.subtask_title} `;
    
    setCommentText(newCommentText);
    setTaggedSubtask(subtask);
    setShowSubtaskSuggestions(false);
    
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  };

  const handleReplyComment = (commentId, userName) => {
    setReplyingTo({ commentId, userName });
    setCommentText(`@${userName} `);
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    
    try {
      const commentData = {
        card_id: cardId,
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
      alert("Gagal menambahkan komentar.");
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
      await apiFetch(`/comment/${comment_id}`, { method: "DELETE" });
    } catch (err) {
      console.error("❌ Gagal menghapus komentar:", err);
    }
  };

  /* =====================================================
     🧩 EXISTING HANDLERS (tetap sama)
  ===================================================== */

  const handleAddSubtask = async (formData) => {
    try {
      await apiFetch(`/subtask/cards/${cardId}/subtasks`, {
        method: "POST",
        body: JSON.stringify(formData),
      });
      setShowForm(false);
    } catch (err) {
      console.error("❌ Gagal menambah subtask:", err);
      alert(err.message || "Gagal menambah subtask");
    }
  };

  const handleStartWork = async (subtaskId) => {
    const subtask = card?.subtasks?.find((s) => s.subtask_id === subtaskId);
    if (!subtask || subtask.assigned_to !== currentUser?.user_id) {
      alert("Anda bukan assignee subtask ini!");
      return;
    }

    setProcessingId(subtaskId);
    try {
      await apiFetch(`/time/time-logs`, {
        method: "POST",
        body: JSON.stringify({
          card_id: cardId,
          subtask_id: subtaskId,
          description: "Mulai mengerjakan subtask",
        }),
      });
      setCard((p) => ({
        ...p,
        subtasks: p.subtasks.map((s) =>
          s.subtask_id === subtaskId ? { ...s, status: "in_progress" } : s
        ),
      }));
      alert("⏱ Log waktu mulai disimpan!");
    } catch (err) {
      console.error("❌ Gagal memulai subtask:", err);
      alert(err.message || "Gagal memulai subtask.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleAssignSubtask = async (subtaskId, userId) => {
    try {
      await apiFetch(`/subtask/assign`, {
        method: "PUT",
        body: JSON.stringify({
          subtask_id: subtaskId,
          assignee_id: userId,
          socket_id: socket.id,
        }),
      });
      setEditingSubtaskId(null);
    } catch (err) {
      console.error("❌ Gagal mengubah assignee:", err);
      alert(err.message || "Gagal mengubah penugasan subtask.");
    }
  };

  const handleFinishWork = async (subtaskId) => {
    const subtask = card?.subtasks?.find((s) => s.subtask_id === subtaskId);
    if (!subtask || subtask.assigned_to !== currentUser?.user_id) {
      alert("Anda bukan assignee subtask ini!");
      return;
    }

    setProcessingId(subtaskId);
    try {
      await apiFetch(`/time/time-logs/end`, {
        method: "PUT",
        body: JSON.stringify({
          card_id: cardId,
          subtask_id: subtaskId,
          description: "Menyelesaikan subtask",
        }),
      });
      setCard((p) => ({
        ...p,
        subtasks: p.subtasks.map((s) =>
          s.subtask_id === subtaskId ? { ...s, status: "review" } : s
        ),
      }));
      alert("📤 Subtask dikirim untuk review!");
    } catch (err) {
      console.error("❌ Gagal menyelesaikan subtask:", err);
      alert(err.message || "Gagal menyelesaikan subtask.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReviewSubtask = async (subtaskId, action) => {
    if (!isOwner) {
      alert("Hanya Task Owner yang bisa melakukan review!");
      return;
    }

    if (
      !confirm(
        `Yakin ingin ${
          action === "approved" ? "menyetujui" : "menolak"
        } subtask ini?`
      )
    )
      return;

    setProcessingId(subtaskId);
    try {
      await apiFetch(`/subtask/review-subtask`, {
        method: "PUT",
        body: JSON.stringify({
          subtask_id: subtaskId,
          status: action,
        }),
      });

      setCard((p) => ({
        ...p,
        subtasks: p.subtasks.map((s) =>
          s.subtask_id === subtaskId
            ? { ...s, status: action === "approved" ? "done" : "in_progress" }
            : s
        ),
      }));
      alert(
        action === "approved"
          ? "✅ Subtask disetujui!"
          : "❌ Subtask ditolak!"
      );
    } catch (err) {
      console.error("❌ Gagal review subtask:", err);
      alert(err.message || "Gagal mereview subtask.");
    } finally {
      setProcessingId(null);
    }
  };

  /* =====================================================
     🧱 BLOCKER HANDLERS
  ===================================================== */

  const handleReportBlocker = async ({ type, id, reason, board_id }) => {
    try {
      const res = await apiFetch(`/blocker/report`, {
        method: "POST",
        body: JSON.stringify({
          type,
          id,
          reason,
          board_id,
          card_id: cardId,
        }),
      });
      alert("🚨 Blocker berhasil dilaporkan!");
      console.log("📡 Blocker reported:", res.data);
    } catch (err) {
      console.error("❌ Gagal melaporkan blocker:", err);
      alert(err.message || "Gagal melaporkan blocker.");
    }
  };

  const handleSolveBlocker = async ({ type, blocker_id, solution, board_id }) => {
    try {
      const res = await apiFetch(`/blocker/solve`, {
        method: "PATCH",
        body: JSON.stringify({
          type,
          blocker_id,
          solution,
          board_id,
          card_id: cardId,
        }),
      });
      alert("✅ Blocker berhasil diselesaikan!");
      console.log("📡 Blocker solved:", res.data);
    } catch (err) {
      console.error("❌ Gagal menyelesaikan blocker:", err);
      alert(err.message || "Gagal menyelesaikan blocker.");
    }
  };

  return {
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
    handleReportBlocker,
    handleSolveBlocker,
    openSolveModal,
    openReportModal,
    showReportModal,
    setShowReportModal,
    showSolveModal,
    setShowSolveModal,
    targetType,
    targetId,
    solveBlockerId,
    setSolveBlockerId,
    comments,
    setComments,
    commentText,
    setCommentText,
    handleAddComment,
    handleEditComment,
    handleDeleteComment,
    // New comment features
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
    setSelectedSubtaskId,
  };
}