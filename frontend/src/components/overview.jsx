import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle, Clock, Users, Plus, X, Trash2, Edit, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { teamContactsAPI, checklistAPI, issuesAPI, phaseNamesAPI } from '../services/api';

const Overview = ({ project, setProject }) => {
  const [teamContacts, setTeamContacts] = useState([]);
  const [checklistItems, setChecklistItems] = useState([]);
  const [issues, setIssues] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [showNextEvent, setShowNextEvent] = useState(true);
  const [showProjectDetails, setShowProjectDetails] = useState(() => {
    if (project?.id) {
      const saved = sessionStorage.getItem(`showProjectDetails_${project.id}`);
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });
  const [phaseNames, setPhaseNames] = useState({
    'Phase 1': 'Phase 1: Pre-Handover Assessment',
    'Phase 2': 'Phase 2: Knowledge Transfer Sessions',
    'Phase 3': 'Phase 3: Final Sign-Offs'
  });
  const [newContact, setNewContact] = useState({ name: '', role: '', department: '', email: '', phone: '' });
  const [editContact, setEditContact] = useState({ name: '', role: '', department: '', email: '', phone: '' });
  const [saving, setSaving] = useState(false);

  const descriptionRef = useRef(null);
  const contextUsageRef = useRef(null);
  const previousProjectId = useRef(project?.id);

  // Save collapsed state to sessionStorage for current project
  useEffect(() => {
    if (project?.id) {
      sessionStorage.setItem(`showProjectDetails_${project.id}`, JSON.stringify(showProjectDetails));
    }
  }, [showProjectDetails, project?.id]);

  // Reset to expanded when switching to a different project
  useEffect(() => {
    if (project?.id && previousProjectId.current !== project?.id) {
      setShowProjectDetails(true);
      previousProjectId.current = project?.id;
    }
  }, [project?.id]);

  useEffect(() => {
    if (project?.id) {
      loadTeamContacts();
      loadChecklistItems();
      loadIssues();
      loadSessions();
      loadPhaseNamesFromStorage();
    }
  }, [project?.id]);

  const loadPhaseNamesFromStorage = async () => {
    try {
      const response = await phaseNamesAPI.get(project.id);
      const phaseNamesData = response.data;
      if (phaseNamesData.length > 0) {
        const phaseNameMap = {};
        phaseNamesData.forEach(pn => { phaseNameMap[pn.phase_id] = pn.phase_name; });
        setPhaseNames(phaseNameMap);
      }
    } catch (error) {
      console.error('Error loading phase names:', error);
    }
  };

  const loadTeamContacts = async () => {
    try {
      setLoading(true);
      const response = await teamContactsAPI.getContacts(project.id);
      setTeamContacts(response.data);
    } catch (error) {
      console.error('Error loading team contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChecklistItems = async () => {
    try {
      const response = await checklistAPI.getAll(project.id);
      setChecklistItems(response.data);
    } catch (error) {
      console.error('Error loading checklist:', error);
    }
  };

  const loadIssues = async () => {
    try {
      const response = await issuesAPI.getAll(project.id);
      setIssues(response.data);
    } catch (error) {
      console.error('Error loading issues:', error);
    }
  };

  const loadSessions = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE_URL}/knowledge/${project.id}`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const handleAddContact = async () => {
    if (!newContact.name || !newContact.role || !newContact.department) {
      alert('Please fill in Name, Role, and Department fields');
      return;
    }
    try {
      setSaving(true);
      await teamContactsAPI.addContact(project.id, newContact);
      setNewContact({ name: '', role: '', department: '', email: '', phone: '' });
      setShowAddForm(false);
      await loadTeamContacts();
    } catch (error) {
      console.error('Error adding team contact:', error);
      alert('Failed to add team member');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;
    try {
      await teamContactsAPI.deleteContact(project.id, contactId);
      await loadTeamContacts();
    } catch (error) {
      console.error('Error deleting team contact:', error);
      alert('Failed to delete team member');
    }
  };

  const handleEditClick = (contact) => {
    setEditingContact(contact.id);
    setEditContact({ name: contact.name, role: contact.role, department: contact.department, email: contact.email || '', phone: contact.phone || '' });
    setShowAddForm(false);
  };

  const handleUpdateContact = async () => {
    if (!editContact.name || !editContact.role || !editContact.department) {
      alert('Please fill in Name, Role, and Department fields');
      return;
    }
    try {
      setSaving(true);
      await teamContactsAPI.updateContact(project.id, editingContact, editContact);
      setEditingContact(null);
      setEditContact({ name: '', role: '', department: '', email: '', phone: '' });
      await loadTeamContacts();
    } catch (error) {
      console.error('Error updating team contact:', error);
      alert('Failed to update team member');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingContact(null);
    setEditContact({ name: '', role: '', department: '', email: '', phone: '' });
  };

  const calculateProjectScore = (priority, complexity) => {
    const priorityScores = { 'Alta': 3, 'Media': 2, 'Bassa': 1 };
    const complexityScores = { 'Alta': 3, 'Media': 2, 'Bassa': 1 };
    const priorityValue = priorityScores[priority] || 2;
    const complexityValue = complexityScores[complexity] || 2;
    return (priorityValue * 2) + (complexityValue * 3);
  };

  const handleChange = (field, value) => {
    const updatedProject = { ...project, [field]: value };
    if (field === 'business_priority' || field === 'complexity_level') {
      const priority = field === 'business_priority' ? value : (project.business_priority || 'Media');
      const complexity = field === 'complexity_level' ? value : (project.complexity_level || 'Media');
      updatedProject.project_score = calculateProjectScore(priority, complexity);
    }
    setProject(updatedProject);
  };

  const handleTextareaResize = (elementOrEvent) => {
    const element = elementOrEvent.target || elementOrEvent;
    if (element) {
      element.style.height = 'auto';
      element.style.height = element.scrollHeight + 'px';
    }
  };

  // Auto-resize textareas when component loads or project data changes
  useEffect(() => {
    if (descriptionRef.current) {
      handleTextareaResize(descriptionRef.current);
    }
    if (contextUsageRef.current) {
      handleTextareaResize(contextUsageRef.current);
    }
  }, [project?.description, project?.context_usage, showProjectDetails]);

  const calculatePhaseStatus = (phaseId) => {
    const phaseItems = checklistItems.filter(item => item.phase === phaseId);
    if (phaseItems.length === 0) return 'pending';
    const completedItems = phaseItems.filter(item => item.status === 'Complete').length;
    const inProgressItems = phaseItems.filter(item => item.status === 'In Progress').length;
    const completionPercentage = (completedItems / phaseItems.length) * 100;
    if (completionPercentage === 100) return 'complete';
    if (completionPercentage > 0 || inProgressItems > 0) return 'progress';
    return 'pending';
  };

  const calculatePhaseProgress = (phaseId) => {
    const phaseItems = checklistItems.filter(item => item.phase === phaseId);
    if (phaseItems.length === 0) return 0;
    const completedItems = phaseItems.filter(item => item.status === 'Complete').length;
    return Math.round((completedItems / phaseItems.length) * 100);
  };

  const calculateOverallProgress = () => {
    if (checklistItems.length === 0) return 0;
    const completedItems = checklistItems.filter(item => item.status === 'Complete').length;
    return Math.round((completedItems / checklistItems.length) * 100);
  };

  const getCompletedTasksCount = () => checklistItems.filter(item => item.status === 'Complete').length;
  const getInProgressTasksCount = () => checklistItems.filter(item => item.status === 'In Progress').length;
  const getNotStartedTasksCount = () => checklistItems.filter(item => item.status === 'Not Started').length;

  // Status color helper
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

  // Dynamic phases based on checklist data and custom phase names
  const phases = [
    { id: 'Phase 1', name: phaseNames['Phase 1'], duration: '2-4 weeks', status: calculatePhaseStatus('Phase 1'), progress: calculatePhaseProgress('Phase 1'), activities: 'Prerequisites completion, documentation review, initial assessment', criteria: 'All technical and documentation requirements met' },
    { id: 'Phase 2', name: phaseNames['Phase 2'], duration: '2-6 weeks', status: calculatePhaseStatus('Phase 2'), progress: calculatePhaseProgress('Phase 2'), activities: 'Training sessions, hands-on activities, shadow support', criteria: 'Team demonstrates competency in system operation' },
    { id: 'Phase 3', name: phaseNames['Phase 3'], duration: '1-2 weeks', status: calculatePhaseStatus('Phase 3'), progress: calculatePhaseProgress('Phase 3'), activities: 'Approvals, documentation handover, transition activities', criteria: 'All sign-offs completed and access transferred' },
  ];

  return (
    <div className="space-y-4">
      {/* Next Incoming Event */}
      {showNextEvent && (() => {
        const now = new Date();
        const upcomingSessions = sessions
          .filter(s => new Date(s.scheduled_date) >= now && s.status !== 'Cancelled')
          .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));

        const nextSession = upcomingSessions[0];

        if (nextSession) {
          const sessionDate = new Date(nextSession.scheduled_date);
          const daysUntil = Math.ceil((sessionDate - now) / (1000 * 60 * 60 * 24));

          return (
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded shadow-sm border border-primary-200 p-3 relative">
              {/* Close Button */}
              <button
                onClick={() => setShowNextEvent(false)}
                className="absolute top-2 right-2 p-1 text-secondary-400 hover:text-secondary-600 hover:bg-white hover:bg-opacity-60 rounded-full transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-start justify-between pr-6">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Calendar className="w-4 h-4 text-primary-600" />
                    <h3 className="text-xs font-semibold text-secondary-600 uppercase tracking-wide">Next Incoming Event</h3>
                  </div>
                  <h2 className="text-base font-bold text-secondary-900 mb-2">{nextSession.session_topic}</h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="flex items-center gap-1.5 text-secondary-700">
                      <Calendar className="w-3.5 h-3.5 text-primary-600" />
                      <div>
                        <div className="text-xs text-secondary-500">Date</div>
                        <div className="text-sm font-semibold">
                          {sessionDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-secondary-700">
                      <Clock className="w-3.5 h-3.5 text-primary-600" />
                      <div>
                        <div className="text-xs text-secondary-500">Time & Duration</div>
                        <div className="text-sm font-semibold">
                          {nextSession.start_time && <span className="text-primary-600">{nextSession.start_time}</span>}
                          {nextSession.start_time && nextSession.duration && <span className="text-secondary-400 mx-1">•</span>}
                          {nextSession.duration && <span>{nextSession.duration} h</span>}
                        </div>
                      </div>
                    </div>

                    {nextSession.attendees && (
                      <div className="flex items-start gap-1.5 text-secondary-700">
                        <Users className="w-3.5 h-3.5 text-primary-600 mt-0.5" />
                        <div>
                          <div className="text-xs text-secondary-500 mb-0.5">Attendees</div>
                          <div className="text-sm font-semibold">
                            {nextSession.attendees.split(',').map((attendee, index) => (
                              <div key={index}>{attendee.trim()}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {nextSession.notes && (
                    <div className="mt-2 text-xs text-secondary-600 bg-white bg-opacity-60 p-2 rounded">
                      {nextSession.notes}
                    </div>
                  )}
                </div>

                <div className="ml-3 text-center">
                  <div className="bg-primary-600 text-white rounded px-3 py-2 min-w-[60px]">
                    <div className="text-2xl font-bold">{daysUntil}</div>
                    <div className="text-xs uppercase tracking-wide">
                      {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Day' : 'Days'}
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium border mt-2 ${getStatusColor(nextSession.status)}`}>
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

      {/* Project Details Section */}
      <div className="bg-gradient-to-br from-white to-primary-50 rounded shadow-md border-2 border-primary-200 overflow-hidden">
        <div
          className="flex items-center justify-between cursor-pointer px-4 py-3 bg-gradient-to-r from-primary-100 to-primary-200 hover:from-primary-200 hover:to-primary-300 transition-colors border-b-2 border-primary-300"
          onClick={() => setShowProjectDetails(!showProjectDetails)}
        >
          <h2 className="text-base font-semibold text-secondary-900">Project Details</h2>
          {showProjectDetails ? (
            <ChevronUp className="w-5 h-5 text-secondary-700" />
          ) : (
            <ChevronDown className="w-5 h-5 text-secondary-700" />
          )}
        </div>

        {showProjectDetails && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
            <div>
              <label className="block text-xs font-semibold text-secondary-900 mb-1">Machine Family</label>
              <input
                type="text"
                value={project.machine_family || ''}
                onChange={(e) => handleChange('machine_family', e.target.value)}
                className="w-full px-2.5 py-1.5 text-sm bg-white border-2 border-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter machine family"
              />
            </div>
            <div>
              <div className="block text-xs font-semibold text-secondary-900 mb-1 invisible">Deliverable</div>
              <label className="flex items-center gap-2 cursor-pointer px-2.5 py-1.5">
                <input
                  type="checkbox"
                  checked={project.deliverable || false}
                  onChange={(e) => handleChange('deliverable', e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-primary-400 rounded focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-secondary-900">Deliverable (Voce a Listino)</span>
              </label>
            </div>
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-secondary-900 mb-1">Description</label>
              <textarea
                ref={descriptionRef}
                value={project.description || ''}
                onChange={(e) => {
                  handleChange('description', e.target.value);
                  handleTextareaResize(e);
                }}
                onInput={handleTextareaResize}
                className="w-full px-2.5 py-1.5 text-sm bg-white border-2 border-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none overflow-hidden"
                placeholder="Provide a detailed description of the project"
                rows="2"
                style={{ minHeight: '60px' }}
              />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-secondary-900 mb-1">Context and Usage</label>
              <textarea
                ref={contextUsageRef}
                value={project.context_usage || ''}
                onChange={(e) => {
                  handleChange('context_usage', e.target.value);
                  handleTextareaResize(e);
                }}
                onInput={handleTextareaResize}
                className="w-full px-2.5 py-1.5 text-sm bg-white border-2 border-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none overflow-hidden"
                placeholder="Describe the context and usage scenarios for this project"
                rows="2"
                style={{ minHeight: '60px' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Project Information and Quick Stats Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded shadow-sm border border-secondary-200 p-4">
          <h2 className="text-base font-semibold text-secondary-900 mb-3 pb-2 border-b border-secondary-200">Project Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-secondary-700 mb-1">Project Name <span className="text-danger-500">*</span></label>
              <input type="text" value={project.project_name || ''} onChange={(e) => handleChange('project_name', e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-secondary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Enter project name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-700 mb-1">Handover ID <span className="text-danger-500">*</span></label>
              <input type="text" value={project.handover_id || ''} onChange={(e) => handleChange('handover_id', e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-secondary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="HTD-YYYY-XXX" />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-700 mb-1">R&D Project Lead</label>
              <select value={project.rd_lead || ''} onChange={(e) => handleChange('rd_lead', e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-secondary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">Select R&D Team Member</option>
                {teamContacts.filter(contact => contact.department === 'R&D').map(contact => (<option key={contact.id} value={`${contact.name} (${contact.email || contact.role})`}>{contact.name} - {contact.role}</option>))}
              </select>
              {teamContacts.filter(c => c.department === 'R&D').length === 0 && <p className="text-xs text-warning-600 mt-0.5">No R&D team members added.</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-700 mb-1">Automation Team Lead</label>
              <select value={project.automation_lead || ''} onChange={(e) => handleChange('automation_lead', e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-secondary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">Select Automation Team Member</option>
                {teamContacts.filter(contact => contact.department === 'Automation').map(contact => (<option key={contact.id} value={`${contact.name} (${contact.email || contact.role})`}>{contact.name} - {contact.role}</option>))}
              </select>
              {teamContacts.filter(c => c.department === 'Automation').length === 0 && <p className="text-xs text-warning-600 mt-0.5">No Automation team members added.</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-700 mb-1">Start Date</label>
              <input type="date" value={project.start_date || ''} onChange={(e) => handleChange('start_date', e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-secondary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-700 mb-1">Target Completion Date</label>
              <input type="date" value={project.target_date || ''} onChange={(e) => handleChange('target_date', e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-secondary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-secondary-200">
            <h3 className="text-xs font-semibold text-secondary-700 mb-3">Project Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-secondary-700 mb-1">Project Priority</label>
                <select value={project.business_priority || 'Media'} onChange={(e) => handleChange('business_priority', e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-secondary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="Alta">Alta</option>
                  <option value="Media">Media</option>
                  <option value="Bassa">Bassa</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary-700 mb-1">Complexity Level</label>
                <select value={project.complexity_level || 'Media'} onChange={(e) => handleChange('complexity_level', e.target.value)} className="w-full px-2.5 py-1.5 text-sm border border-secondary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="Alta">Alta</option>
                  <option value="Media">Media</option>
                  <option value="Bassa">Bassa</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-secondary-700 mb-1">Project Score</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-secondary-50 px-2.5 py-1.5 border border-secondary-300 rounded text-sm text-secondary-700 font-semibold">{project.project_score || 0} / 15</div>
                  <div className="flex-1">
                    <div className="w-full bg-secondary-200 rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all duration-500 ${
                        (project.project_score || 0) >= 12 ? 'bg-danger-500' :
                        (project.project_score || 0) >= 9 ? 'bg-warning-500' :
                        (project.project_score || 0) >= 6 ? 'bg-warning-600' :
                        'bg-success-500'
                      }`} style={{ width: `${((project.project_score || 0) / 15) * 100}%` }} />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-secondary-500 mt-0.5">Calculated from Priority (weight: 2) and Complexity (weight: 3)</p>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded shadow-sm border border-secondary-200 p-3">
              <div className="text-xl font-bold text-primary-600 mb-0.5">{calculateOverallProgress()}%</div>
              <div className="text-xs text-secondary-600">Overall Progress</div>
            </div>
            <div className="bg-white rounded shadow-sm border border-secondary-200 p-3">
              <div className="text-xl font-bold text-success-600 mb-0.5">{getCompletedTasksCount()}</div>
              <div className="text-xs text-secondary-600">Tasks Completed</div>
            </div>
            <div className="bg-white rounded shadow-sm border border-secondary-200 p-3">
              <div className="text-xl font-bold text-warning-600 mb-0.5">{getInProgressTasksCount()}</div>
              <div className="text-xs text-secondary-600">Tasks In Progress</div>
            </div>
            <div className="bg-white rounded shadow-sm border border-secondary-200 p-3">
              <div className="text-xl font-bold text-secondary-600 mb-0.5">{getNotStartedTasksCount()}</div>
              <div className="text-xs text-secondary-600">Not Started</div>
            </div>
          </div>
          <div className="bg-white rounded shadow-sm border border-secondary-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-secondary-700" />
                <h3 className="text-sm font-semibold text-secondary-900">Team Composition</h3>
              </div>
              <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-1.5 px-2.5 py-1 bg-primary-600 text-white text-xs rounded hover:bg-primary-700 transition-colors">
                {showAddForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {showAddForm ? 'Cancel' : 'Add Member'}
              </button>
            </div>
            {showAddForm && (
              <div className="bg-primary-50 border border-primary-200 rounded p-3 mb-3">
                <h4 className="text-sm font-semibold text-primary-900 mb-2">Add New Team Member</h4>
                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-secondary-700 mb-0.5">Name <span className="text-danger-500">*</span></label>
                    <input type="text" value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} className="w-full px-2.5 py-1.5 text-sm border border-secondary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-secondary-700 mb-0.5">Role <span className="text-danger-500">*</span></label>
                    <input type="text" value={newContact.role} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} className="w-full px-2.5 py-1.5 text-sm border border-secondary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Project Lead" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-secondary-700 mb-0.5">Department <span className="text-danger-500">*</span></label>
                    <select value={newContact.department} onChange={(e) => setNewContact({ ...newContact, department: e.target.value })} className="w-full px-2.5 py-1.5 text-sm border border-secondary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="">Select Department</option>
                      <option value="R&D">R&D</option>
                      <option value="Automation">Automation</option>
                      <option value="QA">QA</option>
                      <option value="Operations">Operations</option>
                      <option value="Management">Management</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-secondary-700 mb-0.5">Email</label>
                    <input type="email" value={newContact.email} onChange={(e) => setNewContact({ ...newContact, email: e.target.value })} className="w-full px-2.5 py-1.5 text-sm border border-secondary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="john.doe@company.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-secondary-700 mb-0.5">Phone</label>
                    <input type="tel" value={newContact.phone} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} className="w-full px-2.5 py-1.5 text-sm border border-secondary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="+1-555-0123" />
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={handleAddContact} disabled={saving} className="px-3 py-1.5 text-sm bg-success-600 text-white rounded hover:bg-success-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{saving ? 'Adding...' : 'Add Team Member'}</button>
                  <button onClick={() => { setShowAddForm(false); setNewContact({ name: '', role: '', department: '', email: '', phone: '' }); }} className="px-3 py-1.5 text-sm bg-secondary-300 text-secondary-700 rounded hover:bg-secondary-400 transition-colors">Cancel</button>
                </div>
              </div>
            )}
            {loading ? (
              <div className="text-xs text-secondary-500 py-3">Loading team members...</div>
            ) : teamContacts.length === 0 ? (
              <div className="text-xs text-secondary-500 py-3">No team members added yet. Click "Add Member" to get started.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {teamContacts.map((contact) => (
                  <div key={contact.id} className="bg-secondary-50 rounded p-3 border border-secondary-200 relative group">
                    {editingContact === contact.id ? (
                      <div>
                        <h4 className="text-sm font-semibold text-secondary-900 mb-2">Edit Team Member</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                            <input type="text" value={editContact.name} onChange={(e) => setEditContact({ ...editContact, name: e.target.value })} className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Role <span className="text-red-500">*</span></label>
                            <input type="text" value={editContact.role} onChange={(e) => setEditContact({ ...editContact, role: e.target.value })} className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Department <span className="text-red-500">*</span></label>
                            <select value={editContact.department} onChange={(e) => setEditContact({ ...editContact, department: e.target.value })} className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                              <option value="">Select Department</option>
                              <option value="R&D">R&D</option>
                              <option value="Automation">Automation</option>
                              <option value="QA">QA</option>
                              <option value="Operations">Operations</option>
                              <option value="Management">Management</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                            <input type="email" value={editContact.email} onChange={(e) => setEditContact({ ...editContact, email: e.target.value })} className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                            <input type="tel" value={editContact.phone} onChange={(e) => setEditContact({ ...editContact, phone: e.target.value })} className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button onClick={handleUpdateContact} disabled={saving} className="flex-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
                          <button onClick={handleCancelEdit} className="flex-1 px-3 py-1.5 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition-colors">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="absolute top-1.5 right-1.5 flex gap-0.5 opacity-0 group-hover:opacity-100">
                          <button onClick={() => handleEditClick(contact)} className="p-1 bg-primary-100 text-primary-600 rounded hover:bg-primary-200 transition-colors" title="Edit team member"><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDeleteContact(contact.id)} className="p-1 bg-danger-100 text-danger-600 rounded hover:bg-danger-200 transition-colors" title="Remove team member"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                        <div className="flex items-start justify-between">
                          <div className="flex-1 pr-6">
                            <h4 className="text-sm font-semibold text-secondary-900">{contact.name}</h4>
                            <p className="text-xs text-secondary-600 mt-0.5">{contact.role}</p>
                            <div className="mt-1.5 space-y-0.5">
                              <p className="text-xs text-secondary-500"><span className="font-medium">Department:</span> {contact.department}</p>
                              {contact.email && <p className="text-xs text-primary-600"><a href={`mailto:${contact.email}`}>{contact.email}</a></p>}
                              {contact.phone && <p className="text-xs text-secondary-500">{contact.phone}</p>}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="bg-white rounded shadow-sm border border-secondary-200 p-4">
        <h2 className="text-base font-semibold text-secondary-900 mb-3 pb-2 border-b border-secondary-200">Handover Process Overview</h2>
        <div className="space-y-2">
          {phases.map((phase, index) => (
            <div key={index} className={`p-3 rounded border transition-all ${
                phase.status === 'complete' ? 'bg-success-50 border-success-200' :
                phase.status === 'progress' ? 'bg-warning-50 border-warning-200' : 'bg-secondary-50 border-secondary-200'
              }`}>
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    phase.status === 'complete' ? 'bg-success-500 text-white' :
                    phase.status === 'progress' ? 'bg-warning-500 text-white' : 'bg-secondary-300 text-secondary-600'
                  }`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-sm font-semibold text-secondary-900">{phase.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-primary-600">{phase.progress}%</span>
                      <span className="text-xs text-secondary-500">{phase.duration}</span>
                      {phase.status === 'complete' && <CheckCircle className="w-4 h-4 text-success-500" />}
                      {phase.status === 'progress' && <Clock className="w-4 h-4 text-warning-500" />}
                    </div>
                  </div>
                  <div className="w-full bg-secondary-200 rounded-full h-1.5 mb-2">
                    <div className={`h-1.5 rounded-full transition-all duration-500 ${
                        phase.status === 'complete' ? 'bg-success-500' :
                        phase.status === 'progress' ? 'bg-warning-500' : 'bg-secondary-400'
                      }`} style={{ width: `${phase.progress}%` }} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="font-medium text-secondary-700">Key Activities:</span>
                      <p className="text-secondary-600 mt-0.5">{phase.activities}</p>
                    </div>
                    <div>
                      <span className="font-medium text-secondary-700">Success Criteria:</span>
                      <p className="text-secondary-600 mt-0.5">{phase.criteria}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Overview;