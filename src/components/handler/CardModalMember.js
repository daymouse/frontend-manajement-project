import { useState, useEffect } from "react";
import { apiFetch } from "../../Server";
import { socket } from "../../socket";
import { useAlert } from "../AlertContext"; 

export default function useCardHandlers(cardId, commentInputRef) {
  const { showAlert } = useAlert();
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

  // New states for inline editing
  const [editingField, setEditingField] = useState(null);
  const [editingValue, setEditingValue] = useState("");

  // New states for time tracking
  const [activeTimeLogs, setActiveTimeLogs] = useState({});

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

  /* =====================================================
     🧩 FETCH COMMENTS
  ===================================================== */
  useEffect(() => {
    if (!cardId) return;

    const fetchComments = async () => {
      try {
        const data = await apiFetch(`/comment/card/${cardId}`);
        console.log("📝 Raw comments data:", data);
        
        if (Array.isArray(data)) {
          setComments(data);
        } else {
          setComments([]);
        }
      } catch (err) {
        console.error("❌ Gagal memuat komentar:", err);
        setComments([]);
      }
    };

    fetchComments();
  }, [cardId]);

  /* =====================================================
     🧩 FETCH ACTIVE TIME LOGS - FIXED VERSION
  ===================================================== */
  useEffect(() => {
    if (!cardId || !currentUser?.user_id) return;

    const fetchActiveTimeLogs = async () => {
      try {
        // Gunakan endpoint yang benar atau ambil dari card data
        // Sementara kita akan ambil dari card detail yang sudah ada
        if (card?.subtasks) {
          const activeLogsMap = {};
          card.subtasks.forEach(subtask => {
            if (subtask.status === "in_progress" && subtask.assigned_to === currentUser.user_id) {
              activeLogsMap[subtask.subtask_id] = {
                subtask_id: subtask.subtask_id,
                start_time: new Date().toISOString(), // Ini sementara, nanti bisa diambil dari API khusus
                user_id: currentUser.user_id
              };
            }
          });
          setActiveTimeLogs(activeLogsMap);
        }
      } catch (err) {
        console.error("❌ Gagal memuat active time logs:", err);
        // Jangan tampilkan error ke user, karena ini optional
      }
    };

    fetchActiveTimeLogs();
  }, [cardId, currentUser?.user_id, card?.subtasks]);

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
     ⚡ SOCKET.IO INTEGRASI - FIXED VERSION
  ===================================================== */
  useEffect(() => {
    if (!cardId) return;

    socket.emit("join_card", cardId);
    socket.emit("join_card_comments", cardId);

    // Existing socket events untuk card dan subtask
    socket.on("subtask_status_changed", ({ subtask_id, status, type, started_at, ended_at }) => {
      console.log("🔄 [SOCKET] subtask_status_changed:", { subtask_id, status, type });
      
      setCard((prev) => ({
        ...prev,
        subtasks: prev.subtasks?.map((s) =>
          s.subtask_id === subtask_id ? { ...s, status } : s
        ),
      }));

      // Update active time logs berdasarkan type
      if (type === "start") {
        setActiveTimeLogs(prev => ({
          ...prev,
          [subtask_id]: {
            subtask_id,
            start_time: started_at,
            user_id: currentUser?.user_id
          }
        }));
      } else if (type === "end") {
        setActiveTimeLogs(prev => {
          const newLogs = { ...prev };
          delete newLogs[subtask_id];
          return newLogs;
        });
      }
    });

    socket.on("subtask_updated", (updatedSubtask) => {
      setCard((prev) => ({
        ...prev,
        subtasks: prev.subtasks?.map((s) =>
          s.subtask_id === updatedSubtask.subtask_id ? updatedSubtask : s
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

    socket.on("subtask_deleted", ({ subtask_id }) => {
      setCard((prev) => ({
        ...prev,
        subtasks: prev.subtasks?.filter((s) => s.subtask_id !== subtask_id),
      }));
      
      // Hapus dari active time logs juga
      setActiveTimeLogs(prev => {
        const newLogs = { ...prev };
        delete newLogs[subtask_id];
        return newLogs;
      });
    });

    // Blocker events - FIXED: hanya handle untuk card ini
    socket.on("blocker_reported", (blocker) => {
      console.log("🚨 [SOCKET] Blocker dilaporkan:", blocker);
      if (blocker.card_id !== cardId) return;
      
      setCard((prev) => {
        if (!prev) return prev;
        
        // Update card blockers
        if (blocker.type === "card") {
          const updatedBlockers = [...(prev.card_blockers || []), blocker];
          return { ...prev, card_blockers: updatedBlockers };
        }
        
        // Update subtask blockers
        if (blocker.type === "subtask" && prev.subtasks) {
          const updatedSubtasks = prev.subtasks.map((s) => {
            if (s.subtask_id === blocker.subtask_id) {
              const blockers = [...(s.subtask_blockers || []), blocker];
              return { ...s, subtask_blockers: blockers };
            }
            return s;
          });
          return { ...prev, subtasks: updatedSubtasks };
        }
        
        return prev;
      });
    });

    socket.on("blocker_solved", (blocker) => {
      console.log("✅ [SOCKET] Blocker diselesaikan:", blocker);
      if (blocker.card_id !== cardId) return;
      
      setCard((prev) => {
        if (!prev) return prev;
        
        // Update card blockers
        if (blocker.type === "card") {
          const updatedBlockers = (prev.card_blockers || []).map((b) =>
            b.blocker_id === blocker.blocker_id
              ? { ...b, is_resolved: true, solution: blocker.solution }
              : b
          );
          return { ...prev, card_blockers: updatedBlockers };
        }
        
        // Update subtask blockers
        if (blocker.type === "subtask" && prev.subtasks) {
          const updatedSubtasks = prev.subtasks.map((s) => {
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
          return { ...prev, subtasks: updatedSubtasks };
        }
        
        return prev;
      });
    });

    // Card status events - FIXED: hanya untuk card ini
    socket.on("card_status_inProgres", (data) => {
      if (data.card_id === cardId) {
        setCard(prev => ({
          ...prev,
          status: "in_progress"
        }));
      }
    });

    socket.on("card_status_review", (data) => {
      if (data.card_id === cardId) {
        setCard(prev => ({
          ...prev,
          status: "review"
        }));
      }
    });

    socket.on("card_status_done", (data) => {
      if (data.card_id === cardId) {
        setCard(prev => ({
          ...prev,
          status: "done"
        }));
      }
    });

    socket.on("card_status_revisi", (data) => {
      if (data.card_id === cardId) {
        setCard(prev => ({
          ...prev,
          status: "in_progress"
        }));
      }
    });

    // Comment events
    socket.on("comment:new", (newComment) => {
      console.log("📨 [SOCKET] comment:new received:", newComment);
      if (newComment.card_id !== cardId) return;
      
      setComments(prev => {
        if (prev.find(c => c.comment_id === newComment.comment_id)) {
          return prev;
        }
        return [...prev, newComment];
      });
    });

    socket.on("comment:updated", (updatedComment) => {
      console.log("✏️ [SOCKET] comment:updated received:", updatedComment);
      if (updatedComment.card_id !== cardId) return;
      
      setComments(prev =>
        prev.map((comment) => 
          comment.comment_id === updatedComment.comment_id ? updatedComment : comment
        )
      );
    });

    socket.on("comment:deleted", (deletedData) => {
      console.log("🗑️ [SOCKET] comment:deleted received:", deletedData);
      const { comment_id, card_id } = deletedData;
      
      if (card_id === cardId) {
        setComments(prev => 
          prev.filter((c) => c.comment_id !== comment_id)
        );
      }
    });

    socket.on("comment_deleted", (deletedData) => {
      console.log("🗑️ [SOCKET] comment_deleted received:", deletedData);
      const { comment_id, card_id } = deletedData;
      
      if (card_id === cardId) {
        setComments(prev => 
          prev.filter((c) => c.comment_id !== comment_id)
        );
      }
    });

    socket.on("comment:reject", (rejectComment) => {
      console.log("❌ [SOCKET] comment:reject received:", rejectComment);
      if (rejectComment.card_id !== cardId) return;
      
      setComments((prev) => {
        if (prev.find(c => c.comment_id === rejectComment.comment_id)) {
          return prev;
        }
        return [...prev, rejectComment];
      });
      
      setActiveTab("comments");
      if (rejectComment.subtask_id) {
        setSelectedSubtaskId(rejectComment.subtask_id);
      }
    });

    // Event untuk typing indicator
    socket.on("comment_typing", ({ user_id, user_name, card_id, is_typing }) => {
      if (card_id === cardId && user_id !== currentUser?.user_id) {
        console.log(`👤 ${user_name} is ${is_typing ? 'typing' : 'not typing'}`);
      }
    });

    return () => {
      socket.emit("leave_card", cardId);
      socket.emit("leave_card_comments", cardId);
      
      // Cleanup event listeners
      const events = [
        "subtask_status_changed", "subtask_updated", "subtask_added",
        "subtask_assigned", "subtask_deleted", "blocker_reported", 
        "blocker_solved", "comment:new", "comment:updated", 
        "comment:deleted", "comment_deleted", "comment_typing", 
        "comment:reject", "card_status_inProgres", "card_status_review",
        "card_status_done", "card_status_revisi"
      ];
      
      events.forEach(event => socket.off(event));
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
   💬 COMMENT HANDLERS
  ===================================================== */

  const handleTagSubtask = (subtask) => {
    if (!subtask) return;
    
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
    if (!commentId || !userName) return;
    
    setReplyingTo({ 
      commentId, 
      userName 
    });
    setCommentText(`@${userName} `);
    
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  };

  /* =====================================================
     ➕ HANDLE ADD COMMENT
  ===================================================== */
  const handleAddComment = async () => {
    if (!commentText.trim() || !cardId) return;
    
    try {
      const commentData = {
        card_id: cardId,
        user_id: currentUser?.user_id,
        comment_text: commentText,
        parent_comment_id: replyingTo?.commentId || null,
        tagged_subtask_id: taggedSubtask?.subtask_id || null
      };

      // Emit typing stop
      socket.emit("comment_typing", {
        card_id: cardId,
        user_id: currentUser?.user_id,
        is_typing: false
      });

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
    if (!comment_id || !newText) return;
    
    try {
      await apiFetch(`/comment/${comment_id}`, {
        method: "PUT",
        body: JSON.stringify({ comment_text: newText }),
      });
    } catch (err) {
      console.error("❌ Gagal mengubah komentar:", err);
      showAlert("Gagal mengubah komentar.");
    }
  };

  /* =====================================================
     🗑️ HANDLE DELETE COMMENT
  ===================================================== */
  const handleDeleteComment = async (comment_id) => {
    if (!comment_id || !confirm("Hapus komentar ini?")) return;
    
    try {
      // Optimistic update
      const deletedComment = comments.find(c => c.comment_id === comment_id);
      setComments(prev => prev.filter((c) => c.comment_id !== comment_id));
      
      await apiFetch(`/comment/${comment_id}`, { method: "DELETE" });
      
      // Emit socket event hanya ke card room
      socket.emit("comment:deleted", { 
        comment_id, 
        card_id: cardId 
      });
      
      showAlert("🗑️ Komentar berhasil dihapus!");
      
    } catch (err) {
      console.error("❌ Gagal menghapus komentar:", err);
      
      // Rollback optimistic update
      if (deletedComment) {
        setComments(prev => {
          const updated = [...prev, deletedComment];
          return updated.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        });
      }
      
      showAlert("Terjadi error saat menghapus komentar.");
    }
  };

  /* =====================================================
     ✏️ INLINE UPDATE HANDLER
  ===================================================== */
  const handleInlineUpdate = async (subtaskId, field, value) => {
    if (!subtaskId || !field) {
      console.error("❌ Missing subtaskId or field for inline update");
      return;
    }

    setProcessingId(subtaskId);
    
    try {
      const response = await apiFetch(`/subtask/update/${subtaskId}`, {
        method: "PATCH",
        body: JSON.stringify({ [field]: value }),
      });

      // Update local state immediately for better UX
      setCard((prev) => ({
        ...prev,
        subtasks: prev.subtasks?.map((s) =>
          s.subtask_id === subtaskId ? { ...s, [field]: value } : s
        ),
      }));

      // Emit socket event untuk update real-time - HANYA ke card room
      socket.emit("subtask_updated", {
        subtask_id: subtaskId,
        [field]: value,
        updated_at: new Date().toISOString(),
        card_id: cardId
      });

      showAlert(`✅ ${field === 'subtask_title' ? 'Judul' : 'Deskripsi'} subtask berhasil diperbarui!`);
      
    } catch (err) {
      console.error("❌ Gagal update subtask:", err);
      showAlert(`Gagal memperbarui ${field === 'subtask_title' ? 'judul' : 'deskripsi'} subtask.`);
    } finally {
      setProcessingId(null);
      setEditingField(null);
      setEditingValue("");
    }
  };

  /* =====================================================
     🗑️ DELETE SUBTASK HANDLER
  ===================================================== */
  const handleDeleteSubtask = async (subtaskId) => {
    if (!subtaskId || !confirm("Yakin ingin menghapus subtask ini? Tindakan ini tidak dapat dibatalkan.")) return;

    setProcessingId(subtaskId);
    
    try {
      await apiFetch(`/subtask/delete/${subtaskId}`, {
        method: "DELETE",
      });

      // Update local state immediately
      setCard((prev) => ({
        ...prev,
        subtasks: prev.subtasks?.filter((s) => s.subtask_id !== subtaskId),
      }));

      // Emit socket event untuk delete real-time - HANYA ke card room
      socket.emit("subtask_deleted", { 
        subtask_id: subtaskId,
        card_id: cardId
      });

      showAlert("✅ Subtask berhasil dihapus!");

    } catch (err) {
      console.error("❌ Gagal menghapus subtask:", err);
      showAlert("Gagal menghapus subtask. Silakan coba lagi.");
    } finally {
      setProcessingId(null);
    }
  };

  /* =====================================================
     🧩 START EDITING HANDLER (untuk inline editing)
  ===================================================== */
  const startEditing = (subtaskId, field, currentValue) => {
    setEditingField(`${subtaskId}-${field}`);
    setEditingValue(currentValue || "");
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditingValue("");
  };

  const saveEditing = (subtaskId, field) => {
    if (!editingValue.trim()) {
      showAlert(`${field === 'subtask_title' ? 'Judul' : 'Deskripsi'} tidak boleh kosong!`);
      return;
    }
    handleInlineUpdate(subtaskId, field, editingValue.trim());
  };

  /* =====================================================
     🧩 ORGANIZE COMMENTS FUNCTION
  ===================================================== */
  const organizeComments = (commentsArray) => {
    if (!commentsArray || !Array.isArray(commentsArray)) return [];
    
    try {
      const commentMap = new Map();
      const rootComments = [];
      
      // First pass: map semua komentar
      commentsArray.forEach(comment => {
        if (comment && comment.comment_id) {
          commentMap.set(comment.comment_id, {
            ...comment,
            replies: []
          });
        }
      });
      
      // Second pass: organize parent-child relationship
      commentsArray.forEach(comment => {
        if (!comment || !comment.comment_id) return;
        
        const commentObj = commentMap.get(comment.comment_id);
        if (!commentObj) return;
        
        if (comment.parent_comment_id) {
          // Ini adalah reply, tambahkan ke parent
          const parent = commentMap.get(comment.parent_comment_id);
          if (parent) {
            parent.replies.push(commentObj);
          }
        } else {
          // Ini adalah root comment
          rootComments.push(commentObj);
        }
      });
      
      // Sort by date
      return rootComments.sort((a, b) => 
        new Date(a.created_at) - new Date(b.created_at)
      );
    } catch (error) {
      console.error("Error organizing comments:", error);
      return commentsArray || [];
    }
  };

  // Get organized comments for export
  const organizedComments = organizeComments(comments);

  /* =====================================================
     ⏱️ TIME TRACKING HANDLERS
  ===================================================== */
  const handleStartWork = async (subtaskId) => {
    const subtask = card?.subtasks?.find((s) => s.subtask_id === subtaskId);
    if (!subtask) {
      showAlert("Subtask tidak ditemukan!");
      return;
    }

    // Cek apakah user adalah assignee
    if (subtask.assigned_to !== currentUser?.user_id) {
      showAlert("Anda bukan assignee subtask ini!");
      return;
    }

    // Cek apakah sudah ada active time log untuk subtask ini
    if (activeTimeLogs[subtaskId]) {
      showAlert("Anda sudah memulai pekerjaan pada subtask ini!");
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

      // Update local state immediately
      setCard((prev) => ({
        ...prev,
        subtasks: prev.subtasks.map((s) =>
          s.subtask_id === subtaskId ? { ...s, status: "in_progress" } : s
        ),
      }));

      showAlert("⏱ Log waktu mulai disimpan!");
    } catch (err) {
      console.error("❌ Gagal memulai subtask:", err);
      showAlert(err.message || "Gagal memulai subtask.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleFinishWork = async (subtaskId) => {
    const subtask = card?.subtasks?.find((s) => s.subtask_id === subtaskId);
    if (!subtask) {
      showAlert("Subtask tidak ditemukan!");
      return;
    }

    if (subtask.assigned_to !== currentUser?.user_id) {
      showAlert("Anda bukan assignee subtask ini!");
      return;
    }

    setProcessingId(subtaskId);
    try {
      await apiFetch(`/time/time-logs/end`, {
        method: "PUT",
        body: JSON.stringify({
          subtask_id: subtaskId,
          description: "Menyelesaikan subtask",
        }),
      });

      // Update local state immediately
      setCard((prev) => ({
        ...prev,
        subtasks: prev.subtasks.map((s) =>
          s.subtask_id === subtaskId ? { ...s, status: "review" } : s
        ),
      }));

      showAlert("📤 Subtask dikirim untuk review!");
    } catch (err) {
      console.error("❌ Gagal menyelesaikan subtask:", err);
      showAlert(err.message || "Gagal menyelesaikan subtask.");
    } finally {
      setProcessingId(null);
    }
  };

  /* =====================================================
     🧩 EXISTING HANDLERS - UPDATED
  ===================================================== */
  const handleAddSubtask = async (formData) => {
    try {
      const response = await apiFetch(`/subtask/cards/${cardId}/subtasks`, {
        method: "POST",
        body: JSON.stringify(formData),
      });

      // Emit socket event untuk real-time update - HANYA ke card room
      if (response) {
        socket.emit("subtask_added", {
          ...response,
          card_id: cardId
        });
      }

      setShowForm(false);
      showAlert("✅ Subtask berhasil ditambahkan!");
    } catch (err) {
      console.error("❌ Gagal menambah subtask:", err);
      showAlert(err.message || "Gagal menambah subtask");
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
      showAlert("✅ Assignee berhasil diubah!");
    } catch (err) {
      console.error("❌ Gagal mengubah assignee:", err);
      showAlert(err.message || "Gagal mengubah penugasan subtask.");
    }
  };

  const handleReviewSubtask = async (subtaskId, action) => {
    if (!isOwner) {
      showAlert("Hanya Task Owner yang bisa melakukan review!");
      return;
    }

    if (!confirm(`Yakin ingin ${action === "approved" ? "menyetujui" : "menolak"} subtask ini?`))
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

      setCard((prev) => ({
        ...prev,
        subtasks: prev.subtasks.map((s) =>
          s.subtask_id === subtaskId
            ? { ...s, status: action === "approved" ? "done" : "in_progress" }
            : s
        ),
      }));

      showAlert(
        action === "approved"
          ? "✅ Subtask disetujui!"
          : "❌ Subtask ditolak!"
      );
    } catch (err) {
      console.error("❌ Gagal review subtask:", err);
      showAlert(err.message || "Gagal mereview subtask.");
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
      showAlert("🚨 Blocker berhasil dilaporkan!");
      setShowReportModal(false);
    } catch (err) {
      console.error("❌ Gagal melaporkan blocker:", err);
      showAlert(err.message || "Gagal melaporkan blocker.");
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
      showAlert("✅ Blocker berhasil diselesaikan!");
      setShowSolveModal(false);
    } catch (err) {
      console.error("❌ Gagal menyelesaikan blocker:", err);
      showAlert(err.message || "Gagal menyelesaikan blocker.");
    }
  };

  /* =====================================================
     ⌨️ TYPING INDICATOR HANDLERS
  ===================================================== */
  const handleCommentTypingStart = () => {
    if (cardId && currentUser?.user_id) {
      socket.emit("comment_typing", {
        card_id: cardId,
        user_id: currentUser.user_id,
        user_name: currentUser.user_name,
        is_typing: true
      });
    }
  };

  const handleCommentTypingStop = () => {
    if (cardId && currentUser?.user_id) {
      socket.emit("comment_typing", {
        card_id: cardId,
        user_id: currentUser.user_id,
        user_name: currentUser.user_name,
        is_typing: false
      });
    }
  };

  return {
    // State
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
    comments: organizedComments,
    setComments,
    commentText,
    setCommentText,
    replyingTo,
    setReplyingTo,
    taggedSubtask,
    setTaggedSubtask,
    showSubtaskSuggestions,
    setShowSubtaskSuggestions,
    subtaskSuggestions,
    selectedSubtaskId,
    setSelectedSubtaskId,
    editingField,
    setEditingField,
    editingValue,
    setEditingValue,
    activeTimeLogs,
    
    // Modal handlers
    showReportModal,
    setShowReportModal,
    showSolveModal,
    setShowSolveModal,
    targetType,
    targetId,
    solveBlockerId,
    setSolveBlockerId,
    openReportModal,
    openSolveModal,
    
    // Comment handlers
    handleAddComment,
    handleEditComment,
    handleDeleteComment,
    handleTagSubtask,
    handleReplyComment,
    organizeComments,
    
    // Subtask handlers
    handleAddSubtask,
    handleStartWork,
    handleAssignSubtask,
    handleFinishWork,
    handleReviewSubtask,
    handleInlineUpdate,
    handleDeleteSubtask,
    startEditing,
    cancelEditing,
    saveEditing,
    
    // Blocker handlers
    handleReportBlocker,
    handleSolveBlocker,
    
    // Typing handlers
    handleCommentTypingStart,
    handleCommentTypingStop,
  };
}