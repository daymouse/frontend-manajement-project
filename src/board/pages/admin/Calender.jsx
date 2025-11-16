import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { apiFetch } from '../../../Server';
import { ChevronLeft, ChevronRight, Target, CalendarIcon, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const localizer = momentLocalizer(moment);

// Hook untuk fetch data
const useCalendarData = (boardId) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({});
  const [tasks, setTasks] = useState({});

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch tasks data
        const tasksRes = await apiFetch(`/card/board/${boardId}`, "GET");
        console.log("Fetched tasks for calendar:", tasksRes);
        
        if (tasksRes.cards) {
          const grouped = { todo: [], in_progress: [], review: [], done: [] };
          tasksRes.cards.forEach((card) => {
            if (grouped[card.status]) grouped[card.status].push(card);
          });
          setTasks(grouped);

          // Update summary berdasarkan data tasks
          const allTasks = Object.values(grouped).flat();
          setSummary({
            projects_led: 0,
            tasks_owned: allTasks.length,
            projects_joined: 0,
            completed_tasks: grouped.done.length,
            in_progress_tasks: grouped.in_progress.length + grouped.review.length,
            todo_tasks: grouped.todo.length
          });
        }

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (boardId) {
      fetchDashboardData();
    }
  }, [boardId]);

  return {
    loading,
    error,
    summary,
    tasks
  };
};

// Komponen Kalender Utama
const CalendarComponent = () => {
  const { board_id } = useParams();
  const { loading, error, summary, tasks } = useCalendarData(board_id);
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [view, setView] = React.useState('month');
  const [selectedStatus, setSelectedStatus] = React.useState('all'); // Filter status

  if (loading) return (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      <span className="ml-2 text-gray-600">Loading tasks...</span>
    </div>
  );
  
  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
      <p className="text-red-600">⚠️ {error}</p>
    </div>
  );

  // Filter tasks berdasarkan status yang dipilih
  const filteredTasks = selectedStatus === 'all' 
    ? Object.values(tasks || {}).flat()
    : tasks[selectedStatus] || [];

  // Convert tasks to calendar events
  const calendarEvents = filteredTasks.map(task => ({
    id: task.card_id,
    title: task.card_title,
    start: new Date(task.created_at),
    end: new Date(task.due_date),
    allDay: true,
    status: task.status,
    priority: task.priority,
    hasAssignment: task.has_assignment
  }));

  // Custom event component - SEDERHANA: hanya menampilkan nama card
  const CustomEvent = ({ event }) => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'done': return 'bg-green-100 border-green-300 text-green-800';
        case 'in_progress': return 'bg-blue-100 border-blue-300 text-blue-800';
        case 'review': return 'bg-orange-100 border-orange-300 text-orange-800';
        case 'todo': return 'bg-gray-100 border-gray-300 text-gray-800';
        default: return 'bg-blue-100 border-blue-300 text-blue-800';
      }
    };

    return (
      <div className={`
        w-full h-full p-1 rounded-lg border text-xs font-medium
        ${getStatusColor(event.status)}
        flex items-center justify-center
      `}>
        <span className="font-semibold truncate text-center">{event.title}</span>
      </div>
    );
  };

  // Custom toolbar untuk kalender
  const CustomToolbar = (toolbar) => {
    const goToBack = () => {
      toolbar.onNavigate('PREV');
      setCurrentDate(moment(currentDate).subtract(1, view).toDate());
    };

    const goToNext = () => {
      toolbar.onNavigate('NEXT');
      setCurrentDate(moment(currentDate).add(1, view).toDate());
    };

    const goToCurrent = () => {
      toolbar.onNavigate('TODAY');
      setCurrentDate(new Date());
    };

    const changeView = (viewName) => {
      toolbar.onView(viewName);
      setView(viewName);
    };

    return (
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={goToBack}
            className="p-2 hover:bg-gray-100 rounded-2xl transition-colors border border-gray-200"
          >
            <ChevronLeft size={18} />
          </button>
          
          <button
            onClick={goToCurrent}
            className="flex items-center gap-1 px-3 py-2 hover:bg-gray-100 rounded-2xl transition-colors border border-gray-200 text-sm"
          >
            <Target size={16} />
            Today
          </button>
          
          <button
            onClick={goToNext}
            className="p-2 hover:bg-gray-100 rounded-2xl transition-colors border border-gray-200"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="text-lg font-semibold text-gray-800 text-center">
          {moment(toolbar.date).format('MMMM YYYY')}
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Status */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1 text-sm rounded-2xl bg-transparent border-none focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>
          </div>

          {/* View Selector */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl">
            <button
              onClick={() => changeView('month')}
              className={`px-3 py-1 text-sm rounded-2xl transition-colors ${
                view === 'month' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => changeView('week')}
              className={`px-3 py-1 text-sm rounded-2xl transition-colors ${
                view === 'week' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => changeView('day')}
              className={`px-3 py-1 text-sm rounded-2xl transition-colors ${
                view === 'day' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Day
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 lg:p- font-poppins bg-white rounded-b-2xl lg:rounded-b-4xl min-h-screen">
      <h2 className="text-xl lg:text-2xl font-semibold text-gray-800 mb-6">Task Calendar</h2>

      {/* Summary Cards - Mobile Friendly */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6 lg:mb-8">
        <div className="p-4 lg:p-6 bg-blue-50 rounded-2xl lg:rounded-3xl border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-xs lg:text-sm font-medium">Total Tasks</p>
              <p className="text-lg lg:text-2xl font-bold text-gray-800 mt-1">
                {summary.tasks_owned || 0}
              </p>
            </div>
            <div className="w-8 h-8 lg:w-12 lg:h-12 bg-blue-100 rounded-xl lg:rounded-2xl flex items-center justify-center">
              <CalendarIcon className="text-blue-600" size={18} />
            </div>
          </div>
        </div>
        
        <div className="p-4 lg:p-6 bg-green-50 rounded-2xl lg:rounded-3xl border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-xs lg:text-sm font-medium">Completed</p>
              <p className="text-lg lg:text-2xl font-bold text-gray-800 mt-1">
                {summary.completed_tasks || 0}
              </p>
            </div>
            <div className="w-8 h-8 lg:w-12 lg:h-12 bg-green-100 rounded-xl lg:rounded-2xl flex items-center justify-center">
              <CheckCircle className="text-green-600" size={18} />
            </div>
          </div>
        </div>
        
        <div className="p-4 lg:p-6 bg-yellow-50 rounded-2xl lg:rounded-3xl border border-yellow-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-xs lg:text-sm font-medium">In Progress</p>
              <p className="text-lg lg:text-2xl font-bold text-gray-800 mt-1">
                {summary.in_progress_tasks || 0}
              </p>
            </div>
            <div className="w-8 h-8 lg:w-12 lg:h-12 bg-yellow-100 rounded-xl lg:rounded-2xl flex items-center justify-center">
              <Clock className="text-yellow-600" size={18} />
            </div>
          </div>
        </div>

        <div className="p-4 lg:p-6 bg-gray-50 rounded-2xl lg:rounded-3xl border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs lg:text-sm font-medium">To Do</p>
              <p className="text-lg lg:text-2xl font-bold text-gray-800 mt-1">
                {summary.todo_tasks || 0}
              </p>
            </div>
            <div className="w-8 h-8 lg:w-12 lg:h-12 bg-gray-100 rounded-xl lg:rounded-2xl flex items-center justify-center">
              <AlertCircle className="text-gray-600" size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Section - LEBIH BESAR */}
      <div className="bg-gray-50 rounded-2xl lg:rounded-3xl p-4 lg:p-6 border border-gray-200">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-4 lg:mb-6 gap-3">
          <h3 className="text-base lg:text-lg font-semibold text-gray-800">
            Task Timeline {selectedStatus !== 'all' && `- ${selectedStatus.replace('_', ' ').toUpperCase()}`}
          </h3>
          <div className="flex flex-wrap gap-3 lg:gap-4 text-xs lg:text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 lg:w-3 lg:h-3 bg-green-500 rounded-full"></div>
              <span>Done</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 lg:w-3 lg:h-3 bg-blue-500 rounded-full"></div>
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 lg:w-3 lg:h-3 bg-orange-500 rounded-full"></div>
              <span>Review</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 lg:w-3 lg:h-3 bg-gray-500 rounded-full"></div>
              <span>To Do</span>
            </div>
          </div>
        </div>

        <div className="calendar-container">
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ 
              height: 600, // LEBIH TINGGI
              fontSize: '14px'
            }}
            date={currentDate}
            view={view}
            onNavigate={(date) => setCurrentDate(date)}
            onView={(view) => setView(view)}
            components={{
              toolbar: CustomToolbar,
              event: CustomEvent
            }}
            eventPropGetter={(event) => ({
              style: {
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '8px',
                padding: '1px',
                minHeight: '24px'
              },
            })}
            dayPropGetter={() => ({
              style: {
                border: 'none',
                minHeight: '100px'
              },
            })}
            // Mobile optimizations
            popup
            showMultiDayTimes
          />
        </div>

        {/* Info */}
        <div className="mt-4 lg:mt-6 pt-4 border-t border-gray-200">
          <div className="text-xs lg:text-sm text-gray-600">
            <p>📅 Each card shows from <strong>created date</strong> to <strong>due date</strong></p>
            <p className="mt-1">Showing <strong>{calendarEvents.length}</strong> tasks with status: <strong>{selectedStatus === 'all' ? 'All' : selectedStatus.replace('_', ' ')}</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarComponent;