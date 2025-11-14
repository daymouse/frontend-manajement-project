import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../../../Server";
import { 
  BarChart3, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  Target,
  TrendingUp,
  AlertCircle,
  FileText,
  Calendar,
  RefreshCw,
  PieChart,
  PlayCircle,
  CheckSquare,
  Zap,
  Hourglass
} from "lucide-react";

export default function TeamLeadAnalytics() {
  const { board_id } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await apiFetch(`/analytics/project/${board_id}`, "GET");
      console.log("Fetched analytics:", res);

      // langsung set tanpa cek res.success
      setAnalytics(res.board_info ? res : null);
    } catch (err) {
      console.error("Gagal fetch analytics:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (board_id) {
      fetchAnalytics();
    }
  }, [board_id]);

  if (loading) {
    return (
      <div className="p-6 bg-white min-h-screen rounded-4xl font-poppins">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white min-h-screen rounded-4xl font-poppins">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">Error Loading Analytics</h3>
            <p className="text-gray-500 mt-2">{error}</p>
            <button 
              onClick={fetchAnalytics}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6 bg-white min-h-screen rounded-4xl font-poppins">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No analytics data available</p>
        </div>
      </div>
    );
  }

  const { 
    board_info, 
    activity_stats, 
    blockers, 
    performance, 
    time, 
    progress 
  } = analytics;

  // Helper function untuk format waktu
  const formatMinutesToHours = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Stat Cards Component
  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-poppins">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📊 Board Analytics
        </h1>
        <p className="text-gray-600">
          {board_info?.board_name} • {board_info?.project?.project_name || "Project Overview"}
        </p>
        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
          <span>Members: {board_info?.total_members || 0}</span>
          <span>•</span>
          <span>Progress: {progress?.progress_percentage || 0}%</span>
          <span>•</span>
          <span>Status: {board_info?.project?.status || "N/A"}</span>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Cards"
          value={activity_stats?.total_cards || 0}
          icon={FileText}
          color="bg-blue-500"
          subtitle="All cards in board"
        />
        <StatCard
          title="Completed"
          value={progress?.completed_cards || 0}
          icon={CheckCircle}
          color="bg-green-500"
          subtitle={`${progress?.progress_percentage || 0}% progress`}
        />
        <StatCard
          title="In Progress"
          value={activity_stats?.cards_by_status?.in_progress || 0}
          icon={TrendingUp}
          color="bg-yellow-500"
          subtitle="Active work"
        />
        <StatCard
          title="Pending"
          value={activity_stats?.cards_by_status?.todo || 0}
          icon={Clock}
          color="bg-orange-500"
          subtitle="To do"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Card Distribution */}
        <div className="space-y-6">
          {/* Priority Distribution */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-purple-600" />
              Priority Distribution
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-red-600 font-medium">High Priority</span>
                <span className="text-lg font-bold">{activity_stats?.cards_by_priority?.high || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-yellow-600 font-medium">Medium Priority</span>
                <span className="text-lg font-bold">{activity_stats?.cards_by_priority?.medium || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-600 font-medium">Low Priority</span>
                <span className="text-lg font-bold">{activity_stats?.cards_by_priority?.low || 0}</span>
              </div>
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <PieChart className="w-5 h-5 mr-2 text-blue-600" />
              Status Distribution
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">To Do</span>
                <span className="font-bold">{activity_stats?.cards_by_status?.todo || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-600">In Progress</span>
                <span className="font-bold">{activity_stats?.cards_by_status?.in_progress || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-600">Done</span>
                <span className="font-bold">{activity_stats?.cards_by_status?.done || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column - Performance & Time */}
        <div className="space-y-6">
          {/* Subtask Statistics */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CheckSquare className="w-5 h-5 mr-2 text-green-600" />
              Subtask Statistics
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Subtasks</span>
                <span className="font-bold">{activity_stats?.total_subtasks || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">To Do</span>
                <span className="font-bold">{activity_stats?.subtasks_by_status?.todo || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-600">In Progress</span>
                <span className="font-bold">{activity_stats?.subtasks_by_status?.in_progress || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-600">Completed</span>
                <span className="font-bold">{activity_stats?.subtasks_by_status?.done || 0}</span>
              </div>
            </div>
          </div>

          {/* Time Tracking */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Hourglass className="w-5 h-5 mr-2 text-indigo-600" />
              Time Tracking
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Logged Time</span>
                <span className="font-bold">{formatMinutesToHours(time?.total_time_logged || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Avg Work Duration</span>
                <span className="font-bold">{time?.avg_work_duration || 0} min</span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Estimation Accuracy:{" "}
                  <span className="font-bold">
                    {activity_stats?.estimation_accuracy 
                      ? `${(activity_stats.estimation_accuracy * 100).toFixed(1)}%`
                      : "N/A"}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Blockers & Performance */}
        <div className="space-y-6">
          {/* Blockers Overview */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
              Blockers Overview
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Card Blockers</span>
                <span className="font-bold">{blockers?.unresolved_card_blockers || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Subtask Blockers</span>
                <span className="font-bold">{blockers?.unresolved_subtask_blockers || 0}</span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm text-red-600 font-medium">
                  Total Unresolved: {(blockers?.unresolved_card_blockers || 0) + (blockers?.unresolved_subtask_blockers || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Team Performance */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-green-600" />
              Team Performance
            </h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {performance && Object.keys(performance).length > 0 ? (
                  Object.entries(performance).map(([fullName, completedTasks]) => (
                    <div
                      key={fullName}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {fullName?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <span className="ml-3 text-gray-700">{fullName}</span>
                      </div>
                      <span className="font-bold text-green-600">{completedTasks} tasks</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No performance data available
                  </p>
                )}
            </div>
          </div>

          {/* Project Info */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
              Project Info
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Project:</span>
                <span className="font-medium">{board_info?.project?.project_name || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${
                  board_info?.project?.status === 'completed' ? 'text-green-600' :
                  board_info?.project?.status === 'in_progress' ? 'text-blue-600' :
                  'text-gray-600'
                }`}>
                  {board_info?.project?.status || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Deadline:</span>
                <span className="font-medium">
                  {board_info?.project?.deadline 
                    ? new Date(board_info.project.deadline).toLocaleDateString() 
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Board Position:</span>
                <span className="font-medium">{board_info?.position || "N/A"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={fetchAnalytics}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Analytics
        </button>
      </div>
    </div>
  );
}