import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar, LayoutList, Grid3x3, Filter, RotateCcw } from 'lucide-react';

function OverallCalendar({ onClose }) {
  // Start with January of current year (2026), showing 12 months
  const [startMonth, setStartMonth] = useState(() => new Date(2026, 0, 1)); // Jan 1, 2026
  const [viewMode, setViewMode] = useState('gantt'); // 'gantt' or 'grid'
  const [allProjects, setAllProjects] = useState([]); // All projects with colors
  const [sessions, setSessions] = useState({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Calculate end month (11 months after start month = 12 months total)
  const getEndMonth = () => {
    const end = new Date(startMonth);
    end.setMonth(end.getMonth() + 11);
    end.setDate(1); // First day of the 12th month
    // Get last day of that month
    const lastDay = new Date(end.getFullYear(), end.getMonth() + 1, 0);
    return lastDay;
  };

  // Get projects filtered for current visible range
  const getVisibleProjects = () => {
    const rangeStart = new Date(startMonth);
    const rangeEnd = getEndMonth();

    return allProjects.filter(project => {
      const startDate = project.start_date ? new Date(project.start_date) : null;
      const targetDate = project.target_date ? new Date(project.target_date) : null;

      // Include project if start or end date falls within the range, or spans across it
      return (startDate && startDate <= rangeEnd && (!targetDate || targetDate >= rangeStart)) ||
             (targetDate && targetDate >= rangeStart && (!startDate || startDate <= rangeEnd));
    });
  };

  // Color palette for projects
  const colorPalette = [
    { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-500', dot: '#3b82f6' },
    { bg: 'bg-green-500', border: 'border-green-500', text: 'text-green-500', dot: '#22c55e' },
    { bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-500', dot: '#a855f7' },
    { bg: 'bg-orange-500', border: 'border-orange-500', text: 'text-orange-500', dot: '#f97316' },
    { bg: 'bg-pink-500', border: 'border-pink-500', text: 'text-pink-500', dot: '#ec4899' },
    { bg: 'bg-teal-500', border: 'border-teal-500', text: 'text-teal-500', dot: '#14b8a6' },
    { bg: 'bg-indigo-500', border: 'border-indigo-500', text: 'text-indigo-500', dot: '#6366f1' },
    { bg: 'bg-rose-500', border: 'border-rose-500', text: 'text-rose-500', dot: '#f43f5e' },
  ];

  // Load all data once on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Fetch all projects
      const projectsResponse = await fetch(`${API_BASE_URL}/projects`);
      const projectsData = await projectsResponse.json();

      // Assign colors to ALL projects
      const projectsWithColors = projectsData.map((project, index) => ({
        ...project,
        color: colorPalette[index % colorPalette.length]
      }));

      setAllProjects(projectsWithColors);

      // Initialize selected projects (all by default)
      setSelectedProjects(projectsWithColors.map(p => p.id));

      // Fetch sessions for each project
      const sessionsData = {};
      for (const project of projectsWithColors) {
        try {
          const sessionsResponse = await fetch(`${API_BASE_URL}/knowledge/${project.id}`);
          const projectSessions = await sessionsResponse.json();
          sessionsData[project.id] = projectSessions;
        } catch (error) {
          console.error(`Error loading sessions for project ${project.id}:`, error);
          sessionsData[project.id] = [];
        }
      }

      setSessions(sessionsData);
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setStartMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setStartMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  const handleResetToCurrentYear = () => {
    const currentYear = new Date().getFullYear();
    setStartMonth(new Date(currentYear, 0, 1)); // January 1st of current year
  };

  // Format date range display (e.g., "Jan 2026 - Dec 2026" or "Nov 2025 - Oct 2026")
  const getDateRangeDisplay = () => {
    const endMonth = getEndMonth();
    const startStr = startMonth.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    const endStr = endMonth.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  };

  const toggleProjectFilter = (projectId) => {
    setSelectedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const getFilteredProjects = () => {
    // Start with projects visible in current date range
    const visibleProjects = getVisibleProjects();

    // Apply user filters on top
    return visibleProjects.filter(project => {
      // Filter by selected projects
      if (!selectedProjects.includes(project.id)) return false;

      // Filter by status
      if (selectedStatus !== 'all' && project.status !== selectedStatus) return false;

      // Filter by date range
      if (dateRange.start || dateRange.end) {
        const startDate = project.start_date ? new Date(project.start_date) : null;
        const targetDate = project.target_date ? new Date(project.target_date) : null;
        const rangeStart = dateRange.start ? new Date(dateRange.start) : null;
        const rangeEnd = dateRange.end ? new Date(dateRange.end) : null;

        if (rangeStart && targetDate && targetDate < rangeStart) return false;
        if (rangeEnd && startDate && startDate > rangeEnd) return false;
      }

      return true;
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full h-full max-w-[98vw] max-h-[98vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-secondary-300 bg-gradient-to-r from-primary-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-bold text-secondary-900">Overall Calendar</h2>
          </div>

          {/* Month Range Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-white rounded-lg transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-5 h-5 text-secondary-700" />
            </button>
            <span className="text-base font-semibold text-secondary-900 min-w-[200px] text-center">
              {getDateRangeDisplay()}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-white rounded-lg transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-5 h-5 text-secondary-700" />
            </button>
          </div>

          {/* View Toggle & Close */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetToCurrentYear}
              className="p-2 hover:bg-white rounded-lg transition-colors"
              title="Reset to Current Year"
            >
              <RotateCcw className="w-4 h-4 text-secondary-700" />
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-primary-100 text-primary-600' : 'hover:bg-white text-secondary-700'}`}
              title="Toggle Filters"
            >
              <Filter className="w-5 h-5" />
            </button>
            <div className="flex bg-secondary-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('gantt')}
                className={`px-3 py-1.5 rounded flex items-center gap-2 text-sm transition-colors ${
                  viewMode === 'gantt' ? 'bg-white text-primary-600 font-semibold shadow' : 'text-secondary-600'
                }`}
              >
                <LayoutList className="w-4 h-4" />
                Gantt
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded flex items-center gap-2 text-sm transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-primary-600 font-semibold shadow' : 'text-secondary-600'
                }`}
              >
                <Grid3x3 className="w-4 h-4" />
                Grid
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-5 h-5 text-secondary-700" />
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-4 bg-secondary-50 border-b border-secondary-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Project Filter */}
              <div>
                <label className="block text-sm font-semibold text-secondary-900 mb-2">Projects</label>
                <div className="max-h-40 overflow-y-auto bg-white border border-secondary-300 rounded p-2 space-y-1">
                  {allProjects.map(project => (
                    <label key={project.id} className="flex items-center gap-2 text-sm hover:bg-secondary-50 p-1 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedProjects.includes(project.id)}
                        onChange={() => toggleProjectFilter(project.id)}
                        className="rounded"
                      />
                      <span className={`w-3 h-3 rounded-full flex-shrink-0 ${project.color.bg}`}></span>
                      <span className="truncate">{project.project_name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-semibold text-secondary-900 mb-2">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-secondary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="on-hold">On Hold</option>
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-semibold text-secondary-900 mb-2">Date Range</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="flex-1 px-2 py-2 text-sm border border-secondary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="From"
                  />
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="flex-1 px-2 py-2 text-sm border border-secondary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="To"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="px-4 py-2 bg-secondary-50 border-b border-secondary-300 flex items-center gap-6 text-xs text-secondary-700">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Legend:</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-secondary-400"></span>
            <span>Session</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-0.5 h-4 bg-red-500"></span>
            <span>Deadline</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-3 bg-secondary-400"></span>
            <span>Project Duration</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-3"></div>
                <p className="text-sm text-secondary-600">Loading calendar data...</p>
              </div>
            </div>
          ) : getFilteredProjects().length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Calendar className="w-16 h-16 text-secondary-300 mx-auto mb-3" />
                <p className="text-lg font-semibold text-secondary-600 mb-1">No Projects Found</p>
                <p className="text-sm text-secondary-500">No projects match the selected filters for {getDateRangeDisplay()}</p>
              </div>
            </div>
          ) : viewMode === 'gantt' ? (
            <GanttView projects={getFilteredProjects()} sessions={sessions} startDate={startMonth} endDate={getEndMonth()} />
          ) : (
            <GridView projects={getFilteredProjects()} sessions={sessions} startDate={startMonth} endDate={getEndMonth()} />
          )}
        </div>
      </div>
    </div>
  );
}

// Gantt Timeline View Component
function GanttView({ projects, sessions, startDate, endDate }) {
  // Generate month labels for the 12-month range
  const getMonthLabels = () => {
    const labels = [];
    const current = new Date(startDate);
    for (let i = 0; i < 12; i++) {
      labels.push(current.toLocaleDateString('en-GB', { month: 'short' }));
      current.setMonth(current.getMonth() + 1);
    }
    return labels;
  };

  const months = getMonthLabels();

  // Calculate total days in the range
  const getTotalDays = () => {
    return Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  };

  // Calculate position and width for a date range
  const getBarStyle = (projectStart, projectEnd) => {
    const rangeStart = new Date(startDate);
    const rangeEnd = new Date(endDate);
    const totalDays = getTotalDays();

    const start = projectStart ? new Date(projectStart) : rangeStart;
    const end = projectEnd ? new Date(projectEnd) : rangeEnd;

    // Check if project extends beyond visible range boundaries
    const startsBefore = start < rangeStart;
    const endsAfter = end > rangeEnd;

    // Clamp to visible range boundaries
    const clampedStart = start < rangeStart ? rangeStart : start;
    const clampedEnd = end > rangeEnd ? rangeEnd : end;

    const startDay = Math.floor((clampedStart - rangeStart) / (1000 * 60 * 60 * 24));
    const endDay = Math.floor((clampedEnd - rangeStart) / (1000 * 60 * 60 * 24));

    const left = (startDay / totalDays) * 100;
    const width = ((endDay - startDay + 1) / totalDays) * 100;

    return { left: `${left}%`, width: `${width}%`, startsBefore, endsAfter };
  };

  // Get position for a single date
  const getDatePosition = (date) => {
    const rangeStart = new Date(startDate);
    const totalDays = getTotalDays();
    const targetDate = new Date(date);
    const daysSinceStart = Math.floor((targetDate - rangeStart) / (1000 * 60 * 60 * 24));
    return (daysSinceStart / totalDays) * 100;
  };

  return (
    <div className="space-y-4">
      {/* Month Headers */}
      <div className="sticky top-0 bg-white z-10 pb-2 border-b-2 border-secondary-300">
        <div className="flex">
          <div className="w-48 flex-shrink-0"></div>
          <div className="flex-1 flex">
            {months.map((month, index) => (
              <div
                key={month}
                className="flex-1 text-center text-xs font-semibold text-secondary-700 py-1 border-r border-secondary-200 last:border-r-0"
              >
                {month}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Project Rows Container with Single Today Marker */}
      <div className="relative">
        {/* Project Rows */}
        <div className="space-y-3">
          {projects.map(project => {
            const projectSessions = sessions[project.id] || [];
            const sessionsInRange = projectSessions.filter(session => {
              if (!session.scheduled_date) return false;
              const sessionDate = new Date(session.scheduled_date);
              return sessionDate >= startDate && sessionDate <= endDate;
            });

            const barStyle = project.start_date && project.target_date
              ? getBarStyle(project.start_date, project.target_date)
              : null;

            return (
              <div key={project.id} className="flex items-center gap-4">
                {/* Project Name */}
                <div className="w-48 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full flex-shrink-0 ${project.color.bg}`}></span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-secondary-900 truncate">{project.project_name}</p>
                      <p className="text-xs text-secondary-500">{project.handover_id}</p>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="flex-1 relative h-12 bg-secondary-50 rounded border border-secondary-200">
                  {/* Month dividers */}
                  {months.map((_, index) => (
                    <div
                      key={index}
                      className="absolute top-0 bottom-0 border-r border-secondary-200"
                      style={{ left: `${((index + 1) / 12) * 100}%` }}
                    ></div>
                  ))}

                  {/* Project Duration Bar */}
                  {barStyle && (
                    <div className="absolute top-1/2 -translate-y-1/2 h-6 z-5" style={{ left: barStyle.left, width: barStyle.width }}>
                      {/* Main bar */}
                      <div className={`h-full ${project.color.bg} opacity-30 rounded flex items-center justify-between px-0.5`}>
                        {/* Left arrow if project starts before year */}
                        {barStyle.startsBefore && (
                          <div className={`w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px] ${project.color.border} opacity-70`}
                            title={`Project started ${new Date(project.start_date).toLocaleDateString()}`}
                          ></div>
                        )}
                        {/* Right arrow if project ends after year */}
                        {barStyle.endsAfter && (
                          <div className={`w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[8px] ${project.color.border} opacity-70 ml-auto`}
                            title={`Project ends ${new Date(project.target_date).toLocaleDateString()}`}
                          ></div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Target Date Marker */}
                  {project.target_date && (() => {
                    const targetDate = new Date(project.target_date);
                    return targetDate >= startDate && targetDate <= endDate;
                  })() && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                      style={{ left: `${getDatePosition(project.target_date)}%` }}
                      title={`Deadline: ${new Date(project.target_date).toLocaleDateString()}`}
                    ></div>
                  )}

                  {/* Sessions */}
                  {sessionsInRange.map(session => (
                    <div
                      key={session.id}
                      className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 ${project.color.bg} rounded-full cursor-pointer hover:scale-150 transition-transform z-20`}
                      style={{ left: `${getDatePosition(session.scheduled_date)}%` }}
                      title={`${session.session_topic} - ${new Date(session.scheduled_date).toLocaleDateString()}`}
                    ></div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Single Today Marker - Spans All Projects */}
        {(() => {
          const today = new Date();
          if (today >= startDate && today <= endDate && projects.length > 0) {
            const todayPosition = getDatePosition(today);
            // Calculate left position: project name width (12rem) + gap (1rem) + position within timeline
            // The timeline takes up the remaining space, so todayPosition is a percentage of that space

            return (
              <div
                className="absolute -top-6 bottom-0 flex flex-col items-center z-30 pointer-events-none"
                style={{ left: `calc(13rem + (100% - 13rem) * ${todayPosition} / 100)` }}
              >
                {/* Marker line */}
                <div className="w-0.5 h-full bg-red-600"></div>
                {/* Marker dot at top */}
                <div className="absolute top-0 w-2 h-2 bg-red-600 rounded-full border border-white shadow-md"></div>
                {/* TODAY label */}
                <div className="absolute -top-1 px-1.5 py-0.5 bg-red-600 text-white text-[9px] font-bold rounded whitespace-nowrap">
                  TODAY
                </div>
              </div>
            );
          }
          return null;
        })()}
      </div>
    </div>
  );
}

// Grid View Component (12-month calendar)
function GridView({ projects, sessions, startDate, endDate }) {
  // Generate array of 12 month dates starting from startDate
  const getMonthDates = () => {
    const monthDates = [];
    const current = new Date(startDate);
    for (let i = 0; i < 12; i++) {
      monthDates.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }
    return monthDates;
  };

  const monthDates = getMonthDates();

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1; // Convert to Monday = 0
  };

  const getEventsForDate = (date) => {
    const events = [];

    projects.forEach(project => {
      const projectSessions = sessions[project.id] || [];

      // Check for sessions on this date
      const sessionOnDate = projectSessions.find(session => {
        if (!session.scheduled_date) return false;
        const sessionDate = new Date(session.scheduled_date);
        return sessionDate.toDateString() === date.toDateString();
      });

      if (sessionOnDate) {
        events.push({ type: 'session', project, session: sessionOnDate });
      }

      // Check for deadline on this date
      if (project.target_date) {
        const targetDate = new Date(project.target_date);
        if (targetDate.toDateString() === date.toDateString()) {
          events.push({ type: 'deadline', project });
        }
      }
    });

    return events;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {monthDates.map((monthDate, index) => {
        const monthName = monthDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
        const daysInMonth = getDaysInMonth(monthDate);
        const firstDay = getFirstDayOfMonth(monthDate);
        const days = [];

        // Empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
          days.push(<div key={`empty-${i}`} className="aspect-square"></div>);
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
          const events = getEventsForDate(date);
          const isToday = date.toDateString() === new Date().toDateString();

          days.push(
            <div
              key={day}
              className={`aspect-square border border-secondary-200 p-1 text-xs relative ${
                isToday ? 'bg-primary-50 border-primary-400' : 'bg-white'
              }`}
            >
              <div className={`font-semibold ${isToday ? 'text-primary-600' : 'text-secondary-700'}`}>
                {day}
              </div>
              {events.length > 0 && (
                <div className="flex gap-0.5 mt-0.5 flex-wrap">
                  {events.map((event, idx) => (
                    <div
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full ${event.project.color.bg}`}
                      title={event.type === 'session' ? event.session.session_topic : `${event.project.project_name} Deadline`}
                    ></div>
                  ))}
                </div>
              )}
            </div>
          );
        }

        return (
          <div key={`${monthDate.getFullYear()}-${monthDate.getMonth()}`} className="bg-white rounded-lg border-2 border-secondary-300 p-3">
            <h3 className="text-sm font-bold text-secondary-900 mb-2 text-center">{monthName}</h3>
            <div className="grid grid-cols-7 gap-0.5">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                <div key={idx} className="text-center text-xs font-semibold text-secondary-600 pb-1">
                  {day}
                </div>
              ))}
              {days}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default OverallCalendar;
