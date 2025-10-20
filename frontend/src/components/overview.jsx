// frontend/src/components/Overview.jsx
import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, Users, Plus, X, Trash2, Edit } from 'lucide-react';
import { teamContactsAPI } from '../services/api';

const Overview = ({ project, setProject }) => {
  const [teamContacts, setTeamContacts] = useState([]);
  const [checklistItems, setChecklistItems] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [phaseNames, setPhaseNames] = useState({
    'Phase 1': 'Phase 1: Pre-Handover Assessment',
    'Phase 2': 'Phase 2: Knowledge Transfer Sessions',
    'Phase 3': 'Phase 3: Final Sign-Offs'
  });
  const [newContact, setNewContact] = useState({
    name: '',
    role: '',
    department: '',
    email: '',
    phone: ''
  });
  const [editContact, setEditContact] = useState({
    name: '',
    role: '',
    department: '',
    email: '',
    phone: ''
  });
  const [saving, setSaving] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (project?.id) {
      loadTeamContacts();
      loadChecklistItems();
      loadIssues();
      loadPhaseNamesFromStorage();
    }
  }, [project?.id]);

  const loadPhaseNamesFromStorage = async () => {
    try {
      // Load custom phase names from database for this project
      const response = await fetch(`${API_BASE_URL}/phase-names/${project.id}`);

      if (!response.ok) {
        console.log('No custom phase names found, using defaults');
        return;
      }

      const phaseNamesData = await response.json();

      if (phaseNamesData.length > 0) {
        // Convert database format to phase name map
        const phaseNameMap = {};
        phaseNamesData.forEach(pn => {
          phaseNameMap[pn.phase_id] = pn.phase_name;
        });
        setPhaseNames(phaseNameMap);
        console.log('✅ Loaded custom phase names from database');
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
      const response = await fetch(`${API_BASE_URL}/checklist/${project.id}`);
      if (response.ok) {
        const data = await response.json();
        setChecklistItems(data);
      }
    } catch (error) {
      console.error('Error loading checklist:', error);
    }
  };

  const loadIssues = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/issues/${project.id}`);
      if (response.ok) {
        const data = await response.json();
        setIssues(data);
      }
    } catch (error) {
      console.error('Error loading issues:', error);
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
    if (!confirm('Are you sure you want to remove this team member?')) {
      return;
    }

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
    setEditContact({
      name: contact.name,
      role: contact.role,
      department: contact.department,
      email: contact.email || '',
      phone: contact.phone || ''
    });
    setShowAddForm(false); // Close add form if open
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

    // Score formula: (Priority * 2 + Complexity * 3) = Max 15 points
    return (priorityValue * 2) + (complexityValue * 3);
  };

  const handleChange = (field, value) => {
    const updatedProject = { ...project, [field]: value };

    // Auto-calculate project score when priority or complexity changes
    if (field === 'business_priority' || field === 'complexity_level') {
      const priority = field === 'business_priority' ? value : (project.business_priority || 'Media');
      const complexity = field === 'complexity_level' ? value : (project.complexity_level || 'Media');
      updatedProject.project_score = calculateProjectScore(priority, complexity);
    }

    setProject(updatedProject);
  };

  // Calculate phase status based on checklist completion
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

  // Calculate overall statistics
  const calculateOverallProgress = () => {
    if (checklistItems.length === 0) return 0;
    const completedItems = checklistItems.filter(item => item.status === 'Complete').length;
    return Math.round((completedItems / checklistItems.length) * 100);
  };

  const getCompletedTasksCount = () => {
    return checklistItems.filter(item => item.status === 'Complete').length;
  };

  const getInProgressTasksCount = () => {
    return checklistItems.filter(item => item.status === 'In Progress').length;
  };

  const getNotStartedTasksCount = () => {
    return checklistItems.filter(item => item.status === 'Not Started').length;
  };

  // Dynamic phases based on checklist data and custom phase names
  const phases = [
    {
      id: 'Phase 1',
      name: phaseNames['Phase 1'],
      duration: '2-4 weeks',
      status: calculatePhaseStatus('Phase 1'),
      progress: calculatePhaseProgress('Phase 1'),
      activities: 'Prerequisites completion, documentation review, initial assessment',
      criteria: 'All technical and documentation requirements met'
    },
    {
      id: 'Phase 2',
      name: phaseNames['Phase 2'],
      duration: '2-6 weeks',
      status: calculatePhaseStatus('Phase 2'),
      progress: calculatePhaseProgress('Phase 2'),
      activities: 'Training sessions, hands-on activities, shadow support',
      criteria: 'Team demonstrates competency in system operation'
    },
    {
      id: 'Phase 3',
      name: phaseNames['Phase 3'],
      duration: '1-2 weeks',
      status: calculatePhaseStatus('Phase 3'),
      progress: calculatePhaseProgress('Phase 3'),
      activities: 'Approvals, documentation handover, transition activities',
      criteria: 'All sign-offs completed and access transferred'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">Welcome to the Handover Management System</h3>
            <p className="text-sm text-blue-800 mt-1">
              This system manages software project handovers from R&D to the Automation Department.
              All data is automatically saved as you type. Complete each section in order for best results.
            </p>
          </div>
        </div>
      </div>

      {/* Project Information and Quick Stats Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Information Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
            Project Information
          </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={project.project_name || ''}
              onChange={(e) => handleChange('project_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter project name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Handover ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={project.handover_id || ''}
              onChange={(e) => handleChange('handover_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="HTD-YYYY-XXX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              R&D Project Lead
            </label>
            <select
              value={project.rd_lead || ''}
              onChange={(e) => handleChange('rd_lead', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select R&D Team Member</option>
              {teamContacts
                .filter(contact => contact.department === 'R&D')
                .map(contact => (
                  <option key={contact.id} value={`${contact.name} (${contact.email || contact.role})`}>
                    {contact.name} - {contact.role}
                  </option>
                ))}
            </select>
            {teamContacts.filter(c => c.department === 'R&D').length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                No R&D team members added. Add members in Team Composition below.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Automation Team Lead
            </label>
            <select
              value={project.automation_lead || ''}
              onChange={(e) => handleChange('automation_lead', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Automation Team Member</option>
              {teamContacts
                .filter(contact => contact.department === 'Automation')
                .map(contact => (
                  <option key={contact.id} value={`${contact.name} (${contact.email || contact.role})`}>
                    {contact.name} - {contact.role}
                  </option>
                ))}
            </select>
            {teamContacts.filter(c => c.department === 'Automation').length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                No Automation team members added. Add members in Team Composition below.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={project.start_date || ''}
              onChange={(e) => handleChange('start_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Completion Date
            </label>
            <input
              type="date"
              value={project.target_date || ''}
              onChange={(e) => handleChange('target_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Project Metrics Section - Separated */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Project Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Priority
              </label>
              <select
                value={project.business_priority || 'Media'}
                onChange={(e) => handleChange('business_priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Alta">Alta</option>
                <option value="Media">Media</option>
                <option value="Bassa">Bassa</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Complexity Level
              </label>
              <select
                value={project.complexity_level || 'Media'}
                onChange={(e) => handleChange('complexity_level', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Alta">Alta</option>
                <option value="Media">Media</option>
                <option value="Bassa">Bassa</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Score
              </label>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-gray-50 px-3 py-2 border border-gray-300 rounded-md text-gray-700 font-semibold">
                  {project.project_score || 0} / 15
                </div>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        (project.project_score || 0) >= 12 ? 'bg-red-500' :
                        (project.project_score || 0) >= 9 ? 'bg-orange-500' :
                        (project.project_score || 0) >= 6 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${((project.project_score || 0) / 15) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Calculated from Priority (weight: 2) and Complexity (weight: 3)
              </p>
            </div>
          </div>
        </div>
        </div>

        {/* Right Column: Quick Stats and Team Composition */}
        <div className="space-y-6">
          {/* Quick Stats - 2x2 Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-2xl font-bold text-blue-600 mb-1">{calculateOverallProgress()}%</div>
              <div className="text-sm text-gray-600">Overall Progress</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-2xl font-bold text-green-600 mb-1">{getCompletedTasksCount()}</div>
              <div className="text-sm text-gray-600">Tasks Completed</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-2xl font-bold text-yellow-600 mb-1">{getInProgressTasksCount()}</div>
              <div className="text-sm text-gray-600">Tasks In Progress</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-2xl font-bold text-gray-600 mb-1">{getNotStartedTasksCount()}</div>
              <div className="text-sm text-gray-600">Not Started</div>
            </div>
          </div>

          {/* Team Composition Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-700" />
                <h3 className="text-base font-semibold text-gray-900">Team Composition</h3>
              </div>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {showAddForm ? 'Cancel' : 'Add Member'}
              </button>
            </div>

            {/* Add Team Member Form */}
            {showAddForm && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-blue-900 mb-3">Add New Team Member</h4>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newContact.name}
                      onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newContact.role}
                      onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Project Lead"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newContact.department}
                      onChange={(e) => setNewContact({ ...newContact, department: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Department</option>
                      <option value="R&D">R&D</option>
                      <option value="Automation">Automation</option>
                      <option value="QA">QA</option>
                      <option value="Operations">Operations</option>
                      <option value="Management">Management</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newContact.email}
                      onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="john.doe@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={newContact.phone}
                      onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+1-555-0123"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleAddContact}
                    disabled={saving}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Adding...' : 'Add Team Member'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewContact({ name: '', role: '', department: '', email: '', phone: '' });
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Team Members List */}
            {loading ? (
              <div className="text-sm text-gray-500 py-4">Loading team members...</div>
            ) : teamContacts.length === 0 ? (
              <div className="text-sm text-gray-500 py-4">No team members added yet. Click "Add Member" to get started.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {teamContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 relative group"
                  >
                    {editingContact === contact.id ? (
                      /* Edit Form */
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Edit Team Member</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={editContact.name}
                              onChange={(e) => setEditContact({ ...editContact, name: e.target.value })}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Role <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={editContact.role}
                              onChange={(e) => setEditContact({ ...editContact, role: e.target.value })}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Department <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={editContact.department}
                              onChange={(e) => setEditContact({ ...editContact, department: e.target.value })}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select Department</option>
                              <option value="R&D">R&D</option>
                              <option value="Automation">Automation</option>
                              <option value="QA">QA</option>
                              <option value="Operations">Operations</option>
                              <option value="Management">Management</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Email
                            </label>
                            <input
                              type="email"
                              value={editContact.email}
                              onChange={(e) => setEditContact({ ...editContact, email: e.target.value })}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Phone
                            </label>
                            <input
                              type="tel"
                              value={editContact.phone}
                              onChange={(e) => setEditContact({ ...editContact, phone: e.target.value })}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={handleUpdateContact}
                            disabled={saving}
                            className="flex-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="flex-1 px-3 py-1.5 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display Mode */
                      <>
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100">
                          <button
                            onClick={() => handleEditClick(contact)}
                            className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                            title="Edit team member"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteContact(contact.id)}
                            className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                            title="Remove team member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-start justify-between">
                          <div className="flex-1 pr-8">
                            <h4 className="font-semibold text-gray-900">{contact.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{contact.role}</p>
                            <div className="mt-2 space-y-1">
                              <p className="text-sm text-gray-500">
                                <span className="font-medium">Department:</span> {contact.department}
                              </p>
                              {contact.email && (
                                <p className="text-sm text-blue-600">
                                  <a href={`mailto:${contact.email}`}>{contact.email}</a>
                                </p>
                              )}
                              {contact.phone && (
                                <p className="text-sm text-gray-500">{contact.phone}</p>
                              )}
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

      {/* Handover Process Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
          Handover Process Overview
        </h2>

        <div className="space-y-3">
          {phases.map((phase, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 transition-all ${
                phase.status === 'complete'
                  ? 'bg-green-50 border-green-200'
                  : phase.status === 'progress'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    phase.status === 'complete'
                      ? 'bg-green-500 text-white'
                      : phase.status === 'progress'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{phase.name}</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-blue-600">{phase.progress}%</span>
                      <span className="text-sm text-gray-500">{phase.duration}</span>
                      {phase.status === 'complete' && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      {phase.status === 'progress' && (
                        <Clock className="w-5 h-5 text-yellow-500" />
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        phase.status === 'complete'
                          ? 'bg-green-500'
                          : phase.status === 'progress'
                          ? 'bg-yellow-500'
                          : 'bg-gray-400'
                      }`}
                      style={{ width: `${phase.progress}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Key Activities:</span>
                      <p className="text-gray-600 mt-1">{phase.activities}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Success Criteria:</span>
                      <p className="text-gray-600 mt-1">{phase.criteria}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Important Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-900">Important</h3>
            <p className="text-sm text-yellow-800 mt-1">
              Complete each worksheet in order. Use the Dashboard tab to monitor overall progress
              and identify any issues requiring attention. All changes are saved automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;