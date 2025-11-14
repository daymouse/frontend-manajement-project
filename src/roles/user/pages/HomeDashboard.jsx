import React from 'react';
import { useHomeDashboard } from '../handler/HomeDashboard';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { ChevronLeft, ChevronRight, Target, Calendar as CalendarIcon } from 'lucide-react';

const localizer = momentLocalizer(moment);

const HomeDashboard = () => {
  const { loading, error, summary, projects } = useHomeDashboard();
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [view, setView] = React.useState('month');

  if (loading) return (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      <span className="ml-2 text-gray-600">Loading...</span>
    </div>
  );
  
  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
      <p className="text-red-600">⚠️ {error}</p>
    </div>
  );

  const calendarEvents = projects.map(p => ({
    id: p.id,
    title: p.name,
    start: new Date(p.created_at),
    end: new Date(p.deadline),
    allDay: true,
  }));

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
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

        <div className="text-lg font-semibold text-gray-800">
          {moment(toolbar.date).format('MMMM YYYY')}
        </div>

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
    );
  };

  return (
    <div className="p-6 font-poppins bg-white rounded-4xl">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Dashboard</h2>

      {/* Summary Cards */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1 p-6 bg-blue-50 rounded-3xl border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Projects Led</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{summary.projects_led}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
              <CalendarIcon className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-6 bg-green-50 rounded-3xl border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Tasks Owned</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{summary.tasks_owned}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
              <Target className="text-green-600" size={24} />
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-6 bg-yellow-50 rounded-3xl border border-yellow-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-medium">Projects Joined</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{summary.projects_joined}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center">
              <CalendarIcon className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Section */}
      <div className="bg-gray-50 rounded-3xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Projects Timeline</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Project Duration</span>
            </div>
          </div>
        </div>

        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          date={currentDate}
          view={view}
          onNavigate={(date) => setCurrentDate(date)}
          onView={(view) => setView(view)}
          components={{
            toolbar: CustomToolbar,
          }}
          eventPropGetter={(event) => ({
            style: {
              backgroundColor: '#3b82f6',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
              padding: '4px 8px',
            },
          })}
          dayPropGetter={() => ({
            style: {
              border: 'none',
            },
          })}
        />
      </div>
    </div>
  );
};

export default HomeDashboard;