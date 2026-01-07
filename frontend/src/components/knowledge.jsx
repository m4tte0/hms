// frontend/src/components/Knowledge.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Plus, Edit2, Trash2, X, Save, BookOpen, CheckCircle, AlertCircle, Star } from 'lucide-react';

const Knowledge = ({ projectId }) => {
  const [sessions, setSessions] = useState([]);
  const [teamContacts, setTeamContacts] = useState([]);
  const [project, setProject] = useState(null);
  const [phaseDates, setPhaseDates] = useState({});
  const [phaseNames, setPhaseNames] = useState({
    'Phase 1': 'Phase 1: Pre-Handover Assessment',
    'Phase 2': 'Phase 2: Knowledge Transfer Sessions',
    'Phase 3': 'Phase 3: Final Sign-Offs'
  });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedAttendees, setSelectedAttendees] = useState([]);
  const [editSelectedAttendees, setEditSelectedAttendees] = useState([]);
  const [customAttendee, setCustomAttendee] = useState('');
  const [editCustomAttendee, setEditCustomAttendee] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [newSession, setNewSession] = useState({
    session_topic: '',
    scheduled_date: '',
    start_time: '',
    duration: '',
    attendees: '',
    status: 'Scheduled',
    effectiveness_rating: null,
    notes: ''
  });

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (projectId) {
      loadProject();
      loadSessions();
      loadTeamContacts();
      loadPhaseDates();
      loadPhaseNames();
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data);
      }
    } catch (error) {
      console.error('Error loading project:', error);
    }
  };

  const loadPhaseDates = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/phase-dates/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        const datesMap = {};
        data.forEach(item => {
          datesMap[item.phase_id] = {
            startDate: item.start_date,
            endDate: item.end_date
          };
        });
        setPhaseDates(datesMap);
      }
    } catch (error) {
      console.error('Error loading phase dates:', error);
    }
  };

  const loadPhaseNames = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/phase-names/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          const phaseNameMap = {};
          data.forEach(pn => {
            phaseNameMap[pn.phase_id] = pn.phase_name;
          });
          setPhaseNames(phaseNameMap);
        }
      }
    } catch (error) {
      console.error('Error loading phase names:', error);
    }
  };

  const loadTeamContacts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/team-contacts/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setTeamContacts(data);
      }
    } catch (error) {
      console.error('Error loading team contacts:', error);
    }
  };

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/knowledge/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSession = async () => {
    if (!newSession.session_topic || !newSession.scheduled_date) {
      alert('Please fill in Topic and Date fields');
      return;
    }

    try {
      // Convert selected attendees to comma-separated string
      const attendeesString = selectedAttendees.join(', ');

      const response = await fetch(`${API_BASE_URL}/knowledge/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newSession,
          attendees: attendeesString
        })
      });

      if (response.ok) {
        await loadSessions();
        setShowAddModal(false);
        setSelectedAttendees([]);
        setCustomAttendee('');
        setNewSession({
          session_topic: '',
          scheduled_date: '',
          start_time: '',
          duration: '',
          attendees: '',
          status: 'Scheduled',
          effectiveness_rating: null,
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error adding session:', error);
    }
  };

  const handleUpdateSession = async () => {
    if (!editingSession) return;

    if (!editingSession.session_topic || !editingSession.scheduled_date) {
      alert('Please fill in Topic and Date fields');
      return;
    }

    try {
      // Convert selected attendees to comma-separated string
      const attendeesString = editSelectedAttendees.join(', ');

      const response = await fetch(`${API_BASE_URL}/knowledge/${projectId}/${editingSession.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_topic: editingSession.session_topic,
          scheduled_date: editingSession.scheduled_date,
          start_time: editingSession.start_time,
          duration: editingSession.duration,
          attendees: attendeesString,
          status: editingSession.status,
          effectiveness_rating: editingSession.effectiveness_rating,
          notes: editingSession.notes
        })
      });

      if (response.ok) {
        await loadSessions();
        setShowEditModal(false);
        setEditingSession(null);
        setEditSelectedAttendees([]);
        setEditCustomAttendee('');
      }
    } catch (error) {
      console.error('Error updating session:', error);
    }
  };

  const toggleAttendee = (attendeeName) => {
    setSelectedAttendees(prev =>
      prev.includes(attendeeName)
        ? prev.filter(name => name !== attendeeName)
        : [...prev, attendeeName]
    );
  };

  const toggleEditAttendee = (attendeeName) => {
    setEditSelectedAttendees(prev =>
      prev.includes(attendeeName)
        ? prev.filter(name => name !== attendeeName)
        : [...prev, attendeeName]
    );
  };

  const addCustomAttendee = () => {
    if (customAttendee.trim() && !selectedAttendees.includes(customAttendee.trim())) {
      setSelectedAttendees(prev => [...prev, customAttendee.trim()]);
      setCustomAttendee('');
    }
  };

  const addEditCustomAttendee = () => {
    if (editCustomAttendee.trim() && !editSelectedAttendees.includes(editCustomAttendee.trim())) {
      setEditSelectedAttendees(prev => [...prev, editCustomAttendee.trim()]);
      setEditCustomAttendee('');
    }
  };

  const removeAttendee = (attendeeName) => {
    setSelectedAttendees(prev => prev.filter(name => name !== attendeeName));
  };

  const removeEditAttendee = (attendeeName) => {
    setEditSelectedAttendees(prev => prev.filter(name => name !== attendeeName));
  };

  const openEditModal = (session) => {
    setEditingSession(session);
    // Parse existing attendees string into array
    const attendeesArray = session.attendees
      ? session.attendees.split(',').map(a => a.trim()).filter(a => a)
      : [];
    setEditSelectedAttendees(attendeesArray);
    setShowEditModal(true);
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;

    try {
      const response = await fetch(`${API_BASE_URL}/knowledge/${projectId}/${sessionToDelete.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadSessions();
        setShowDeleteModal(false);
        setSessionToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-success-100 text-success-800 border-success-300';
      case 'In Progress':
        return 'bg-primary-100 text-primary-800 border-primary-300';
      case 'Cancelled':
        return 'bg-danger-100 text-danger-800 border-danger-300';
      default:
        return 'bg-warning-100 text-warning-800 border-warning-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'In Progress':
        return <Clock className="w-4 h-4" />;
      case 'Cancelled':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  // Italian bank holidays for 2025
  const italianBankHolidays2025 = [
    '2025-01-01', // Capodanno
    '2025-01-06', // Epifania
    '2025-04-21', // Lunedì dell'Angelo (Easter Monday)
    '2025-04-25', // Festa della Liberazione
    '2025-05-01', // Festa dei Lavoratori
    '2025-06-02', // Festa della Repubblica
    '2025-08-15', // Ferragosto
    '2025-11-01', // Ognissanti
    '2025-12-08', // Immacolata Concezione
    '2025-12-25', // Natale
    '2025-12-26', // Santo Stefano
  ];

  // Calendar helper functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    // Get day of week (0=Sunday, 1=Monday, etc.) and adjust so Monday=0
    const startingDayOfWeek = firstDay.getDay();
    const adjustedStartDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

    return { daysInMonth, startingDayOfWeek: adjustedStartDay, year, month };
  };

  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };

  const isBankHoliday = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return italianBankHolidays2025.includes(dateStr);
  };

  const isSunday = (date) => {
    return date.getDay() === 0;
  };

  const getSessionsForDate = (date) => {
    return sessions.filter(session => {
      const sessionDate = new Date(session.scheduled_date);
      return sessionDate.toDateString() === date.toDateString();
    });
  };

  // Determine which phase a date belongs to
  const getPhaseForDate = (date) => {
    // Format date in local time to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    // Check each phase
    for (const phaseId of ['Phase 1', 'Phase 2', 'Phase 3']) {
      const phase = phaseDates[phaseId];
      if (phase?.startDate && phase?.endDate) {
        if (dateStr >= phase.startDate && dateStr <= phase.endDate) {
          return phaseId;
        }
      }
    }

    return null;
  };

  // Get phase color
  const getPhaseColor = (phaseId) => {
    const colors = {
      'Phase 1': 'bg-blue-400',
      'Phase 2': 'bg-yellow-400',
      'Phase 3': 'bg-green-400'
    };
    return colors[phaseId] || 'bg-secondary-300';
  };

  // Generate array of months between project start and end dates
  const getProjectMonths = () => {
    if (!project?.start_date || !project?.target_date) {
      // Default: show current month ± 2 months if no project dates
      const now = new Date();
      const months = [];
      for (let i = -2; i <= 2; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
        months.push(date);
      }
      return months;
    }

    // Parse dates in local time to avoid timezone offset issues
    const [startYear, startMonth, startDay] = project.start_date.split('-').map(Number);
    const [endYear, endMonthNum, endDay] = project.target_date.split('-').map(Number);

    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonthNum - 1, endDay);
    const months = [];

    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

    while (current <= endMonth) {
      months.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }

    return months;
  };

  const renderCompactMonth = (monthDate) => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(monthDate);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square"></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const daySessions = getSessionsForDate(date);
      const isToday = new Date().toDateString() === date.toDateString();
      const hasSessions = daySessions.length > 0;
      const phaseId = getPhaseForDate(date);
      const phaseColor = phaseId ? getPhaseColor(phaseId) : null;

      // Check if this is the project start or end date (fix timezone issue)
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isStartDate = project?.start_date === dateStr;
      const isEndDate = project?.target_date === dateStr;

      // Determine if we should show strip or use phase color as border
      const hasSpecialBackground = isToday || isStartDate || isEndDate || hasSessions;
      const showStripAtBottom = phaseColor && !hasSpecialBackground;

      // Start/End dates ALWAYS get their own borders, even if in a phase
      const usePhaseBorder = phaseColor && hasSpecialBackground && !isStartDate && !isEndDate;

      // Get the appropriate ring color
      let ringColorClass = '';
      // Priority: Start/End dates always get their specific borders
      if (isStartDate) {
        ringColorClass = 'ring-green-500';
      } else if (isEndDate) {
        ringColorClass = 'ring-red-500';
      } else if (usePhaseBorder) {
        // Use phase color for border (only for today/hasSessions, not start/end)
        const phaseBorderColors = {
          'Phase 1': 'ring-blue-400',
          'Phase 2': 'ring-yellow-400',
          'Phase 3': 'ring-green-400'
        };
        ringColorClass = phaseBorderColors[phaseId] || 'ring-secondary-300';
      } else {
        // Use default colors based on special state
        if (isToday) ringColorClass = 'ring-primary-500';
      }

      days.push(
        <button
          key={day}
          onClick={() => {
            setSelectedDate(date);
            setNewSession(prev => ({ ...prev, scheduled_date: dateStr }));
            setShowAddModal(true);
          }}
          className={`aspect-square text-xs font-medium rounded transition-all relative overflow-hidden
            ${isToday ? 'bg-primary-100 text-primary-700' :
              isStartDate ? 'bg-green-50 text-green-700 hover:bg-green-100' :
              isEndDate ? 'bg-red-50 text-red-700 hover:bg-red-100' :
              hasSessions ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' :
              'hover:bg-secondary-100 text-secondary-700'}
            ${hasSpecialBackground ? `ring-2 ${ringColorClass}` : ''}`}
        >
          <div className="relative z-10">
            {day}
          </div>
          {/* Phase color strip at bottom - only show if no special background */}
          {showStripAtBottom && (
            <div className={`absolute bottom-0 left-0 right-0 h-1 ${phaseColor}`}></div>
          )}
        </button>
      );
    }

    return (
      <div className="bg-white border border-secondary-200 rounded p-3">
        <div className="text-center mb-2">
          <div className="text-sm font-bold text-secondary-900">{monthNames[month]}</div>
          <div className="text-xs text-secondary-500">{year}</div>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayNames.map((name, i) => (
            <div key={i} className="text-[10px] font-semibold text-secondary-500 text-center">
              {name}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
      </div>
    );
  };

  const renderCalendar = () => {
    const projectMonths = getProjectMonths();

    return (
      <div className="bg-white rounded shadow-sm border border-secondary-200 p-6 group">
        {/* Calendar Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-secondary-900">
              Project Calendar
            </h2>
            <div className="flex items-center gap-2">
              {/* View Toggle - Always Visible */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`p-1.5 rounded transition-all ${
                    viewMode === 'calendar'
                      ? 'bg-primary-100 text-primary-600'
                      : 'text-secondary-600 hover:bg-secondary-100'
                  }`}
                  title="Calendar View"
                >
                  <Calendar className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded transition-all ${
                    viewMode === 'list'
                      ? 'bg-primary-100 text-primary-600'
                      : 'text-secondary-600 hover:bg-secondary-100'
                  }`}
                  title="List View"
                >
                  <BookOpen className="w-4 h-4" />
                </button>
              </div>
              {/* Add Session Button - Visible on Hover */}
              <button
                onClick={() => setShowAddModal(true)}
                className="p-1.5 bg-success-100 text-success-600 rounded hover:bg-success-200 transition-all opacity-0 group-hover:opacity-100"
                title="Add Session"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {/* First Row - Date Indicators */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-primary-100 border-2 border-primary-500"></div>
                <span className="text-secondary-600">Today</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-blue-50 border-2 border-blue-300"></div>
                <span className="text-secondary-600">Has Sessions</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-50 border-2 border-green-500"></div>
                <span className="text-secondary-600">Start Date</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-50 border-2 border-red-500"></div>
                <span className="text-secondary-600">End Date</span>
              </div>
            </div>
            {/* Second Row - Phase Indicators */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-4 h-1 bg-blue-400"></div>
                <span className="text-secondary-600">{phaseNames['Phase 1']}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-1 bg-yellow-400"></div>
                <span className="text-secondary-600">{phaseNames['Phase 2']}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-1 bg-green-400"></div>
                <span className="text-secondary-600">{phaseNames['Phase 3']}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Month Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {projectMonths.map((monthDate, index) => (
            <div key={index}>
              {renderCompactMonth(monthDate)}
            </div>
          ))}
        </div>

        {/* Sessions Summary */}
        <div className="mt-6 pt-4 border-t border-secondary-200">
          <div className="text-sm font-semibold text-secondary-900 mb-2">
            Quick Info
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded p-3">
              <div className="text-2xl font-bold text-blue-600">{sessions.length}</div>
              <div className="text-xs text-blue-700">Total Sessions</div>
            </div>
            <div className="bg-green-50 rounded p-3">
              <div className="text-2xl font-bold text-green-600">
                {sessions.filter(s => s.status === 'Completed').length}
              </div>
              <div className="text-xs text-green-700">Completed</div>
            </div>
            <div className="bg-yellow-50 rounded p-3">
              <div className="text-2xl font-bold text-yellow-600">
                {sessions.filter(s => s.status === 'Scheduled').length}
              </div>
              <div className="text-xs text-yellow-700">Scheduled</div>
            </div>
            <div className="bg-purple-50 rounded p-3">
              <div className="text-2xl font-bold text-purple-600">
                {projectMonths.length}
              </div>
              <div className="text-xs text-purple-700">Project Months</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderList = () => {
    const sortedSessions = [...sessions].sort((a, b) =>
      new Date(a.scheduled_date) - new Date(b.scheduled_date)
    );

    return (
      <div className="bg-white rounded shadow-sm border border-gray-200 p-6 group">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-secondary-900">All Sessions</h2>
          <div className="flex items-center gap-2">
            {/* View Toggle - Always Visible */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-1.5 rounded transition-all ${
                  viewMode === 'calendar'
                    ? 'bg-primary-100 text-primary-600'
                    : 'text-secondary-600 hover:bg-secondary-100'
                }`}
                title="Calendar View"
              >
                <Calendar className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-all ${
                  viewMode === 'list'
                    ? 'bg-primary-100 text-primary-600'
                    : 'text-secondary-600 hover:bg-secondary-100'
                }`}
                title="List View"
              >
                <BookOpen className="w-4 h-4" />
              </button>
            </div>
            {/* Add Session Button - Visible on Hover */}
            <button
              onClick={() => setShowAddModal(true)}
              className="p-1.5 bg-success-100 text-success-600 rounded hover:bg-success-200 transition-all opacity-0 group-hover:opacity-100"
              title="Add Session"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        {sortedSessions.length === 0 ? (
          <div className="text-center py-12 text-secondary-500">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-sm font-medium">No knowledge transfer sessions scheduled yet</p>
            <p className="text-sm mt-2">Click "Add Session" to schedule your first knowledge transfer session</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedSessions.map(session => (
              <div
                key={session.id}
                className="border border-gray-200 rounded p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <BookOpen className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-secondary-900 text-sm">{session.session_topic}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-secondary-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(session.scheduled_date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {session.duration}
                          </span>
                          {session.attendees && (
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {session.attendees}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(session.status)}`}>
                        {getStatusIcon(session.status)}
                        {session.status}
                      </span>
                      {session.effectiveness_rating && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-secondary-600 mr-1">Effectiveness:</span>
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < session.effectiveness_rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {session.notes && (
                      <p className="mt-3 text-sm text-secondary-600 bg-gray-50 p-3 rounded">
                        {session.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => openEditModal(session)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Edit session"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSessionToDelete(session);
                        setShowDeleteModal(true);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Calendar or List View */}
      {viewMode === 'calendar' ? renderCalendar() : renderList()}

      {/* Knowledge Transfer Progress */}
      {(() => {
        const completedSessions = sessions.filter(s => s.status === 'Completed').length;
        const totalSessions = sessions.length;
        const progressPercentage = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

        return (
          <div className="bg-white rounded shadow-sm border border-secondary-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-secondary-700" />
                <h3 className="text-sm font-semibold text-secondary-900">Knowledge Transfer Progress</h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-secondary-600">
                <span className="font-semibold text-success-600">
                  {completedSessions} / {totalSessions} sessions completed
                </span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="bg-secondary-50 rounded p-3">
              <div className="relative">
                {/* Progress Bar */}
                <div className="relative h-3 rounded-full overflow-hidden flex">
                  {/* Background */}
                  <div className="absolute inset-0 bg-secondary-200" />

                  {/* Progress Gradient */}
                  <div
                    className="absolute h-full bg-gradient-to-r from-blue-400 to-green-500 transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>

                {/* Progress Marker */}
                {totalSessions > 0 && (
                  <div
                    className="absolute top-0 flex flex-col items-center z-10"
                    style={{ left: `${progressPercentage}%`, transform: 'translateX(-50%)' }}
                  >
                    {/* Marker dot */}
                    <div className="w-3 h-3 bg-success-600 rounded-full border-2 border-white shadow-md"></div>
                    {/* Progress label */}
                    <div className="mt-1 px-2 py-0.5 bg-success-600 text-white text-xs font-bold rounded whitespace-nowrap">
                      {progressPercentage}%
                    </div>
                  </div>
                )}
              </div>

              {/* Labels */}
              <div className="flex justify-between items-center mt-8 text-xs">
                <div className="text-left">
                  <div className="text-secondary-500 font-medium">Not Started</div>
                  <div className="text-sm font-semibold text-secondary-900">
                    {sessions.filter(s => s.status === 'Scheduled').length} sessions
                  </div>
                </div>
                <div className="text-center bg-success-50 px-3 py-1 rounded">
                  <div className="text-secondary-500 font-medium">Completion</div>
                  <div className="text-sm font-semibold text-success-600">
                    {progressPercentage}%
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-secondary-500 font-medium">Completed</div>
                  <div className="text-sm font-semibold text-success-600">
                    {completedSessions} sessions
                  </div>
                </div>
              </div>
            </div>

            {/* Status Indicator */}
            <div className={`mt-3 p-2 rounded ${progressPercentage >= 100 ? 'bg-success-50' : progressPercentage >= 50 ? 'bg-primary-50' : 'bg-warning-50'}`}>
              <div className="flex items-center gap-2">
                {progressPercentage >= 100 ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-success-600 flex-shrink-0" />
                    <span className="text-xs font-medium text-success-800">
                      All knowledge transfer sessions completed
                    </span>
                  </>
                ) : progressPercentage >= 50 ? (
                  <>
                    <Clock className="w-4 h-4 text-primary-600 flex-shrink-0" />
                    <span className="text-xs font-medium text-primary-800">
                      Knowledge transfer in progress - {progressPercentage}% completed
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-warning-600 flex-shrink-0" />
                    <span className="text-xs font-medium text-warning-800">
                      Knowledge transfer starting - {totalSessions - completedSessions} sessions remaining
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Next Incoming Event */}
      {(() => {
        const now = new Date();
        const upcomingSessions = sessions
          .filter(s => new Date(s.scheduled_date) >= now && s.status !== 'Cancelled')
          .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));

        const nextSession = upcomingSessions[0];

        if (nextSession) {
          const sessionDate = new Date(nextSession.scheduled_date);
          const daysUntil = Math.ceil((sessionDate - now) / (1000 * 60 * 60 * 24));

          return (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded shadow-sm border border-blue-200 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-semibold text-secondary-600 uppercase tracking-wide">Next Incoming Event</h3>
                  </div>
                  <h2 className="text-base font-bold text-secondary-900 mb-3">{nextSession.session_topic}</h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2 text-secondary-700">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="text-xs text-secondary-500">Date</div>
                        <div className="font-semibold">
                          {sessionDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-secondary-700">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="text-xs text-secondary-500">Time & Duration</div>
                        <div className="font-semibold">
                          {nextSession.start_time && <span className="text-blue-600">{nextSession.start_time}</span>}
                          {nextSession.start_time && nextSession.duration && <span className="text-gray-400 mx-1">•</span>}
                          {nextSession.duration && <span>{nextSession.duration} h</span>}
                        </div>
                      </div>
                    </div>

                    {nextSession.attendees && (
                      <div className="flex items-start gap-2 text-secondary-700">
                        <Users className="w-4 h-4 text-blue-600 mt-1" />
                        <div>
                          <div className="text-xs text-secondary-500 mb-1">Attendees</div>
                          <div className="font-semibold">
                            {nextSession.attendees.split(',').map((attendee, index) => (
                              <div key={index}>{attendee.trim()}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {nextSession.notes && (
                    <div className="mt-3 text-sm text-secondary-600 bg-white bg-opacity-60 p-3 rounded">
                      {nextSession.notes}
                    </div>
                  )}
                </div>

                <div className="ml-4 text-center">
                  <div className="bg-blue-600 text-white rounded px-4 py-3 min-w-[80px]">
                    <div className="text-3xl font-bold">{daysUntil}</div>
                    <div className="text-xs uppercase tracking-wide">
                      {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Day' : 'Days'}
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border mt-3 ${getStatusColor(nextSession.status)}`}>
                    {getStatusIcon(nextSession.status)}
                    {nextSession.status}
                  </span>
                </div>
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* Add Session Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-secondary-900">Add New Session</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-secondary-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Session Topic <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSession.session_topic}
                  onChange={(e) => setNewSession({ ...newSession, session_topic: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., System Architecture Overview"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={newSession.scheduled_date}
                    onChange={(e) => setNewSession({ ...newSession, scheduled_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={newSession.start_time}
                    onChange={(e) => setNewSession({ ...newSession, start_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Duration</label>
                  <input
                    type="text"
                    value={newSession.duration}
                    onChange={(e) => setNewSession({ ...newSession, duration: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 2 hours"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Attendees</label>

                {/* Team Members */}
                {teamContacts.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs text-secondary-600 mb-1 font-medium">Team Members</div>
                    <div className="border border-gray-300 rounded-md p-3 max-h-36 overflow-y-auto bg-gray-50">
                      <div className="space-y-2">
                        {teamContacts.map(contact => (
                          <label key={contact.id} className="flex items-start gap-2 cursor-pointer hover:bg-white p-2 rounded">
                            <input
                              type="checkbox"
                              checked={selectedAttendees.includes(contact.name)}
                              onChange={() => toggleAttendee(contact.name)}
                              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-secondary-900">{contact.name}</div>
                              <div className="text-xs text-secondary-500">{contact.role} • {contact.department}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Custom Attendees */}
                <div>
                  <div className="text-xs text-secondary-600 mb-1 font-medium">Add Custom Attendee</div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customAttendee}
                      onChange={(e) => setCustomAttendee(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addCustomAttendee()}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Enter name and press Add"
                    />
                    <button
                      type="button"
                      onClick={addCustomAttendee}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-secondary-700 rounded-md transition-colors text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Selected Attendees */}
                {selectedAttendees.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs text-secondary-600 mb-2 font-medium">Selected Attendees</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedAttendees.map((attendee, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {attendee}
                          <button
                            onClick={() => removeAttendee(attendee)}
                            className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Notes</label>
                <textarea
                  value={newSession.notes}
                  onChange={(e) => setNewSession({ ...newSession, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Additional notes about this session..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-300 text-secondary-700 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSession}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Add Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Session Modal */}
      {showEditModal && editingSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-secondary-900">Edit Session</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-secondary-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Session Topic <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingSession.session_topic}
                  onChange={(e) => setEditingSession({ ...editingSession, session_topic: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., System Architecture Overview"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={editingSession.scheduled_date}
                    onChange={(e) => setEditingSession({ ...editingSession, scheduled_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={editingSession.start_time || ''}
                    onChange={(e) => setEditingSession({ ...editingSession, start_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Duration</label>
                  <input
                    type="text"
                    value={editingSession.duration || ''}
                    onChange={(e) => setEditingSession({ ...editingSession, duration: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 2 hours"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Attendees</label>

                {/* Team Members */}
                {teamContacts.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs text-secondary-600 mb-1 font-medium">Team Members</div>
                    <div className="border border-gray-300 rounded-md p-3 max-h-36 overflow-y-auto bg-gray-50">
                      <div className="space-y-2">
                        {teamContacts.map(contact => (
                          <label key={contact.id} className="flex items-start gap-2 cursor-pointer hover:bg-white p-2 rounded">
                            <input
                              type="checkbox"
                              checked={editSelectedAttendees.includes(contact.name)}
                              onChange={() => toggleEditAttendee(contact.name)}
                              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-secondary-900">{contact.name}</div>
                              <div className="text-xs text-secondary-500">{contact.role} • {contact.department}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Custom Attendees */}
                <div>
                  <div className="text-xs text-secondary-600 mb-1 font-medium">Add Custom Attendee</div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editCustomAttendee}
                      onChange={(e) => setEditCustomAttendee(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addEditCustomAttendee()}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Enter name and press Add"
                    />
                    <button
                      type="button"
                      onClick={addEditCustomAttendee}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-secondary-700 rounded-md transition-colors text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Selected Attendees */}
                {editSelectedAttendees.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs text-secondary-600 mb-2 font-medium">Selected Attendees</div>
                    <div className="flex flex-wrap gap-2">
                      {editSelectedAttendees.map((attendee, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {attendee}
                          <button
                            onClick={() => removeEditAttendee(attendee)}
                            className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Status</label>
                <select
                  value={editingSession.status}
                  onChange={(e) => setEditingSession({ ...editingSession, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Effectiveness Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setEditingSession({ ...editingSession, effectiveness_rating: rating })}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          rating <= (editingSession.effectiveness_rating || 0)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  {editingSession.effectiveness_rating && (
                    <button
                      onClick={() => setEditingSession({ ...editingSession, effectiveness_rating: null })}
                      className="ml-2 text-sm text-secondary-500 hover:text-secondary-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Notes</label>
                <textarea
                  value={editingSession.notes || ''}
                  onChange={(e) => setEditingSession({ ...editingSession, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="4"
                  placeholder="Session notes, outcomes, action items..."
                />
              </div>
            </div>

            <div className="flex justify-between items-center mt-6">
              <button
                onClick={() => {
                  setSessionToDelete(editingSession);
                  setShowDeleteModal(true);
                  setShowEditModal(false);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Session
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 text-secondary-700 rounded hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateSession}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && sessionToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-secondary-900">Delete Session?</h3>
                <p className="text-sm text-secondary-500">This action cannot be undone</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded p-4 mb-4">
              <p className="text-sm text-secondary-700 mb-2">You are about to delete:</p>
              <p className="font-semibold text-secondary-900">{sessionToDelete.session_topic}</p>
              <p className="text-sm text-secondary-600">
                {new Date(sessionToDelete.scheduled_date).toLocaleDateString()}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-secondary-700 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSession}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Knowledge;
