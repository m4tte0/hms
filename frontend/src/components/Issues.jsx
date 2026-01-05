// frontend/src/components/Issues.jsx
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, Edit2, Trash2, X, Save, Search, Filter } from 'lucide-react';

const Issues = ({ projectId }) => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [issueToDelete, setIssueToDelete] = useState(null);
  const [teamContacts, setTeamContacts] = useState([]);
  const [newIssue, setNewIssue] = useState({
    issue_id: '',
    date_reported: new Date().toISOString().split('T')[0],
    reporter: '',
    priority: 'Medium',
    description: '',
    assigned_to: '',
    status: 'Open',
    target_resolution: ''
  });
  const [editIssue, setEditIssue] = useState({
    issue_id: '',
    date_reported: '',
    reporter: '',
    priority: 'Medium',
    description: '',
    assigned_to: '',
    status: 'Open',
    target_resolution: ''
  });
  const [saving, setSaving] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (projectId) {
      loadIssues();
      loadTeamContacts();
    }
  }, [projectId]);

  const loadIssues = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/issues/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setIssues(data);
      }
    } catch (error) {
      console.error('Error loading issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamContacts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/team-contacts/${projectId}`);
      if (response.ok) {
        const contacts = await response.json();
        setTeamContacts(contacts);
      }
    } catch (error) {
      console.error('Error loading team contacts:', error);
    }
  };

  const handleAddIssue = async () => {
    if (!newIssue.issue_id || !newIssue.description) {
      alert('Please fill in Issue ID and Description fields');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`${API_BASE_URL}/issues/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIssue)
      });

      if (response.ok) {
        setNewIssue({
          issue_id: '',
          date_reported: new Date().toISOString().split('T')[0],
          reporter: '',
          priority: 'Medium',
          description: '',
          assigned_to: '',
          status: 'Open',
          target_resolution: ''
        });
        setShowAddForm(false);
        await loadIssues();
      } else {
        alert('Failed to add issue');
      }
    } catch (error) {
      console.error('Error adding issue:', error);
      alert('Failed to add issue');
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (issue) => {
    setEditingIssue(issue.id);
    setEditIssue({
      issue_id: issue.issue_id,
      date_reported: issue.date_reported,
      reporter: issue.reporter || '',
      priority: issue.priority,
      description: issue.description,
      assigned_to: issue.assigned_to || '',
      status: issue.status,
      target_resolution: issue.target_resolution || ''
    });
    setShowAddForm(false);
  };

  const handleUpdateIssue = async () => {
    if (!editIssue.issue_id || !editIssue.description) {
      alert('Please fill in Issue ID and Description fields');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`${API_BASE_URL}/issues/${projectId}/${editingIssue}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editIssue)
      });

      if (response.ok) {
        setEditingIssue(null);
        setEditIssue({
          issue_id: '',
          date_reported: '',
          reporter: '',
          priority: 'Medium',
          description: '',
          assigned_to: '',
          status: 'Open',
          target_resolution: ''
        });
        await loadIssues();
      } else {
        alert('Failed to update issue');
      }
    } catch (error) {
      console.error('Error updating issue:', error);
      alert('Failed to update issue');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (issue) => {
    setIssueToDelete(issue);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!issueToDelete) return;

    try {
      const response = await fetch(`${API_BASE_URL}/issues/${projectId}/${issueToDelete.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setShowDeleteModal(false);
        setIssueToDelete(null);
        await loadIssues();
      } else {
        alert('Failed to delete issue');
      }
    } catch (error) {
      console.error('Error deleting issue:', error);
      alert('Failed to delete issue');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setIssueToDelete(null);
  };

  const handleCancelEdit = () => {
    setEditingIssue(null);
    setEditIssue({
      issue_id: '',
      date_reported: '',
      reporter: '',
      priority: 'Medium',
      description: '',
      assigned_to: '',
      status: 'Open',
      target_resolution: ''
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical':
      case 'High':
        return 'bg-danger-100 text-danger-800 border-danger-300';
      case 'Medium':
        return 'bg-warning-100 text-warning-800 border-warning-300';
      case 'Low':
        return 'bg-success-100 text-success-800 border-success-300';
      default:
        return 'bg-secondary-100 text-secondary-800 border-secondary-300';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Resolved':
        return 'bg-success-100 text-success-800 border-success-300';
      case 'In Progress':
        return 'bg-primary-100 text-primary-800 border-primary-300';
      case 'Open':
        return 'bg-warning-100 text-warning-800 border-warning-300';
      default:
        return 'bg-secondary-100 text-secondary-800 border-secondary-300';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  // Filter issues
  const filteredIssues = issues.filter(issue => {
    const matchesSearch = issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         issue.issue_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (issue.assigned_to && issue.assigned_to.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || issue.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || issue.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Statistics
  const stats = {
    total: issues.length,
    open: issues.filter(i => i.status === 'Open').length,
    inProgress: issues.filter(i => i.status === 'In Progress').length,
    resolved: issues.filter(i => i.status === 'Resolved').length,
    critical: issues.filter(i => i.priority === 'Critical').length,
    high: issues.filter(i => i.priority === 'High').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white rounded shadow-sm border border-secondary-200 p-3">
          <div className="text-xl font-bold text-secondary-800">{stats.total}</div>
          <div className="text-xs text-secondary-600">Total Issues</div>
        </div>
        <div className="bg-warning-50 rounded shadow-sm border border-warning-200 p-3">
          <div className="text-xl font-bold text-warning-600">{stats.open}</div>
          <div className="text-xs text-warning-700">Open</div>
        </div>
        <div className="bg-primary-50 rounded shadow-sm border border-primary-200 p-3">
          <div className="text-xl font-bold text-primary-600">{stats.inProgress}</div>
          <div className="text-xs text-primary-700">In Progress</div>
        </div>
        <div className="bg-success-50 rounded shadow-sm border border-success-200 p-3">
          <div className="text-xl font-bold text-success-600">{stats.resolved}</div>
          <div className="text-xs text-success-700">Resolved</div>
        </div>
        <div className="bg-danger-50 rounded shadow-sm border border-danger-200 p-3">
          <div className="text-xl font-bold text-danger-600">{stats.critical + stats.high}</div>
          <div className="text-xs text-danger-700">High Priority</div>
        </div>
      </div>

      {/* Issues Management */}
      <div className="bg-white rounded shadow-sm border border-secondary-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-secondary-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning-600" />
            <h2 className="text-base font-semibold text-secondary-900">Issues & Risks</h2>
          </div>
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setEditingIssue(null);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
          >
            {showAddForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showAddForm ? 'Cancel' : 'Add Issue'}
          </button>
        </div>

        {/* Add Issue Form */}
        {showAddForm && (
          <div className="p-4 bg-primary-50 border-b border-primary-200">
            <h3 className="text-sm font-semibold text-primary-900 mb-3">Add New Issue</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Issue ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newIssue.issue_id}
                  onChange={(e) => setNewIssue({ ...newIssue, issue_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ISS-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Date Reported
                </label>
                <input
                  type="date"
                  value={newIssue.date_reported}
                  onChange={(e) => setNewIssue({ ...newIssue, date_reported: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Reporter
                </label>
                <select
                  value={newIssue.reporter}
                  onChange={(e) => setNewIssue({ ...newIssue, reporter: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                >
                  <option value="">Select reporter...</option>
                  <optgroup label="Verifiers">
                    <option value="Matteo Hon Fucci">Matteo Hon Fucci (Automation Manager)</option>
                    <option value="Stefano Corbelli">Stefano Corbelli (Technical Director)</option>
                    <option value="Ivan De Zanet">Ivan De Zanet (R&D Manager)</option>
                  </optgroup>
                  <optgroup label="Team Members">
                    {teamContacts.map(contact => (
                      <option key={contact.id} value={contact.name}>
                        {contact.name} ({contact.role})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Priority
                </label>
                <select
                  value={newIssue.priority}
                  onChange={(e) => setNewIssue({ ...newIssue, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={newIssue.description}
                  onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Describe the issue..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Assigned To
                </label>
                <select
                  value={newIssue.assigned_to}
                  onChange={(e) => setNewIssue({ ...newIssue, assigned_to: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                >
                  <option value="">Select assignee...</option>
                  <optgroup label="Verifiers">
                    <option value="Matteo Hon Fucci">Matteo Hon Fucci (Automation Manager)</option>
                    <option value="Stefano Corbelli">Stefano Corbelli (Technical Director)</option>
                    <option value="Ivan De Zanet">Ivan De Zanet (R&D Manager)</option>
                  </optgroup>
                  <optgroup label="Team Members">
                    {teamContacts.map(contact => (
                      <option key={contact.id} value={contact.name}>
                        {contact.name} ({contact.role})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Status
                </label>
                <select
                  value={newIssue.status}
                  onChange={(e) => setNewIssue({ ...newIssue, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Target Resolution Date
                </label>
                <input
                  type="date"
                  value={newIssue.target_resolution}
                  onChange={(e) => setNewIssue({ ...newIssue, target_resolution: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAddIssue}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Adding...' : 'Add Issue'}
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewIssue({
                    issue_id: '',
                    date_reported: new Date().toISOString().split('T')[0],
                    reporter: '',
                    priority: 'Medium',
                    description: '',
                    assigned_to: '',
                    status: 'Open',
                    target_resolution: ''
                  });
                }}
                className="px-4 py-2 bg-gray-300 text-secondary-700 rounded hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
            <div>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Issues List */}
        <div className="p-6">
          {filteredIssues.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-secondary-500">
                {issues.length === 0
                  ? 'No issues reported yet. Click "Add Issue" to create one.'
                  : 'No issues match your filters.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="border border-gray-200 rounded p-4 hover:shadow-md transition-shadow"
                >
                  {editingIssue === issue.id ? (
                    /* Edit Form */
                    <div>
                      <h4 className="font-semibold text-secondary-900 mb-3">Edit Issue</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-secondary-700 mb-1">
                            Issue ID <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={editIssue.issue_id}
                            onChange={(e) => setEditIssue({ ...editIssue, issue_id: e.target.value })}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-secondary-700 mb-1">
                            Date Reported
                          </label>
                          <input
                            type="date"
                            value={editIssue.date_reported}
                            onChange={(e) => setEditIssue({ ...editIssue, date_reported: e.target.value })}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-secondary-700 mb-1">
                            Reporter
                          </label>
                          <select
                            value={editIssue.reporter}
                            onChange={(e) => setEditIssue({ ...editIssue, reporter: e.target.value })}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                          >
                            <option value="">Select reporter...</option>
                            <optgroup label="Verifiers">
                              <option value="Matteo Hon Fucci">Matteo Hon Fucci (Automation Manager)</option>
                              <option value="Stefano Corbelli">Stefano Corbelli (Technical Director)</option>
                              <option value="Ivan De Zanet">Ivan De Zanet (R&D Manager)</option>
                            </optgroup>
                            <optgroup label="Team Members">
                              {teamContacts.map(contact => (
                                <option key={contact.id} value={contact.name}>
                                  {contact.name} ({contact.role})
                                </option>
                              ))}
                            </optgroup>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-secondary-700 mb-1">
                            Priority
                          </label>
                          <select
                            value={editIssue.priority}
                            onChange={(e) => setEditIssue({ ...editIssue, priority: e.target.value })}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-secondary-700 mb-1">
                            Description <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={editIssue.description}
                            onChange={(e) => setEditIssue({ ...editIssue, description: e.target.value })}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="3"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-secondary-700 mb-1">
                            Assigned To
                          </label>
                          <select
                            value={editIssue.assigned_to}
                            onChange={(e) => setEditIssue({ ...editIssue, assigned_to: e.target.value })}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                          >
                            <option value="">Select assignee...</option>
                            <optgroup label="Verifiers">
                              <option value="Matteo Hon Fucci">Matteo Hon Fucci (Automation Manager)</option>
                              <option value="Stefano Corbelli">Stefano Corbelli (Technical Director)</option>
                              <option value="Ivan De Zanet">Ivan De Zanet (R&D Manager)</option>
                            </optgroup>
                            <optgroup label="Team Members">
                              {teamContacts.map(contact => (
                                <option key={contact.id} value={contact.name}>
                                  {contact.name} ({contact.role})
                                </option>
                              ))}
                            </optgroup>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-secondary-700 mb-1">
                            Status
                          </label>
                          <select
                            value={editIssue.status}
                            onChange={(e) => setEditIssue({ ...editIssue, status: e.target.value })}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-secondary-700 mb-1">
                            Target Resolution Date
                          </label>
                          <input
                            type="date"
                            value={editIssue.target_resolution}
                            onChange={(e) => setEditIssue({ ...editIssue, target_resolution: e.target.value })}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={handleUpdateIssue}
                          disabled={saving}
                          className="flex-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex-1 px-3 py-1.5 bg-gray-300 text-secondary-700 text-sm rounded hover:bg-gray-400 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Display Mode */
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-secondary-900">{issue.issue_id}</h3>
                            <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(issue.priority)}`}>
                              {issue.priority}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(issue.status)}`}>
                              {issue.status}
                            </span>
                          </div>
                          <p className="text-secondary-700 mb-3">{issue.description}</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-secondary-600">
                            <div>
                              <span className="font-medium">Reported:</span> {formatDate(issue.date_reported)}
                            </div>
                            {issue.reporter && (
                              <div>
                                <span className="font-medium">Reporter:</span> {issue.reporter}
                              </div>
                            )}
                            {issue.assigned_to && (
                              <div>
                                <span className="font-medium">Assigned:</span> {issue.assigned_to}
                              </div>
                            )}
                            {issue.target_resolution && (
                              <div>
                                <span className="font-medium">Target:</span> {formatDate(issue.target_resolution)}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEditClick(issue)}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded transition-colors"
                            title="Edit issue"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(issue)}
                            className="p-2 text-danger-600 hover:bg-danger-50 rounded transition-colors"
                            title="Delete issue"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && issueToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-secondary-900">Delete Issue?</h3>
                <p className="text-sm text-secondary-500">This action cannot be undone</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded p-4 mb-4">
              <p className="text-sm text-secondary-700 mb-2">You are about to delete:</p>
              <p className="font-semibold text-secondary-900">{issueToDelete.issue_id}</p>
              <p className="text-sm text-secondary-600 mt-1 line-clamp-2">{issueToDelete.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(issueToDelete.priority)}`}>
                  {issueToDelete.priority}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(issueToDelete.status)}`}>
                  {issueToDelete.status}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDeleteCancel}
                className="flex-1 px-4 py-2 border border-gray-300 text-secondary-700 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Issue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Issues;
