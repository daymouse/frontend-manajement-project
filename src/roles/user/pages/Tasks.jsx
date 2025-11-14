import { useEffect, useState, useMemo } from "react";
import { apiFetch } from "../../../Server";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight, Calendar, Clock, AlertCircle, CheckCircle2 } from "lucide-react";

export default function Task() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [boards, setBoards] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await apiFetch("/project/project-board");
        console.log("Response JSON:", data);

        setProjects(data.projects || []);

        const boardsRes = await apiFetch("/board/boards");
        const boardsMap = {};
        boardsRes.forEach((b) => {
          boardsMap[b.project_id] = b;
        });
        setBoards(boardsMap);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // 🔹 Filter projects berdasarkan search term
  const filteredProjects = useMemo(() => {
    if (!searchTerm) return projects;
    
    const lowercasedSearch = searchTerm.toLowerCase();
    return projects.filter(project => 
      project.projects?.project_name?.toLowerCase().includes(lowercasedSearch) ||
      project.projects?.description?.toLowerCase().includes(lowercasedSearch)
    );
  }, [projects, searchTerm]);

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
    const daysUntilDeadline = getDaysUntilDeadline(project.projects?.deadline);
    
    if (project.projects?.status === 'completed' || project.projects?.status === 'done') {
      return {
        text: 'Completed',
        color: 'bg-green-100 text-green-600',
        icon: CheckCircle2
      };
    }
    
    if (project.projects?.status === 'in_review') {
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
      text: project.projects?.status?.replace('_', ' ') || 'In Progress',
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

  const handleConvertToBoard = async (project_id, project_name, description) => {
    try {
      const res = await apiFetch(`/board/projects/${project_id}/boards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          board_name: project_name,
          description: description || "",
        }),
      });

      if (res.board) {
        setBoards((prev) => ({
          ...prev,
          [project_id]: res.board,
        }));
      }
    } catch (err) {
      console.error("Error creating board:", err);
      alert("Failed to create board");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      <span className="ml-2 text-gray-600">Loading projects...</span>
    </div>
  );
  
  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
      <p className="text-red-600">⚠️ Error: {error}</p>
    </div>
  );

  return (
    <div className="bg-white rounded-4xl p-6 font-poppins shadow-sm">
      {/* Header dengan Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Your Tasks
        </h2>
        <div className="relative w-full md:w-1/3">
          <input
            type="text"
            placeholder="Search project..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-3xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
      </div>

      {/* Project List */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-lg font-medium mb-2">
            {searchTerm ? "No Projects Found" : "No Projects Available"}
          </p>
          <p className="text-sm">
            {searchTerm ? "Try adjusting your search terms" : "Create a project to get started"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProjects.map((pm) => {
            const hasBoard = boards[pm.project_id];
            const statusInfo = getProjectStatus(pm);
            const StatusIcon = statusInfo.icon;

            return (
              <div
                key={pm.project_id}
                className="relative bg-gray-50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 cursor-pointer group"
              >
                {/* Project Status Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                    <StatusIcon size={12} />
                    <span>{statusInfo.text}</span>
                  </div>
                </div>

                {/* Project Name */}
                <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 leading-tight">
                  {pm.projects?.project_name}
                </h3>

                {/* Project Description */}
                <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">
                  {pm.projects?.description || "No description provided."}
                </p>

                {/* Deadline & Countdown */}
                <div className="space-y-2 mb-4">
                  {pm.projects?.deadline && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar size={14} />
                      <span>{formatDate(pm.projects.deadline)}</span>
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

                {/* Action Button */}
                {hasBoard ? (
                  <button
                    onClick={() => navigate(`/user/board/${hasBoard.board_id}`)}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors group/btn"
                  >
                    <span>Go to Board</span>
                    <ArrowRight size={16} className="group-hover/btn:translate-x-0.5 transition-transform" />
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      handleConvertToBoard(
                        pm.project_id,
                        pm.projects?.project_name,
                        pm.projects?.description
                      )
                    }
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    <span>Convert To Board</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Search result info */}
      {searchTerm && !loading && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Showing {filteredProjects.length} of {projects.length} projects
          {searchTerm && ` for "${searchTerm}"`}
        </div>
      )}
    </div>
  );
}