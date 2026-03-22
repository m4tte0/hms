import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle, Clock, Users, Plus, X, Trash2, Edit, Calendar, ChevronDown, ChevronUp, Star, Circle, Layers } from 'lucide-react';
import { teamContactsAPI, checklistAPI, issuesAPI, phaseNamesAPI, phaseDatesAPI } from '../services/api';

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
    'Phase 1': 'Fase 1: Valutazione pre-consegna',
    'Phase 2': 'Fase 2: Sessioni di trasferimento know-how',
    'Phase 3': 'Fase 3: Approvazioni finali'
  });
  const [phaseDates, setPhaseDates] = useState({});
  const [editingPhase, setEditingPhase] = useState(null);
  const [phaseEditData, setPhaseEditData] = useState({ startDate: '', endDate: '' });
  const [newContact, setNewContact] = useState({ name: '', role: '', department: '', email: '', phone: '' });
  const [newContactCustomDept, setNewContactCustomDept] = useState('');
  const [editContact, setEditContact] = useState({ name: '', role: '', department: '', email: '', phone: '' });
  const [editContactCustomDept, setEditContactCustomDept] = useState('');
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
      loadPhaseDates();
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

  const loadPhaseDates = async () => {
    try {
      const response = await phaseDatesAPI.get(project.id);
      const phaseDatesData = response.data;
      const phaseDatesMap = {};
      phaseDatesData.forEach(pd => {
        phaseDatesMap[pd.phase_id] = {
          startDate: pd.start_date,
          endDate: pd.end_date
        };
      });
      setPhaseDates(phaseDatesMap);
    } catch (error) {
      console.error('Error loading phase dates:', error);
    }
  };

  const handleEditPhaseClick = (phaseId) => {
    const dates = phaseDates[phaseId] || { startDate: '', endDate: '' };
    setPhaseEditData(dates);
    setEditingPhase(phaseId);
  };

  const handleSavePhaseDate = async (phaseId) => {
    try {
      setSaving(true);
      await phaseDatesAPI.save(project.id, phaseId, phaseEditData.startDate, phaseEditData.endDate);
      await loadPhaseDates();
      setEditingPhase(null);
    } catch (error) {
      console.error('Error saving phase dates:', error);
      alert('Impossibile salvare le date della fase');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelPhaseEdit = () => {
    setEditingPhase(null);
    setPhaseEditData({ startDate: '', endDate: '' });
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
    const deptValue = newContact.department === 'Altro' ? newContactCustomDept.trim() : newContact.department;
    if (!newContact.name || !newContact.role || !deptValue) {
      alert('Compila i campi Nome, Ruolo e Reparto');
      return;
    }
    try {
      setSaving(true);
      await teamContactsAPI.addContact(project.id, { ...newContact, department: deptValue });
      setNewContact({ name: '', role: '', department: '', email: '', phone: '' });
      setNewContactCustomDept('');
      setShowAddForm(false);
      await loadTeamContacts();
    } catch (error) {
      console.error('Error adding team contact:', error);
      alert('Impossibile aggiungere il membro del team');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (!confirm('Sei sicuro di voler rimuovere questo membro del team?')) return;
    try {
      // Check if the deleted member is a lead
      const memberToDelete = teamContacts.find(c => c.id === contactId);
      if (memberToDelete) {
        const memberIdentifier = `${memberToDelete.name} (${memberToDelete.role})`;
        if (project.rd_lead === memberIdentifier && memberToDelete.department === 'R&D') {
          handleChange('rd_lead', '');
        }
        if (project.automation_lead === memberIdentifier && memberToDelete.department === 'Automazione') {
          handleChange('automation_lead', '');
        }
      }

      await teamContactsAPI.deleteContact(project.id, contactId);
      await loadTeamContacts();
    } catch (error) {
      console.error('Error deleting team contact:', error);
      alert('Impossibile eliminare il membro del team');
    }
  };

  const handleSetAsLead = (contact) => {
    const memberIdentifier = `${contact.name} (${contact.role})`;
    if (contact.department === 'R&D') {
      handleChange('rd_lead', memberIdentifier);
    } else if (contact.department === 'Automazione') {
      handleChange('automation_lead', memberIdentifier);
    }
  };

  const handleEditClick = (contact) => {
    setEditingContact(contact.id);
    const standardDepts = ['R&D', 'Automazione', 'Ufficio Meccanico', 'Collaudo'];
    const isStandard = standardDepts.includes(contact.department);
    setEditContact({ name: contact.name, role: contact.role, department: isStandard ? contact.department : 'Altro', email: contact.email || '', phone: contact.phone || '' });
    setEditContactCustomDept(isStandard ? '' : contact.department);
    setShowAddForm(false);
  };

  const handleUpdateContact = async () => {
    const deptValue = editContact.department === 'Altro' ? editContactCustomDept.trim() : editContact.department;
    if (!editContact.name || !editContact.role || !deptValue) {
      alert('Compila i campi Nome, Ruolo e Reparto');
      return;
    }
    try {
      setSaving(true);
      await teamContactsAPI.updateContact(project.id, editingContact, { ...editContact, department: deptValue });
      setEditingContact(null);
      setEditContact({ name: '', role: '', department: '', email: '', phone: '' });
      setEditContactCustomDept('');
      await loadTeamContacts();
    } catch (error) {
      console.error('Error updating team contact:', error);
      alert('Impossibile aggiornare il membro del team');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingContact(null);
    setEditContact({ name: '', role: '', department: '', email: '', phone: '' });
    setEditContactCustomDept('');
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

  // Close add/edit forms when switching projects
  useEffect(() => {
    setShowAddForm(false);
    setEditingContact(null);
  }, [project?.id]);

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

  // Timeline calculation
  const calculateTimeline = () => {
    if (!project?.start_date || !project?.target_date) return null;

    const start = new Date(project.start_date);
    const end = new Date(project.target_date);
    const today = new Date();

    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil((today - start) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    const timeProgress = Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));

    return {
      totalDays,
      elapsedDays,
      remainingDays,
      timeProgress,
      start,
      end
    };
  };

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
    { id: 'Phase 1', name: phaseNames['Phase 1'], duration: '2-4 settimane', status: calculatePhaseStatus('Phase 1'), progress: calculatePhaseProgress('Phase 1'), activities: 'Completamento prerequisiti, revisione documentazione, valutazione iniziale', criteria: 'Tutti i requisiti tecnici e documentali soddisfatti' },
    { id: 'Phase 2', name: phaseNames['Phase 2'], duration: '2-6 settimane', status: calculatePhaseStatus('Phase 2'), progress: calculatePhaseProgress('Phase 2'), activities: 'Sessioni di formazione, attività pratiche, supporto in affiancamento', criteria: 'Il team dimostra competenza nell\'operatività del sistema' },
    { id: 'Phase 3', name: phaseNames['Phase 3'], duration: '1-2 settimane', status: calculatePhaseStatus('Phase 3'), progress: calculatePhaseProgress('Phase 3'), activities: 'Approvazioni, consegna documentazione, attività di transizione', criteria: 'Tutte le approvazioni completate e accessi trasferiti' },
  ];

  return (
    <div className="space-y-4 pb-24">
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
                title="Chiudi"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-start justify-between pr-6">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Calendar className="w-4 h-4 text-primary-600" />
                    <h3 className="text-xs font-semibold text-secondary-600 uppercase tracking-wide">Prossimo evento in arrivo</h3>
                  </div>
                  <h2 className="text-base font-bold text-secondary-900 mb-2">{nextSession.session_topic}</h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="flex items-center gap-1.5 text-secondary-700">
                      <Calendar className="w-3.5 h-3.5 text-primary-600" />
                      <div>
                        <div className="text-xs text-secondary-500">Data</div>
                        <div className="font-semibold">
                          {sessionDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-secondary-700">
                      <Clock className="w-3.5 h-3.5 text-primary-600" />
                      <div>
                        <div className="text-xs text-secondary-500">Ora e durata</div>
                        <div className="font-semibold">
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
                          <div className="text-xs text-secondary-500 mb-0.5">Partecipanti</div>
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
                    <div className="mt-2 text-xs text-secondary-600 bg-white bg-opacity-60 p-2 rounded">
                      {nextSession.notes}
                    </div>
                  )}
                </div>

                <div className="ml-3 text-center">
                  <div className="bg-primary-600 text-white rounded px-3 py-2 min-w-[60px]">
                    <div className="text-2xl font-bold">{daysUntil}</div>
                    <div className="text-xs uppercase tracking-wide">
                      {daysUntil === 0 ? 'Oggi' : daysUntil === 1 ? 'Giorno' : 'Giorni'}
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
          <h2 className="text-base font-semibold text-secondary-900">Dettagli progetto</h2>
          {showProjectDetails ? (
            <ChevronUp className="w-5 h-5 text-secondary-700" />
          ) : (
            <ChevronDown className="w-5 h-5 text-secondary-700" />
          )}
        </div>

        {showProjectDetails && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
            <div>
              <label className="block font-semibold text-secondary-900 mb-1">Famiglia macchina</label>
              <input
                type="text"
                value={project.machine_family || ''}
                onChange={(e) => handleChange('machine_family', e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border-2 border-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Inserisci la famiglia macchina"
              />
            </div>
            <div>
              <div className="block font-semibold text-secondary-900 mb-1 invisible">Deliverable</div>
              <label className="flex items-center gap-2 cursor-pointer px-2.5 py-1.5">
                <input
                  type="checkbox"
                  checked={project.deliverable || false}
                  onChange={(e) => handleChange('deliverable', e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-primary-400 rounded focus:ring-2 focus:ring-primary-500"
                />
                <span className="font-medium text-secondary-900">Deliverable (Voce a Listino)</span>
              </label>
            </div>
            <div className="lg:col-span-2">
              <label className="block font-semibold text-secondary-900 mb-1">Descrizione</label>
              <textarea
                ref={descriptionRef}
                value={project.description || ''}
                onChange={(e) => {
                  handleChange('description', e.target.value);
                  handleTextareaResize(e);
                }}
                onInput={handleTextareaResize}
                className="w-full px-2.5 py-1.5 bg-white border-2 border-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none overflow-hidden"
                placeholder="Fornisci una descrizione dettagliata del progetto"
                rows="2"
                style={{ minHeight: '60px' }}
              />
            </div>
            <div className="lg:col-span-2">
              <label className="block font-semibold text-secondary-900 mb-1">Contesto e utilizzo</label>
              <textarea
                ref={contextUsageRef}
                value={project.context_usage || ''}
                onChange={(e) => {
                  handleChange('context_usage', e.target.value);
                  handleTextareaResize(e);
                }}
                onInput={handleTextareaResize}
                className="w-full px-2.5 py-1.5 bg-white border-2 border-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none overflow-hidden"
                placeholder="Descrivi il contesto e gli scenari d'uso per questo progetto"
                rows="2"
                style={{ minHeight: '60px' }}
              />
            </div>

            {/* Project Timeline Summary */}
            {(() => {
              const timeline = calculateTimeline();
              const overallProgress = calculateOverallProgress();

              if (!timeline) return null;

              return (
                <div className="lg:col-span-2">
                  <div className="bg-white rounded border-2 border-primary-300 p-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-secondary-700" />
                        <h3 className="font-semibold text-secondary-900">Cronologia del progetto</h3>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-secondary-600">
                        <span className={`font-semibold ${timeline.remainingDays < 0 ? 'text-danger-600' : timeline.remainingDays < 7 ? 'text-warning-600' : 'text-success-600'}`}>
                          {timeline.remainingDays} giorni rimanenti
                        </span>
                      </div>
                    </div>

                    {/* Visual Timeline with Phase Colors */}
                    <div className="mb-4 bg-secondary-50 rounded p-3">
                      <div className="relative">
                        {/* Timeline Bar with Phase Segments */}
                        <div className="relative h-3 rounded-full overflow-hidden flex">
                          {(() => {
                            // Calculate phase segments based on dates
                            const phaseSegments = [];
                            const phaseColors = {
                              'Phase 1': { bg: 'bg-blue-400', gradient: 'from-blue-300 to-blue-500' },
                              'Phase 2': { bg: 'bg-yellow-400', gradient: 'from-yellow-300 to-yellow-500' },
                              'Phase 3': { bg: 'bg-green-400', gradient: 'from-green-300 to-green-500' }
                            };

                            // Check if we have phase dates
                            const hasPhase1 = phaseDates['Phase 1']?.startDate && phaseDates['Phase 1']?.endDate;
                            const hasPhase2 = phaseDates['Phase 2']?.startDate && phaseDates['Phase 2']?.endDate;
                            const hasPhase3 = phaseDates['Phase 3']?.startDate && phaseDates['Phase 3']?.endDate;

                            if (hasPhase1 || hasPhase2 || hasPhase3) {
                              // Calculate positions based on actual dates
                              ['Phase 1', 'Phase 2', 'Phase 3'].forEach(phaseId => {
                                if (phaseDates[phaseId]?.startDate && phaseDates[phaseId]?.endDate) {
                                  const phaseStart = new Date(phaseDates[phaseId].startDate);
                                  const phaseEnd = new Date(phaseDates[phaseId].endDate);

                                  const startPercent = Math.max(0, Math.min(100,
                                    ((phaseStart - timeline.start) / (timeline.end - timeline.start)) * 100
                                  ));
                                  const endPercent = Math.max(0, Math.min(100,
                                    ((phaseEnd - timeline.start) / (timeline.end - timeline.start)) * 100
                                  ));

                                  phaseSegments.push({
                                    id: phaseId,
                                    start: startPercent,
                                    width: endPercent - startPercent,
                                    color: phaseColors[phaseId]
                                  });
                                }
                              });
                            } else {
                              // Default: divide equally into 3 phases (using max durations: 4, 6, 2 weeks = 33%, 50%, 17%)
                              phaseSegments.push(
                                { id: 'Phase 1', start: 0, width: 33, color: phaseColors['Phase 1'] },
                                { id: 'Phase 2', start: 33, width: 50, color: phaseColors['Phase 2'] },
                                { id: 'Phase 3', start: 83, width: 17, color: phaseColors['Phase 3'] }
                              );
                            }

                            // Sort segments by start position
                            phaseSegments.sort((a, b) => a.start - b.start);

                            return (
                              <>
                                {/* Background */}
                                <div className="absolute inset-0 bg-secondary-200" />

                                {/* Phase segments */}
                                {phaseSegments.map((segment) => (
                                  <div
                                    key={segment.id}
                                    className={`absolute h-full bg-gradient-to-r ${segment.color.gradient}`}
                                    style={{ left: `${segment.start}%`, width: `${segment.width}%` }}
                                  />
                                ))}
                              </>
                            );
                          })()}
                        </div>

                        {/* Phase End Markers */}
                        {(() => {
                          const markers = [];
                          ['Phase 1', 'Phase 2'].forEach((phaseId, index) => {
                            if (phaseDates[phaseId]?.endDate) {
                              const phaseEnd = new Date(phaseDates[phaseId].endDate);
                              const endPercent = Math.max(0, Math.min(100,
                                ((phaseEnd - timeline.start) / (timeline.end - timeline.start)) * 100
                              ));

                              markers.push(
                                <div
                                  key={phaseId}
                                  className="absolute top-0 flex flex-col items-center pointer-events-none"
                                  style={{ left: `${endPercent}%`, transform: 'translateX(-50%)' }}
                                >
                                  <div className="w-0.5 h-3 bg-secondary-700 opacity-60"></div>
                                  <div className="w-1.5 h-1.5 bg-secondary-700 rounded-full opacity-60"></div>
                                </div>
                              );
                            }
                          });
                          return markers;
                        })()}

                        {/* Month/Year Markers */}
                        {(() => {
                          const monthMarkers = [];
                          const startDate = new Date(timeline.start);
                          const endDate = new Date(timeline.end);

                          // Start from the first day of the month after start date
                          let currentDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);

                          while (currentDate < endDate) {
                            const markerPercent = ((currentDate - timeline.start) / (timeline.end - timeline.start)) * 100;

                            if (markerPercent > 0 && markerPercent < 100) {
                              monthMarkers.push(
                                <div
                                  key={currentDate.toISOString()}
                                  className="absolute top-0 flex flex-col items-center pointer-events-none"
                                  style={{ left: `${markerPercent}%`, transform: 'translateX(-50%)' }}
                                >
                                  <div className="w-px h-3 bg-secondary-400 opacity-40"></div>
                                  <div className="mt-0.5 text-[9px] text-secondary-500 opacity-70 whitespace-nowrap">
                                    {currentDate.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })}
                                  </div>
                                </div>
                              );
                            }

                            // Move to next month
                            currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
                          }

                          return monthMarkers;
                        })()}

                        {/* Today Marker */}
                        <div
                          className="absolute top-0 flex flex-col items-center z-10"
                          style={{ left: `${timeline.timeProgress}%`, transform: 'translateX(-50%)' }}
                        >
                          {/* Marker line */}
                          <div className="w-0.5 h-3 bg-danger-600"></div>
                          {/* Marker dot */}
                          <div className="w-3 h-3 bg-danger-600 rounded-full border-2 border-white shadow-md"></div>
                          {/* TODAY label */}
                          <div className="mt-1 px-2 py-0.5 bg-danger-600 text-white text-xs font-bold rounded whitespace-nowrap">
                            OGGI
                          </div>
                        </div>
                      </div>

                      {/* Date Labels */}
                      <div className="flex justify-between items-center mt-8 text-xs">
                        <div className="text-left">
                          <div className="text-secondary-500 font-medium">Inizio</div>
                          <div className="font-semibold text-secondary-900">
                            {timeline.start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                        <div className="text-center bg-success-50 px-3 py-1 rounded">
                          <div className="text-secondary-500 font-medium">Durata</div>
                          <div className="font-semibold text-secondary-900">
                            {timeline.totalDays} giorni
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-secondary-500 font-medium">Data target</div>
                          <div className="font-semibold text-secondary-900">
                            {timeline.end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status Indicator */}
                    <div className={`mt-3 p-2 rounded ${overallProgress >= timeline.timeProgress ? 'bg-success-50' : 'bg-warning-50'}`}>
                      <div className="flex items-center gap-2">
                        {overallProgress >= timeline.timeProgress ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-success-600 flex-shrink-0" />
                            <span className="text-xs font-medium text-success-800">
                              In linea - L'avanzamento del lavoro è in anticipo sul programma
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-warning-600 flex-shrink-0" />
                            <span className="text-xs font-medium text-warning-800">
                              In ritardo - L'avanzamento del lavoro è indietro del {timeline.timeProgress - overallProgress}% rispetto alla pianificazione
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Project Information and Quick Stats Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded shadow-sm border border-secondary-200 p-4">
          <h2 className="text-base font-semibold text-secondary-900 mb-3 pb-2 border-b border-secondary-200">Informazioni progetto</h2>
          <div className="space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <label className="block font-medium text-secondary-700 mb-1">Nome progetto</label>
                <div className="px-3 py-2 bg-secondary-50 border border-secondary-200 rounded font-semibold text-secondary-900">
                  {project.project_name || 'Non impostato'}
                </div>
              </div>
              <div className="flex-shrink-0 md:mt-1.5">
                <label className="block text-xs font-medium text-secondary-700 mb-1 text-center">Data inizio</label>
                <div className="px-2.5 py-2 bg-secondary-50 border border-secondary-200 rounded text-xs text-secondary-900 whitespace-nowrap">
                  {project.start_date ? new Date(project.start_date + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Non impostata'}
                </div>
              </div>
              <div className="flex-shrink-0 md:mt-1.5">
                <label className="block text-xs font-medium text-secondary-700 mb-1 text-center">Data target</label>
                <div className="px-2.5 py-2 bg-secondary-50 border border-secondary-200 rounded text-xs text-secondary-900 whitespace-nowrap">
                  {project.target_date ? new Date(project.target_date + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Non impostata'}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-secondary-700 mb-1">Responsabile progetto R&D</label>
                {project.rd_lead ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-300 rounded">
                    <Star className="w-4 h-4 text-warning-600 fill-warning-600 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-secondary-900">
                        {project.rd_lead.split(' (')[0]}
                      </span>
                      <span className="text-xs text-secondary-600">
                        {project.rd_lead.match(/\(([^)]+)\)/)?.[1] || ''}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 bg-warning-50 border border-warning-300 rounded">
                    <AlertCircle className="w-4 h-4 text-warning-600 flex-shrink-0" />
                    <span className="text-xs text-warning-700">Nessun responsabile R&D assegnato</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block font-medium text-secondary-700 mb-1">Responsabile team Automation</label>
                {project.automation_lead ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-300 rounded">
                    <Star className="w-4 h-4 text-warning-600 fill-warning-600 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-secondary-900">
                        {project.automation_lead.split(' (')[0]}
                      </span>
                      <span className="text-xs text-secondary-600">
                        {project.automation_lead.match(/\(([^)]+)\)/)?.[1] || ''}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 bg-warning-50 border border-warning-300 rounded">
                    <AlertCircle className="w-4 h-4 text-warning-600 flex-shrink-0" />
                    <span className="text-xs text-warning-700">Nessun responsabile Automation assegnato</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded shadow-sm border border-secondary-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-secondary-700" />
                <h3 className="font-semibold text-secondary-900">Composizione del team</h3>
              </div>
              <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-1.5 px-2.5 py-1 bg-primary-600 text-white text-xs rounded hover:bg-primary-700 transition-colors">
                {showAddForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {showAddForm ? 'Annulla' : 'Aggiungi membro'}
              </button>
            </div>
            {showAddForm && (
              <div className="bg-primary-50 border border-primary-200 rounded p-3 mb-3">
                <h4 className="font-semibold text-primary-900 mb-2">Aggiungi nuovo membro del team</h4>
                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <label className="block font-medium text-secondary-700 mb-0.5">Nome <span className="text-danger-500">*</span></label>
                    <input type="text" value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} className="w-full px-2.5 py-1.5 border border-secondary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Mario Rossi" />
                  </div>
                  <div>
                    <label className="block font-medium text-secondary-700 mb-0.5">Ruolo <span className="text-danger-500">*</span></label>
                    <input type="text" value={newContact.role} onChange={(e) => setNewContact({ ...newContact, role: e.target.value })} className="w-full px-2.5 py-1.5 border border-secondary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Responsabile progetto" />
                  </div>
                  <div>
                    <label className="block font-medium text-secondary-700 mb-0.5">Reparto <span className="text-danger-500">*</span></label>
                    <select value={newContact.department} onChange={(e) => setNewContact({ ...newContact, department: e.target.value })} className="w-full px-2.5 py-1.5 border border-secondary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="">Seleziona reparto</option>
                      <option value="R&D">R&D</option>
                      <option value="Automazione">Automazione</option>
                      <option value="Ufficio Meccanico">Ufficio Meccanico</option>
                      <option value="Collaudo">Collaudo</option>
                      <option value="Altro">Altro</option>
                    </select>
                    {newContact.department === 'Altro' && (
                      <input type="text" value={newContactCustomDept} onChange={(e) => setNewContactCustomDept(e.target.value)} className="w-full mt-1.5 px-2.5 py-1.5 border border-secondary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Specifica il reparto..." />
                    )}
                  </div>
                  <div>
                    <label className="block font-medium text-secondary-700 mb-0.5">Email</label>
                    <input type="email" value={newContact.email} onChange={(e) => setNewContact({ ...newContact, email: e.target.value })} className="w-full px-2.5 py-1.5 border border-secondary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="mario.rossi@azienda.com" />
                  </div>
                  <div>
                    <label className="block font-medium text-secondary-700 mb-0.5">Telefono</label>
                    <input type="tel" value={newContact.phone} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} className="w-full px-2.5 py-1.5 border border-secondary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="+39-02-0000000" />
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={handleAddContact} disabled={saving} className="px-3 py-1.5 bg-success-600 text-white rounded hover:bg-success-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{saving ? 'Aggiunta...' : 'Aggiungi membro'}</button>
                  <button onClick={() => { setShowAddForm(false); setNewContact({ name: '', role: '', department: '', email: '', phone: '' }); setNewContactCustomDept(''); }} className="px-3 py-1.5 bg-secondary-300 text-secondary-700 rounded hover:bg-secondary-400 transition-colors">Annulla</button>
                </div>
              </div>
            )}
            {loading ? (
              <div className="text-xs text-secondary-500 py-3">Caricamento membri del team...</div>
            ) : teamContacts.length === 0 ? (
              <div className="text-xs text-secondary-500 py-3">Nessun membro del team aggiunto. Clicca "Aggiungi membro" per iniziare.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {teamContacts.map((contact) => (
                  <div key={contact.id} className="bg-secondary-50 rounded p-3 border border-secondary-200 relative group">
                    {editingContact === contact.id ? (
                      <div>
                        <h4 className="font-semibold text-secondary-900 mb-2">Modifica membro del team</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block font-medium text-gray-700 mb-1">Nome <span className="text-red-500">*</span></label>
                            <input type="text" value={editContact.name} onChange={(e) => setEditContact({ ...editContact, name: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div>
                            <label className="block font-medium text-gray-700 mb-1">Ruolo <span className="text-red-500">*</span></label>
                            <input type="text" value={editContact.role} onChange={(e) => setEditContact({ ...editContact, role: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div>
                            <label className="block font-medium text-gray-700 mb-1">Reparto <span className="text-red-500">*</span></label>
                            <select value={editContact.department} onChange={(e) => setEditContact({ ...editContact, department: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                              <option value="">Seleziona reparto</option>
                              <option value="R&D">R&D</option>
                              <option value="Automazione">Automazione</option>
                              <option value="Ufficio Meccanico">Ufficio Meccanico</option>
                              <option value="Collaudo">Collaudo</option>
                              <option value="Altro">Altro</option>
                            </select>
                            {editContact.department === 'Altro' && (
                              <input type="text" value={editContactCustomDept} onChange={(e) => setEditContactCustomDept(e.target.value)} className="w-full mt-1.5 px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Specifica il reparto..." />
                            )}
                          </div>
                          <div>
                            <label className="block font-medium text-gray-700 mb-1">Email</label>
                            <input type="email" value={editContact.email} onChange={(e) => setEditContact({ ...editContact, email: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="mario.rossi@azienda.com" />
                          </div>
                          <div>
                            <label className="block font-medium text-gray-700 mb-1">Telefono</label>
                            <input type="tel" value={editContact.phone} onChange={(e) => setEditContact({ ...editContact, phone: e.target.value })} className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button onClick={handleUpdateContact} disabled={saving} className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50">{saving ? 'Salvataggio...' : 'Salva'}</button>
                          <button onClick={handleCancelEdit} className="flex-1 px-3 py-1.5 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors">Annulla</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {(() => {
                          const memberIdentifier = `${contact.name} (${contact.role})`;
                          const isRDLead = contact.department === 'R&D' && project.rd_lead === memberIdentifier;
                          const isAutomationLead = contact.department === 'Automazione' && project.automation_lead === memberIdentifier;
                          const isLead = isRDLead || isAutomationLead;

                          return (
                            <>
                              <div className="absolute top-1.5 right-1.5 flex gap-0.5">
                                <button
                                  onClick={() => handleSetAsLead(contact)}
                                  className={`p-1 rounded transition-all ${
                                    isLead
                                      ? 'bg-warning-100 text-warning-600 hover:bg-warning-200 opacity-100'
                                      : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200 opacity-0 group-hover:opacity-100'
                                  }`}
                                  title={isLead ? `Responsabile ${contact.department} attuale` : `Imposta come responsabile ${contact.department}`}
                                >
                                  <Star className={`w-3.5 h-3.5 ${isLead ? 'fill-warning-600' : ''}`} />
                                </button>
                                <button onClick={() => handleEditClick(contact)} className="p-1 bg-primary-100 text-primary-600 rounded hover:bg-primary-200 transition-all opacity-0 group-hover:opacity-100" title="Modifica membro del team"><Edit className="w-3.5 h-3.5" /></button>
                                <button onClick={() => handleDeleteContact(contact.id)} className="p-1 bg-danger-100 text-danger-600 rounded hover:bg-danger-200 transition-all opacity-0 group-hover:opacity-100" title="Rimuovi membro del team"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                              <div className="flex items-start justify-between">
                                <div className="flex-1 pr-6">
                                  <h4 className="font-semibold text-secondary-900">{contact.name}</h4>
                                  <p className="text-xs text-secondary-600 mt-0.5">{contact.role}</p>
                                  <div className="mt-1.5 space-y-0.5">
                                    <p className="text-xs text-secondary-500"><span className="font-medium">Reparto:</span> {contact.department}</p>
                                    {contact.email && <p className="text-xs text-primary-600"><a href={`mailto:${contact.email}`}>{contact.email}</a></p>}
                                    {contact.phone && <p className="text-xs text-secondary-500">{contact.phone}</p>}
                                  </div>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Project Metrics Summary */}
      <div className="bg-gradient-to-br from-white to-secondary-50 rounded shadow-md border-2 border-secondary-200 p-4">
        <h2 className="font-semibold text-secondary-900 mb-3 flex items-center gap-2">
          <div className="w-1 h-5 bg-primary-500 rounded-full"></div>
          Metriche e avanzamento progetto
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          {/* Task Statistics */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-secondary-200 shadow-sm">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary-100">
              <Circle className="w-4 h-4 text-secondary-600" />
            </div>
            <div>
              <div className="font-bold text-secondary-600">{getNotStartedTasksCount()}</div>
              <div className="text-xs text-secondary-500">Non iniziato</div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-warning-200 shadow-sm">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-warning-100">
              <Clock className="w-4 h-4 text-warning-600" />
            </div>
            <div>
              <div className="font-bold text-warning-600">{getInProgressTasksCount()}</div>
              <div className="text-xs text-secondary-500">In corso</div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-success-200 shadow-sm">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-success-100">
              <CheckCircle className="w-4 h-4 text-success-600" />
            </div>
            <div>
              <div className="font-bold text-success-600">{getCompletedTasksCount()}</div>
              <div className="text-xs text-secondary-500">Completate</div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg border-2 border-primary-300 shadow-sm">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-500">
              <span className="font-bold text-white">{calculateOverallProgress()}%</span>
            </div>
            <div>
              <div className="text-xs text-primary-700 font-medium">Avanzamento complessivo</div>
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="w-px h-12 bg-secondary-300"></div>

          {/* Project Metrics */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-secondary-200 shadow-sm">
            <AlertCircle className="w-5 h-5 text-primary-600" />
            <div>
              <div className="text-xs text-secondary-500">Priorità</div>
              <div className="font-semibold text-secondary-900">{project.business_priority || 'Media'}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-secondary-200 shadow-sm">
            <Layers className="w-5 h-5 text-secondary-600" />
            <div>
              <div className="text-xs text-secondary-500">Complessità</div>
              <div className="font-semibold text-secondary-900">{project.complexity_level || 'Media'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded shadow-sm border border-secondary-200 p-4">
        <h2 className="text-base font-semibold text-secondary-900 mb-3 pb-2 border-b border-secondary-200">Panoramica del processo di consegna</h2>
        <div className="space-y-2">
          {phases.map((phase, index) => (
            <div key={index} className={`p-3 rounded border transition-all group ${
                phase.status === 'complete' ? 'bg-success-50 border-success-200' :
                phase.status === 'progress' ? 'bg-warning-50 border-warning-200' : 'bg-secondary-50 border-secondary-200'
              }`}>
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                    phase.status === 'complete' ? 'bg-success-500 text-white' :
                    phase.status === 'progress' ? 'bg-warning-500 text-white' : 'bg-secondary-300 text-secondary-600'
                  }`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  {editingPhase === phase.id ? (
                    // Edit Mode
                    <div className="bg-white p-3 rounded border border-primary-300">
                      <h4 className="font-semibold text-secondary-900 mb-3">Modifica date della fase</h4>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block font-medium text-secondary-700 mb-1">Data inizio</label>
                          <input
                            type="date"
                            value={phaseEditData.startDate || ''}
                            onChange={(e) => setPhaseEditData({ ...phaseEditData, startDate: e.target.value })}
                            className="w-full px-2 py-1.5 border border-secondary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block font-medium text-secondary-700 mb-1">Data fine</label>
                          <input
                            type="date"
                            value={phaseEditData.endDate || ''}
                            onChange={(e) => setPhaseEditData({ ...phaseEditData, endDate: e.target.value })}
                            className="w-full px-2 py-1.5 border border-secondary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSavePhaseDate(phase.id)}
                          disabled={saving}
                          className="px-3 py-1.5 text-xs bg-success-600 text-white rounded hover:bg-success-700 transition-colors disabled:opacity-50"
                        >
                          {saving ? 'Salvataggio...' : 'Salva'}
                        </button>
                        <button
                          onClick={handleCancelPhaseEdit}
                          className="px-3 py-1.5 text-xs bg-secondary-300 text-secondary-700 rounded hover:bg-secondary-400 transition-colors"
                        >
                          Annulla
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-secondary-900">{phase.name}</h3>
                          <button
                            onClick={() => handleEditPhaseClick(phase.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-primary-600 hover:bg-primary-100 rounded transition-all"
                            title="Modifica date della fase"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-primary-600">{phase.progress}%</span>
                          {phase.status === 'complete' && <CheckCircle className="w-4 h-4 text-success-500" />}
                          {phase.status === 'progress' && <Clock className="w-4 h-4 text-warning-500" />}
                        </div>
                      </div>

                      {/* Phase Dates Display */}
                      {phaseDates[phase.id] && (phaseDates[phase.id].startDate || phaseDates[phase.id].endDate) && (
                        <div className="flex items-center gap-3 mb-2 text-xs text-secondary-600">
                          <Calendar className="w-3.5 h-3.5" />
                          {phaseDates[phase.id].startDate && (
                            <span>
                              <span className="font-medium">Inizio:</span> {new Date(phaseDates[phase.id].startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                          {phaseDates[phase.id].endDate && (
                            <span>
                              <span className="font-medium">Fine:</span> {new Date(phaseDates[phase.id].endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="w-full bg-secondary-200 rounded-full h-1.5 mb-2">
                        <div className={`h-1.5 rounded-full transition-all duration-500 ${
                            phase.status === 'complete' ? 'bg-success-500' :
                            phase.status === 'progress' ? 'bg-warning-500' : 'bg-secondary-400'
                          }`} style={{ width: `${phase.progress}%` }} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="font-medium text-secondary-700">Attività principali:</span>
                          <p className="text-secondary-600 mt-0.5">{phase.activities}</p>
                        </div>
                        <div>
                          <span className="font-medium text-secondary-700">Criteri di successo:</span>
                          <p className="text-secondary-600 mt-0.5">{phase.criteria}</p>
                        </div>
                      </div>
                    </>
                  )}
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