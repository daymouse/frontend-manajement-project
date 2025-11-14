// src/pages/admin/Project/Project.jsx
import { Search, Trash2, ArrowRight, Plus, Calendar, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CreateProjectModal from "./../../../components/admin/CreateProjectModal";
import ProjectDetailModal from "./../../../components/admin/ProjectDetailModal";
import { useProjectHandler } from "./../handler/ProjectHandler";

export default function Project() {
  const navigate = useNavigate();
  const {
    isOpen,
    setIsOpen,
    selectedProject,
    setSelectedProject,
    projects,
    leaders,
    users,
    boards,
    errorMsg,
    handleDeleteProject,
    handleOpenDetail,
    handleGoToBoard,
    fetchProjects,
  } = useProjectHandler(navigate);

  // 🔹 Fungsi untuk menghitung hari menuju deadline
  const getDaysUntilDeadline = (deadline) => {
    if (!deadline) return null;
    
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // 🔹 Fungsi untuk mendapatkan status dan warna project
  const getProjectStatus = (project) => {
    const daysUntilDeadline = getDaysUntilDeadline(project.deadline);
    
    if (project.status === 'completed' || project.status === 'done') {
      return {
        text: 'Completed',
        color: 'bg-green-100 text-green-600',
        icon: CheckCircle2
      };
    }
    
    if (project.status === 'in_review') {
      return {
        text: 'In Review',
        color: 'bg-yellow-100 text-yellow-600',
        icon: Clock
      };
    }
    
    if (daysUntilDeadline !== null) {
      if (daysUntilDeadline < 0) {
        return {
          text: 'Overdue',
          color: 'bg-red-100 text-red-600',
          icon: AlertCircle,
          days: Math.abs(daysUntilDeadline)
        };
      } else if (daysUntilDeadline === 0) {
        return {
          text: 'Due Today',
          color: 'bg-red-100 text-red-600',
          icon: AlertCircle,
          days: 0
        };
      } else if (daysUntilDeadline <= 3) {
        return {
          text: 'Due Soon',
          color: 'bg-orange-100 text-orange-600',
          icon: AlertCircle,
          days: daysUntilDeadline
        };
      }
    }
    
    return {
      text: project.status?.replace('_', ' ') || 'In Progress',
      color: 'bg-blue-100 text-blue-600',
      icon: Clock,
      days: daysUntilDeadline
    };
  };

  // 🔹 Format tanggal untuk display
  const formatDate = (dateString) => {
    if (!dateString) return 'No deadline';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-4xl p-6 font-poppins shadow-sm">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-6">
        <div className="relative w-full md:w-1/3">
          <input
            type="text"
            placeholder="Search project..."
            className="w-full pl-10 pr-4 py-2 rounded-3xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-3xl border border-blue-500 bg-blue-500 text-white hover:bg-blue-600 transition-colors text-sm font-medium"
        >
          <Plus size={18} /> Add Project
        </button>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="mt-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm mb-4">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Modal Create Project */}
      {isOpen && (
        <CreateProjectModal
          onClose={() => setIsOpen(false)}
          fetchProjects={fetchProjects}
          leaders={leaders}
          users={users}
        />
      )}

      {/* Modal Detail Project */}
      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}

      {/* Project List */}
      {projects.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-lg font-medium mb-2">No Projects Yet</p>
          <p className="text-sm">Create your first project to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {projects.map((p) => {
            const board = boards[p.project_id];
            const statusInfo = getProjectStatus(p);
            const StatusIcon = statusInfo.icon;

            return (
              <div
                key={p.project_id}
                className="relative bg-gray-50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 cursor-pointer group"
                onClick={() => handleOpenDetail(p)}
              >
                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProject(p.project_id);
                  }}
                  className="absolute top-3 right-3 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  title="Delete Project"
                >
                  <Trash2 size={16} />
                </button>

                {/* Project Status Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                    <StatusIcon size={12} />
                    <span>{statusInfo.text}</span>
                  </div>
                </div>

                {/* Project Name */}
                <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 leading-tight">
                  {p.project_name}
                </h3>

                {/* Project Description */}
                <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">
                  {p.description || "No description provided."}
                </p>

                {/* Deadline & Countdown */}
                <div className="space-y-2 mb-4">
                  {p.deadline && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar size={14} />
                      <span>{formatDate(p.deadline)}</span>
                    </div>
                  )}
                  
                  {/* Countdown Info */}
                  {statusInfo.days !== undefined && statusInfo.days !== null && (
                    <div className={`text-xs font-medium ${
                      statusInfo.days < 0 ? 'text-red-600' :
                      statusInfo.days === 0 ? 'text-red-600' :
                      statusInfo.days <= 3 ? 'text-orange-600' : 'text-gray-600'
                    }`}>
                      {statusInfo.days < 0 ? (
                        <span>Overdue by {Math.abs(statusInfo.days)} day{Math.abs(statusInfo.days) !== 1 ? 's' : ''}</span>
                      ) : statusInfo.days === 0 ? (
                        <span>Due today!</span>
                      ) : statusInfo.days <= 3 ? (
                        <span>Due in {statusInfo.days} day{statusInfo.days !== 1 ? 's' : ''}</span>
                      ) : (
                        <span>{statusInfo.days} day{statusInfo.days !== 1 ? 's' : ''} left</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Go to Board Button */}
                {board && (
                  <button
                    onClick={(e) => handleGoToBoard(e, p.project_id)}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors group/btn"
                  >
                    <span>go to detail</span>
                    <ArrowRight size={16} className="group-hover/btn:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}