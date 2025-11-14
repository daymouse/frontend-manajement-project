import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from "../../../Server";
import { Search, ChevronDown, Plus, RefreshCw, Calendar, Users, FileText, Clock, CheckCircle2, AlertCircle } from "lucide-react";

// Custom Hook untuk Dashboard
const useDashboard = () => {
  const [calendarData, setCalendarData] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [userActivity, setUserActivity] = useState(null);
  const [projectProgress, setProjectProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔹 Ambil data calendar view
  const fetchCalendarView = async () => {
    try {
      const res = await apiFetch("/home-admin/calendar-view", "GET");
      if (res.success) setCalendarData(res.data);
    } catch (err) {
      console.error("❌ Gagal fetch calendar view:", err);
      throw err;
    }
  };

  // 🔹 Ambil project summary
  const fetchProjectSummary = async () => {
    try {
      const res = await apiFetch("/home-admin/project-summary", "GET");
      if (res.success) setSummaryData(res.data);
    } catch (err) {
      console.error("❌ Gagal fetch project summary:", err);
      throw err;
    }
  };

  // 🔹 Ambil user activity
  const fetchUserActivity = async () => {
    try {
      const res = await apiFetch("/home-admin/user-activity", "GET");
      if (res.success) {
        setUserActivity({
          total_users: res.total_users,
          active_users: res.active_users,
          top_users: res.top_users
        });
      }
    } catch (err) {
      console.error("❌ Gagal fetch user activity:", err);
      throw err;
    }
  };

  // 🔹 Ambil project progress
  const fetchProjectProgress = async () => {
    try {
      const res = await apiFetch("/home-admin/project-progress", "GET");
      if (res.success) setProjectProgress(res.data);
    } catch (err) {
      console.error("❌ Gagal fetch project progress:", err);
      throw err;
    }
  };

  // 🔹 Refresh semua data
  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([
        fetchCalendarView(),
        fetchProjectSummary(),
        fetchUserActivity(),
        fetchProjectProgress()
      ]);
    } catch (err) {
      setError("Gagal memuat data dashboard");
      console.error("❌ Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Initial Load
  useEffect(() => {
    refreshData();
  }, []);

  return {
    calendarData,
    summaryData,
    userActivity,
    projectProgress,
    loading,
    error,
    refreshData,
  };
};

// Loading Component
const LoadingSpinner = () => {
  return (
    <div className="p-6 font-poppins bg-white rounded-4xl flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    </div>
  );
};

// Error Component
const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div className="p-6 font-poppins bg-white rounded-4xl flex items-center justify-center">
      <div className="bg-white p-6 rounded-2xl border border-red-200 max-w-md text-center">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Dashboard</h3>
        <p className="text-gray-600 mb-4">{message}</p>
        <button
          onClick={onRetry}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-2xl font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

// Summary Cards Component
const SummaryCards = ({ data }) => {
  const cards = [
    {
      title: 'Total Projects',
      value: data.total_projects,
      color: 'bg-blue-500',
      icon: FileText,
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Active Projects',
      value: data.active_projects,
      color: 'bg-green-500',
      icon: Clock,
      bgColor: 'bg-green-50'
    },
    {
      title: 'In Review',
      value: data.review_projects,
      color: 'bg-yellow-500',
      icon: AlertCircle,
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Completed',
      value: data.completed_projects,
      color: 'bg-purple-500',
      icon: CheckCircle2,
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Nearing Deadline',
      value: data.nearing_deadline,
      color: 'bg-red-500',
      icon: Calendar,
      bgColor: 'bg-red-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {cards.map((card, index) => (
        <div key={index} className="bg-gray-50 rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
            </div>
            <div className={`${card.bgColor} w-12 h-12 rounded-2xl flex items-center justify-center`}>
              <card.icon className={`w-6 h-6 ${card.color.replace('bg-', 'text-')}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Project Progress Component
const ProjectProgress = ({ progressData }) => {
  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-gray-50 rounded-2xl shadow-sm p-6 border border-gray-100">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Project Progress</h2>
      <div className="space-y-4">
        {progressData.map((project) => (
          <div key={project.project_id} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 truncate">
                {project.project_name}
              </span>
              <span className="text-sm text-gray-500">
                {project.progress_percentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getProgressColor(project.progress_percentage)} transition-all duration-300`}
                style={{ width: `${project.progress_percentage}%` }}
              ></div>
            </div>
          </div>
        ))}
        {progressData.length === 0 && (
          <p className="text-gray-500 text-center py-4">No project data available</p>
        )}
      </div>
    </div>
  );
};

// User Activity Component
const UserActivity = ({ data }) => {
  return (
    <div className="bg-gray-50 rounded-2xl shadow-sm p-6 border border-gray-100">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Team Activity</h2>
      
      {/* User Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50 rounded-2xl border border-blue-100">
          <p className="text-2xl font-bold text-blue-600">{data.total_users}</p>
          <p className="text-sm text-blue-600">Total Users</p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-2xl border border-green-100">
          <p className="text-2xl font-bold text-green-600">{data.active_users}</p>
          <p className="text-sm text-green-600">Active Now</p>
        </div>
      </div>

      {/* Top Users */}
      <div>
        <h3 className="font-medium text-gray-700 mb-3">Most Active Users</h3>
        <div className="space-y-3">
          {data.top_users.map((user, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white rounded-2xl border border-gray-100 hover:shadow-sm transition-all">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {user.full_name?.charAt(0) || 'U'}
                </div>
                <span className="font-medium text-gray-700">{user.full_name || 'Unknown User'}</span>
              </div>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {user.total_logs} tasks
              </span>
            </div>
          ))}
          {data.top_users.length === 0 && (
            <p className="text-gray-500 text-center py-2">No user activity data</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Project Calendar Component
const ProjectCalendar = ({ calendarData }) => {
  const navigate = useNavigate();

  const getStatusColor = (status) => {
    const colors = {
      'in_progress': 'bg-blue-100 text-blue-600',
      'review': 'bg-yellow-100 text-yellow-600',
      'done': 'bg-green-100 text-green-600'
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isDeadlineNear = (deadline) => {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  };

  const handleGoToBoard = (e, project_id) => {
    e.stopPropagation();
    navigate(`/admin/projects/${project_id}`);
  };

  return (
    <div className="bg-gray-50 rounded-2xl shadow-sm p-6 border border-gray-100">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Project Calendar</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Project Name</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Deadline</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {calendarData.map((project) => (
              <tr key={project.project_id} className="border-b border-gray-100 hover:bg-white transition-colors">
                <td className="py-3 px-4">
                  <div className="font-medium text-gray-900">{project.project_name}</div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm ${isDeadlineNear(project.deadline) ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                      {project.deadline ? formatDate(project.deadline) : 'No deadline'}
                    </span>
                    {isDeadlineNear(project.deadline) && (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full font-medium">
                        Urgent
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusColor(project.status)}`}>
                    {project.status?.replace('_', ' ') || 'Unknown'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <button 
                    onClick={(e) => handleGoToBoard(e, project.project_id)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
            {calendarData.length === 0 && (
              <tr>
                <td colSpan="4" className="py-8 text-center text-gray-500">
                  No projects found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const {
    calendarData,
    summaryData,
    userActivity,
    projectProgress,
    loading,
    error,
    refreshData
  } = useDashboard();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={refreshData} />;

  return (
    <div className="p-6 font-poppins bg-white rounded-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-600">Overview of projects and team activity</p>
          </div>
          <button
            onClick={refreshData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 transition-colors font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summaryData && <SummaryCards data={summaryData} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Project Progress */}
        <ProjectProgress progressData={projectProgress} />
        
        {/* User Activity */}
        {userActivity && <UserActivity data={userActivity} />}
      </div>

      {/* Calendar View */}
      <ProjectCalendar calendarData={calendarData} />
    </div>
  );
};

export default Dashboard;