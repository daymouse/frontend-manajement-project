import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProjectDetailHandler } from "../handler/ProjectDetailHandler";
import { toast } from "react-hot-toast";
import { 
  Loader2, 
  UserPlus, 
  RefreshCw, 
  ArrowLeft, 
  Calendar,
  Search,
  User,
  Trash2,
  MoreVertical,
  FileText,
  Clock,
  CheckCircle2,
  X,
  ChevronDown,
  Plus,
  Download,
  Filter,
  BarChart3,
  ListTodo,
  Users,
  Target,
  FileSpreadsheet,
  ThumbsUp,
  ThumbsDown,
  AlertCircle
} from "lucide-react";

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const {
    loading,
    error,
    project,
    summary,
    members,
    active,
    report,
    refresh,
    updateProjectInline,
    addProjectMember,
    updateMemberRole,
    generateProjectReport,
    exportToExcel,
    exportToPDF,
    fetchAllUsers,
    removeMember,
    users,
    approveProject,
    rejectProject,
    currentUser,
  } = useProjectDetailHandler(projectId);

  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [generating, setGenerating] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState("member");
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dateFilter, setDateFilter] = useState({
    start_date: "",
    end_date: ""
  });
  const [activeReportTab, setActiveReportTab] = useState("summary");
  const [exporting, setExporting] = useState({
    excel: false,
    pdf: false,
    htmlPdf: false
  });
  
  // 🔹 State untuk approve/reject
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [processingAction, setProcessingAction] = useState(false);

  // 🔹 Check if project is in review status - SEDERHANAKAN
  const canApproveReject = useMemo(() => {
    return project?.status === "review";
  }, [project]);

  // 🔹 Memoized filtered users
  const filteredUsers = useMemo(() => 
    users.filter(user => {
      const isAlreadyMember = members.some(member => member.user_id === user.user_id);
      const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      return !isAlreadyMember && matchesSearch;
    }),
    [users, members, searchTerm]
  );

  // 🔹 Report data helpers
  const reportSummary = useMemo(() => {
    if (!report) return null;
    
    return {
      total_cards: report.total_cards || 0,
      cards_done: report.cards_done || 0,
      cards_in_progress: report.cards_in_progress || 0,
      total_hours: report.total_hours || "0",
      total_members: report.total_members || 0,
      date_range: report.date_range || {}
    };
  }, [report]);

  // 🔹 Modal handlers
  const openAddMemberModal = useCallback(() => {
    setShowAddMemberModal(true);
    setSelectedUser(null);
    setSelectedRole("member");
    setSearchTerm("");
  }, []);

  const closeAddMemberModal = useCallback(() => {
    setShowAddMemberModal(false);
    setSelectedUser(null);
    setSearchTerm("");
  }, []);

  const handleSelectUser = useCallback((user) => {
    setSelectedUser(user);
  }, []);

  // 🔹 Approve/Reject handlers - SEDERHANAKAN
  const handleApproveProject = useCallback(async () => {
    console.log("🟢 APPROVE button clicked");
    
    setProcessingAction(true);
    try {
      await approveProject(projectId, currentUser?.user_id);
      toast.success("Project berhasil disetujui!");
      setTimeout(() => refresh(), 500);
    } catch (err) {
      console.error("Approve error:", err);
      toast.error(err.message || "Gagal menyetujui project");
    } finally {
      setProcessingAction(false);
    }
  }, [projectId, currentUser, approveProject, refresh]);

  const handleRejectProject = useCallback(async () => {
    console.log("🔴 REJECT button clicked");
    
    if (!rejectReason.trim()) {
      toast.error("Harap berikan alasan penolakan");
      return;
    }

    setProcessingAction(true);
    try {
      await rejectProject(projectId, currentUser?.user_id, rejectReason);
      toast.success("Project berhasil ditolak!");
      setShowRejectModal(false);
      setRejectReason("");
      setTimeout(() => refresh(), 500);
    } catch (err) {
      console.error("Reject error:", err);
      toast.error(err.message || "Gagal menolak project");
    } finally {
      setProcessingAction(false);
    }
  }, [projectId, currentUser, rejectProject, rejectReason, refresh]);

  const openRejectModal = useCallback(() => {
    console.log("📝 Open reject modal");
    setShowRejectModal(true);
    setRejectReason("");
  }, []);

  const closeRejectModal = useCallback(() => {
    setShowRejectModal(false);
    setRejectReason("");
  }, []);

  // 🔹 Member operations
  const handleAddMember = useCallback(async () => {
    if (!selectedUser) {
      toast.error("Pilih pengguna terlebih dahulu");
      return;
    }

    try {
      await addProjectMember(selectedUser.user_id, selectedRole);
      toast.success("Anggota berhasil ditambahkan!");
      closeAddMemberModal();
    } catch (err) {
      toast.error(err.message);
    }
  }, [selectedUser, selectedRole, addProjectMember, closeAddMemberModal]);

  const handleRemoveMember = useCallback(async (member) => {
    if (!confirm(`Hapus ${member.full_name || "anggota ini"} dari project?`)) return;

    try {
      await removeMember(member.user_id);
      toast.success("Anggota berhasil dihapus!");
      setOpenDropdown(null);
    } catch (err) {
      toast.error(err.message || "Gagal menghapus anggota");
    }
  }, [removeMember]);

  const handleUpdateRole = useCallback(async (memberId, newRole) => {
    try {
      await updateMemberRole(memberId, newRole);
      toast.success("Role berhasil diperbarui!");
    } catch (err) {
      toast.error(err.message || "Gagal memperbarui role");
    }
  }, [updateMemberRole]);

  // 🔹 Inline editing handlers
  const startEdit = useCallback((field, value) => {
    setEditingField(field);
    setEditValue(field === 'deadline' ? new Date(value).toISOString().split('T')[0] : value || "");
  }, []);

  const saveEdit = useCallback(async () => {
    if (!project || !editingField) return;

    try {
      const valueToSave = editingField === 'deadline' && !editValue ? null : editValue;
      await updateProjectInline({ [editingField]: valueToSave });
      toast.success("Berhasil memperbarui project!");
      setEditingField(null);
      setEditValue("");
    } catch (err) {
      toast.error(err.message);
    }
  }, [project, editingField, editValue, updateProjectInline]);

  const cancelEdit = useCallback(() => {
    setEditingField(null);
    setEditValue("");
  }, []);

  // 🔹 Handle click outside for inline editing
  const handleClickOutsideEdit = useCallback((e) => {
    if (editingField && !e.target.closest('.editing-field')) {
      if (editValue !== (project[editingField] || "")) {
        saveEdit();
      } else {
        cancelEdit();
      }
    }
  }, [editingField, editValue, project, saveEdit, cancelEdit]);

  // 🔹 Report generation dengan filter tanggal
  const handleGenerateReport = useCallback(async () => {
    try {
      setGenerating(true);
      await generateProjectReport(dateFilter.start_date, dateFilter.end_date);
      toast.success("Laporan berhasil di-generate!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGenerating(false);
    }
  }, [generateProjectReport, dateFilter]);

  // 🔹 Export functions
  const handleExportExcel = useCallback(async () => {
    try {
      setExporting(prev => ({ ...prev, excel: true }));
      await exportToExcel();
      toast.success("Berhasil export ke Excel!");
    } catch (err) {
      toast.error(err.message || "Gagal export ke Excel");
    } finally {
      setExporting(prev => ({ ...prev, excel: false }));
    }
  }, [exportToExcel]);

  const handleExportPDF = useCallback(async () => {
    try {
      setExporting(prev => ({ ...prev, pdf: true }));
      await exportToPDF();
      toast.success("Berhasil export ke PDF!");
    } catch (err) {
      toast.error(err.message || "Gagal export ke PDF");
    } finally {
      setExporting(prev => ({ ...prev, pdf: false }));
    }
  }, [exportToPDF]);

  // 🔹 Effects
  useEffect(() => {
    if (showAddMemberModal) {
      fetchAllUsers();
    }
  }, [showAddMemberModal, fetchAllUsers]);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutsideEdit);
    document.addEventListener('click', () => setOpenDropdown(null));
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideEdit);
      document.removeEventListener('click', () => setOpenDropdown(null));
    };
  }, [handleClickOutsideEdit]);

  // 🔹 Loading & Error states
  if (loading) {
    return (
      <div className="p-6 font-poppins bg-white rounded-4xl flex items-center justify-center">
        <Loader2 className="animate-spin w-6 h-6 mr-2" />
        <span className="text-gray-600">Memuat data proyek...</span>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-6 font-poppins bg-white rounded-4xl flex flex-col items-center justify-center text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold mb-2">Terjadi Kesalahan</h2>
        <p className="mb-4 text-gray-600">{error || "Data project tidak ditemukan"}</p>
        <button onClick={refresh} className="px-4 py-2 rounded-2xl bg-blue-500 text-white hover:bg-blue-600 transition-colors">
          Coba Lagi
        </button>
      </div>
    );
  }

  // 🔹 Render helpers
  const renderEditableField = (field, value, isTextarea = false) => {
    if (editingField === field) {
      return (
        <div className="editing-field">
          {isTextarea ? (
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full border-2 border-blue-500 p-3 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-white"
              rows={3}
              autoFocus
            />
          ) : (
            <input
              type={field === 'deadline' ? 'date' : 'text'}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className={`w-full border-2 border-blue-500 p-2 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none bg-white ${
                field === 'project_name' ? 'text-2xl font-semibold' : ''
              }`}
              autoFocus
              min={field === 'deadline' ? new Date().toISOString().split('T')[0] : undefined}
            />
          )}
        </div>
      );
    }

    const displayValue = field === 'deadline' && value 
      ? new Date(value).toLocaleDateString("id-ID", {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : value || (field === 'description' ? "Klik untuk menambahkan deskripsi..." : "Belum ditentukan");

    return (
      <div 
        className={`cursor-pointer hover:bg-gray-50 rounded-2xl p-2 transition-colors ${
          field === 'project_name' ? 'text-2xl font-semibold text-gray-800' : 
          field === 'description' ? 'text-gray-600 leading-relaxed' : 'text-gray-600'
        }`}
        onClick={() => startEdit(field, value)}
      >
        {displayValue}
      </div>
    );
  };

  // 🔹 Render project status with approve/reject buttons - SEDERHANAKAN
  const renderProjectStatus = () => {
    const statusConfig = {
      planning: { color: "bg-gray-100 text-gray-800", label: "Perencanaan" },
      in_progress: { color: "bg-blue-100 text-blue-800", label: "Dalam Pengerjaan" },
      review: { color: "bg-orange-100 text-orange-800", label: "Review" },
      done: { color: "bg-green-100 text-green-800", label: "Selesai" },
      cancelled: { color: "bg-red-100 text-red-800", label: "Dibatalkan" }
    };

    const config = statusConfig[project.status] || statusConfig.planning;

    return (
      <div className="flex items-center gap-3">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
          {config.label}
        </span>
        
        {/* Approve/Reject Buttons - SEDERHANAKAN: hanya cek status review */}
        {project.status === "review" && (
          <div className="flex gap-2 ml-2">
            <button
              onClick={handleApproveProject}
              disabled={processingAction}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-2xl hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {processingAction ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ThumbsUp className="w-4 h-4" />
              )}
              {processingAction ? "Memproses..." : "Setujui"}
            </button>
            
            <button
              onClick={openRejectModal}
              disabled={processingAction}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-2xl hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              <ThumbsDown className="w-4 h-4" />
              Tolak
            </button>
          </div>
        )}
      </div>
    );
  };

  // 🔹 Render report sections
  const renderReportSummary = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm">Total Kartu</p>
            <p className="text-2xl font-bold mt-1">{reportSummary?.total_cards || 0}</p>
          </div>
          <FileText className="w-8 h-8 opacity-80" />
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100 text-sm">Kartu Selesai</p>
            <p className="text-2xl font-bold mt-1">{reportSummary?.cards_done || 0}</p>
          </div>
          <CheckCircle2 className="w-8 h-8 opacity-80" />
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-orange-100 text-sm">Dalam Proses</p>
            <p className="text-2xl font-bold mt-1">{reportSummary?.cards_in_progress || 0}</p>
          </div>
          <Clock className="w-8 h-8 opacity-80" />
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-100 text-sm">Total Jam</p>
            <p className="text-2xl font-bold mt-1">{reportSummary?.total_hours || "0"}</p>
          </div>
          <BarChart3 className="w-8 h-8 opacity-80" />
        </div>
      </div>
    </div>
  );

  const renderMembersActivity = () => (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Aktivitas Anggota Tim
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 font-semibold text-gray-700 text-left">Nama Anggota</th>
              <th className="p-4 font-semibold text-gray-700 text-center">Total Jam</th>
              <th className="p-4 font-semibold text-gray-700 text-center">Total Kartu</th>
              <th className="p-4 font-semibold text-gray-700 text-center">Total Subtask</th>
            </tr>
          </thead>
          <tbody>
            {report?.members_activity?.map((member, idx) => (
              <tr key={member.user_id || idx} className="border-t hover:bg-gray-50 transition-colors">
                <td className="p-4 border-b text-gray-800 font-medium">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                      {member.user_name?.charAt(0) || "U"}
                    </div>
                    {member.user_name || "Unknown"}
                  </div>
                </td>
                <td className="p-4 border-b text-center text-gray-600 font-semibold">
                  {member.total_hours} jam
                </td>
                <td className="p-4 border-b text-center text-gray-600">
                  {member.total_cards || 0}
                </td>
                <td className="p-4 border-b text-center text-gray-600">
                  {member.total_subtasks || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderReportDetails = () => (
    <div className="space-y-4">
      {report?.report_details?.map((card, index) => (
        <div key={card.card_id || index} className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-lg text-gray-800">{card.card_title}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  card.status === 'done' ? 'bg-green-100 text-green-800' :
                  card.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {card.status || 'unknown'}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  card.priority === 'high' ? 'bg-red-100 text-red-800' :
                  card.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {card.priority || 'normal'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Due: {card.due_date ? new Date(card.due_date).toLocaleDateString("id-ID", {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>Dibuat oleh: {card.created_by}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ListTodo className="w-4 h-4" />
                  <span>Board: {card.board_name}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Users */}
          {card.assigned_users?.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Anggota yang Ditugaskan:</h4>
              <div className="flex flex-wrap gap-2">
                {card.assigned_users.map((user, userIndex) => (
                  <span 
                    key={user.user_id || userIndex}
                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm flex items-center gap-2"
                  >
                    <User className="w-3 h-3" />
                    {user.user_name}
                    <span className="text-blue-500 text-xs">({user.assignment_status})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Subtasks */}
          {card.subtasks?.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Subtask:</h4>
              <div className="space-y-3">
                {card.subtasks.map((subtask, subtaskIndex) => (
                  <div key={subtask.subtask_id || subtaskIndex} className="border border-gray-200 rounded-2xl p-4">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-800 mb-1">{subtask.subtask_title}</h5>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <span>Status: {subtask.status}</span>
                          <span>Ditugaskan ke: {subtask.assigned_to}</span>
                          <span>Diselesaikan oleh: {subtask.completed_by}</span>
                          {subtask.actual_hours > 0 && (
                            <span className="font-semibold">Jam Aktual: {subtask.actual_hours}</span>
                          )}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        subtask.review_status === 'approved' ? 'bg-green-100 text-green-800' :
                        subtask.review_status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        Review: {subtask.review_status || 'pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-6 font-poppins bg-white rounded-4xl">
      {/* Project Header */}
      <div className="bg-gray-50 rounded-3xl p-6 mb-6">
        <div className="flex flex-col gap-4">
          {renderEditableField('project_name', project.project_name)}
          {renderEditableField('description', project.description, true)}
          
          <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-600 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {renderEditableField('deadline', project.deadline)}
            </div>
            <div className="flex items-center gap-2">
              <span>Status:</span>
              {renderProjectStatus()}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-6 mt-6">
          {[
            { label: "Total Cards", value: summary.total_cards || 0, icon: FileText },
            { label: "Dalam Proses", value: summary.in_progress || 0, icon: Clock },
            { label: "Selesai", value: summary.done || 0, icon: CheckCircle2 }
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="text-center p-4 bg-white rounded-2xl shadow-sm">
              <Icon className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-gray-500 text-sm mb-1">{label}</p>
              <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Grid Layout untuk Members dan Time Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Members Section */}
        <div className="bg-gray-50 rounded-3xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-lg text-gray-800">Anggota Proyek</h2>
            <button 
              onClick={openAddMemberModal} 
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-3xl hover:bg-green-600 transition-colors font-medium text-sm"
            >
              <UserPlus className="w-4 h-4" /> Tambah
            </button>
          </div>

          {members.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-2xl">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Belum ada anggota</p>
              <button 
                onClick={openAddMemberModal}
                className="mt-2 text-blue-500 hover:text-blue-600 font-medium text-sm"
              >
                Tambah anggota pertama
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {members.map((m) => (
                <div key={m.member_id} className="flex justify-between items-center p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0">
                      {m.full_name?.charAt(0) || <User className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{m.full_name || "Tanpa Nama"}</p>
                      <p className="text-gray-500 text-sm truncate">{m.email || "-"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <select
                      value={m.role}
                      onChange={(e) => handleUpdateRole(m.member_id, e.target.value)}
                      className="border border-gray-300 p-2 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white min-w-24"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdown(openDropdown === m.member_id ? null : m.member_id);
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-2xl transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {openDropdown === m.member_id && (
                        <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-2xl shadow-lg z-10 min-w-[120px] overflow-hidden">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveMember(m);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 transition-colors text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            Hapus
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Time Logs Section */}
        <div className="bg-gray-50 rounded-3xl p-6">
          <h2 className="font-semibold text-lg text-gray-800 mb-4">Catatan Waktu</h2>
          {active.time_logs?.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-2xl">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Belum ada catatan waktu</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {active.time_logs.map((t) => (
                <div key={t.subtask_id} className="p-4 bg-white rounded-2xl shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-gray-800 text-sm line-clamp-1 flex-1 mr-2">
                      {t.subtask_title}
                    </span>
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0">
                      {t.total_duration_minutes} menit
                    </span>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {t.logs.map((log) => (
                      <li key={log.log_id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-800 text-sm line-clamp-2">{log.description}</p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <span className="text-gray-600 text-xs bg-gray-200 px-2 py-1 rounded-full block">
                            {log.user_name}
                          </span>
                          <span className="text-gray-500 text-xs mt-1 block">
                            {log.duration_minutes}m
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Report Section - Full Width */}
      <div id="report-section" className="bg-gray-50 rounded-3xl p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h2 className="font-semibold text-lg text-gray-800 mb-1">Laporan Aktivitas</h2>
            <p className="text-gray-500 text-sm">Ringkasan progress dan aktivitas tim</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {/* Date Filter */}
            <div className="flex gap-2">
              <input
                type="date"
                value={dateFilter.start_date}
                onChange={(e) => setDateFilter(prev => ({ ...prev, start_date: e.target.value }))}
                className="border border-gray-300 p-2 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Dari Tanggal"
              />
              <input
                type="date"
                value={dateFilter.end_date}
                onChange={(e) => setDateFilter(prev => ({ ...prev, end_date: e.target.value }))}
                className="border border-gray-300 p-2 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Sampai Tanggal"
              />
            </div>

            <div className="flex gap-2">
              <button 
                onClick={handleGenerateReport} 
                disabled={generating} 
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-3xl hover:bg-blue-600 disabled:opacity-50 transition-colors font-medium text-sm whitespace-nowrap"
              >
                <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
                {generating ? "Memuat..." : "Generate Report"}
              </button>
              
              {report && (
                <div className="flex gap-2">
                  {/* Tombol Export PDF Data */}
                  <button 
                    onClick={handleExportPDF}
                    disabled={exporting.pdf}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-3xl hover:bg-red-600 disabled:opacity-50 transition-colors font-medium text-sm whitespace-nowrap"
                  >
                    <FileText className="w-4 h-4" />
                    {exporting.pdf ? "Exporting..." : "PDF Data"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Report Tabs */}
        {report && (
          <div className="mb-6">
            <div className="flex border-b border-gray-200">
              {[
                { id: "summary", label: "Ringkasan", icon: BarChart3 },
                { id: "members", label: "Aktivitas Anggota", icon: Users },
                { id: "details", label: "Detail Kartu", icon: ListTodo }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveReportTab(id)}
                  className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeReportTab === id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {!report ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-2xl">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Belum ada laporan aktivitas</p>
            <button 
              onClick={handleGenerateReport}
              className="mt-2 text-blue-500 hover:text-blue-600 font-medium text-sm"
            >
              Generate laporan pertama
            </button>
          </div>
        ) : (
          <div>
            {activeReportTab === "summary" && renderReportSummary()}
            {activeReportTab === "members" && renderMembersActivity()}
            {activeReportTab === "details" && renderReportDetails()}
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Tambah Anggota</h3>
              <button 
                onClick={closeAddMemberModal} 
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Cari pengguna..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>

              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-2xl">
                {filteredUsers.length === 0 ? (
                  <p className="text-center py-6 text-gray-500">
                    {searchTerm ? "Tidak ada pengguna yang cocok" : "Tidak ada pengguna tersedia"}
                  </p>
                ) : (
                  <div className="space-y-2 p-2">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.user_id}
                        onClick={() => handleSelectUser(user)}
                        className={`p-3 border rounded-2xl cursor-pointer transition-colors ${
                          selectedUser?.user_id === user.user_id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0">
                            {user.full_name?.charAt(0) || <User className="w-5 h-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 truncate">{user.full_name || "Tanpa Nama"}</p>
                            <p className="text-gray-500 text-sm truncate">{user.email}</p>
                          </div>
                          {selectedUser?.user_id === user.user_id && (
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <div className="w-2 h-2 bg-white rounded-full" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={closeAddMemberModal} 
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Batal
                </button>
                <button 
                  onClick={handleAddMember} 
                  disabled={!selectedUser}
                  className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Tambahkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Project Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                Tolak Project
              </h3>
              <button 
                onClick={closeRejectModal} 
                disabled={processingAction}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alasan Penolakan <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Berikan alasan mengapa project ini ditolak..."
                  className="w-full border border-gray-300 p-3 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-white disabled:opacity-50"
                  rows={4}
                  disabled={processingAction}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Alasan penolakan akan dicatat dalam riwayat project.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={closeRejectModal} 
                  disabled={processingAction}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Batal
                </button>
                <button 
                  onClick={handleRejectProject} 
                  disabled={!rejectReason.trim() || processingAction}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-2xl hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {processingAction ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Tolak Project"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}