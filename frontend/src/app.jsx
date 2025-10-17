import React, { useState, useEffect } from 'react';
import {
  FileText, CheckCircle, BarChart3, Clock, Users,
  Save, AlertCircle, Menu, X, Plus, Search, Loader, RefreshCw, Trash2, AlertTriangle
} from 'lucide-react';
import Checklist from './components/Checklist';
import Overview from './components/Overview';
import Assessment from './components/Assessment';
import Tracking from './components/Tracking';

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [currentProject, setCurrentProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [projectsProgress, setProjectsProgress] = useState({});
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [showProjectList, setShowProjectList] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastSaved, setLastSaved] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'checklist', label: 'Checklist', icon: CheckCircle },
    { id: 'assessment', label: 'Assessment', icon: BarChart3 },
    { id: 'tracking', label: 'Tracking', icon: Clock },
    { id: 'knowledge', label: 'Knowledge', icon: Users },
  ];

  // Load projects on mount
  useEffect(() => {
    console.log('🚀 App mounted, loading projects...');
    loadProjects();
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (!currentProject || !currentProject.id) {
      return;
    }

    console.log('⏱️ Auto-save timer started');
    const timer = setTimeout(() => {
      handleAutoSave();
    }, 2000);

    return () => clearTimeout(timer);
  }, [currentProject]);

  const loadProjects = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      console.log(`📥 Fetching projects from: ${API_BASE_URL}/projects`);

      const response = await fetch(`${API_BASE_URL}/projects`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Projects loaded:', data);

      const sortedData = data.sort((a, b) =>
        new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
      );

      setProjects(sortedData);

      // Load progress for all projects
      await loadAllProjectsProgress(sortedData);

      if (sortedData.length > 0) {
        if (currentProject && currentProject.id) {
          const updatedProject = sortedData.find(p => p.id === currentProject.id);
          if (updatedProject) {
            console.log('🔄 Refreshing current project data');
            setCurrentProject(updatedProject);
          } else {
            // Current project was deleted, select first available
            console.log('⚠️ Current project no longer exists, selecting first available');
            setCurrentProject(sortedData[0]);
          }
        } else {
          console.log('📂 Selecting first project');
          setCurrentProject(sortedData[0]);
        }
      } else {
        // No projects left
        setCurrentProject(null);
      }
    } catch (error) {
      console.error('❌ Error loading projects:', error);
      setSaveStatus('Backend connection failed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadAllProjectsProgress = async (projectsList) => {
    try {
      const progressData = {};

      // Fetch checklist data for each project in parallel
      const progressPromises = projectsList.map(async (project) => {
        try {
          const response = await fetch(`${API_BASE_URL}/checklist/${project.id}`);
          if (response.ok) {
            const checklistItems = await response.json();
            const totalItems = checklistItems.length;
            const completedItems = checklistItems.filter(item => item.status === 'Complete').length;
            const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

            // Calculate current phase based on checklist progress
            const currentPhase = calculateCurrentPhase(checklistItems);

            progressData[project.id] = {
              percentage,
              completedItems,
              totalItems,
              currentPhase
            };
          }
        } catch (error) {
          console.error(`Error loading progress for project ${project.id}:`, error);
          progressData[project.id] = { percentage: 0, completedItems: 0, totalItems: 0, currentPhase: 'Phase 1' };
        }
      });

      await Promise.all(progressPromises);
      setProjectsProgress(progressData);
      console.log('✅ Projects progress loaded:', progressData);
    } catch (error) {
      console.error('❌ Error loading projects progress:', error);
    }
  };

  const calculateCurrentPhase = (checklistItems) => {
    // Group items by phase
    const phases = ['Phase 1', 'Phase 2', 'Phase 3'];

    for (const phase of phases) {
      const phaseItems = checklistItems.filter(item => item.phase === phase);
      if (phaseItems.length === 0) continue;

      const completedInPhase = phaseItems.filter(item => item.status === 'Complete').length;
      const inProgressInPhase = phaseItems.filter(item => item.status === 'In Progress').length;

      // If phase is not fully complete, it's the current phase
      if (completedInPhase < phaseItems.length) {
        return phase;
      }
    }

    // If all phases are complete, return Phase 3
    return 'Phase 3';
  };

  const handleRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    setRefreshing(true);
    loadProjects(true);
  };

  const handleAutoSave = async () => {
    if (!currentProject?.id) {
      console.log('⚠️ Cannot save: No project ID');
      return;
    }

    try {
      setSaveStatus('saving');
      console.log('💾 Saving project:', currentProject.id);

      const response = await fetch(`${API_BASE_URL}/projects/${currentProject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          handover_id: currentProject.handover_id,
          project_name: currentProject.project_name,
          rd_lead: currentProject.rd_lead,
          automation_lead: currentProject.automation_lead,
          start_date: currentProject.start_date,
          target_date: currentProject.target_date,
          business_priority: currentProject.business_priority,
          status: currentProject.status,
          current_phase: currentProject.current_phase,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const now = new Date();
      setLastSaved(now);
      setSaveStatus('saved');
      console.log('✅ Saved at', now.toLocaleTimeString());

      setTimeout(() => {
        loadProjects(true);
      }, 500);

      setTimeout(() => {
        setSaveStatus('');
      }, 3000);

    } catch (error) {
      console.error('❌ Save failed:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 5000);
    }
  };

  const handleCreateProject = async () => {
    const timestamp = Date.now();
    const newProject = {
      handover_id: `HTD-${timestamp}`,
      project_name: 'New Project',
      rd_lead: '',
      automation_lead: '',
      start_date: new Date().toISOString().split('T')[0],
      target_date: '',
      business_priority: 'Standard',
      status: 'active',
      current_phase: 'Phase 1',
    };

    try {
      console.log('➕ Creating project:', newProject);
      
      const response = await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProject),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Project created with ID:', result.id);
      
      await loadProjects();
      
      const createdProject = projects.find(p => p.id === result.id);
      if (createdProject) {
        setCurrentProject(createdProject);
      }
      
      setSaveStatus('Project created');
      setTimeout(() => setSaveStatus(''), 2000);
      
    } catch (error) {
      console.error('❌ Error creating project:', error);
      setSaveStatus('Error creating project');
    }
  };

  const handleDeleteClick = (project, event) => {
    if (event) {
      event.stopPropagation(); // Prevent project selection when clicking delete
    }
    console.log('🗑️ Delete requested for project:', project.project_name);
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;

    try {
      setIsDeleting(true);
      console.log('🗑️ Deleting project:', projectToDelete.id);

      const response = await fetch(`${API_BASE_URL}/projects/${projectToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      console.log('✅ Project deleted successfully');
      
      // Close modal
      setShowDeleteModal(false);
      setProjectToDelete(null);
      
      // Show success message
      setSaveStatus('Project deleted');
      setTimeout(() => setSaveStatus(''), 3000);

      // Reload projects
      await loadProjects();

    } catch (error) {
      console.error('❌ Error deleting project:', error);
      setSaveStatus('Error deleting project');
      setTimeout(() => setSaveStatus(''), 5000);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    console.log('❌ Delete cancelled');
    setShowDeleteModal(false);
    setProjectToDelete(null);
  };

  const handleProjectSelect = (project) => {
    console.log('📂 Switching to project:', project.project_name, 'ID:', project.id);
    setCurrentProject(project);
    setShowProjectList(false);
  };

  const handleProjectChange = (field, value) => {
    console.log(`✏️ Field changed: ${field} = "${value}"`);
    setCurrentProject(prev => ({ ...prev, [field]: value }));
  };

  const filteredProjects = projects.filter(p => 
    p.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.handover_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSaveStatusDisplay = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <div className="flex items-center gap-2 text-blue-600 text-sm">
            <Loader className="w-4 h-4 animate-spin" />
            <span>Saving...</span>
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>Saved {lastSaved ? `at ${lastSaved.toLocaleTimeString()}` : ''}</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>Error saving</span>
          </div>
        );
      case 'Project deleted':
        return (
          <div className="flex items-center gap-2 text-orange-600 text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>Project deleted</span>
          </div>
        );
      default:
        return lastSaved ? (
          <div className="text-gray-400 text-sm">
            Last: {lastSaved.toLocaleTimeString()}
          </div>
        ) : null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Project?</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700 mb-2">
                You are about to delete:
              </p>
              <p className="font-semibold text-gray-900">
                {projectToDelete?.project_name}
              </p>
              <p className="text-sm text-gray-600">
                ID: {projectToDelete?.handover_id}
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Warning:</strong> This will permanently delete all project data including:
              </p>
              <ul className="text-sm text-yellow-700 mt-2 ml-5 list-disc">
                <li>Checklist items</li>
                <li>Knowledge transfer sessions</li>
                <li>Assessment scores</li>
                <li>Issues and communication logs</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDeleteCancel}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Project
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowProjectList(!showProjectList)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Toggle project list"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <div>
                <h1 className="text-xl font-bold text-blue-600">
                  Handover Management System
                </h1>
                {currentProject && (
                  <p className="text-sm text-gray-500">
                    {currentProject.project_name} ({currentProject.handover_id})
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {getSaveStatusDisplay()}

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh data"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              {currentProject && (
                <button
                  onClick={() => handleDeleteClick(currentProject)}
                  className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                  title="Delete current project"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={handleCreateProject}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Project
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Project Sidebar */}
        <aside
          className={`${
            showProjectList ? 'translate-x-0' : '-translate-x-full'
          } fixed lg:relative lg:translate-x-0 w-80 bg-white border-r border-gray-200 h-screen overflow-y-auto transition-transform duration-300 z-40`}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">
                Projects ({projects.length})
              </h2>
              <button
                onClick={() => setShowProjectList(false)}
                className="lg:hidden p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              {filteredProjects.map((project) => {
                const progress = projectsProgress[project.id] || { percentage: 0, completedItems: 0, totalItems: 0, currentPhase: 'Phase 1' };

                return (
                  <div
                    key={project.id}
                    className={`group relative rounded-lg transition-colors ${
                      currentProject?.id === project.id
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <button
                      onClick={() => handleProjectSelect(project)}
                      className="w-full text-left p-3 pr-10"
                    >
                      <div className="font-medium text-gray-900 truncate mb-1">
                        {project.project_name}
                      </div>
                      <div className="text-xs text-gray-500 truncate mb-2">
                        {project.handover_id}
                      </div>

                      {/* Current Phase */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium text-blue-600">
                          {progress.currentPhase}
                        </div>
                        <div className="text-xs font-semibold text-gray-700">
                          {progress.percentage}%
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-500 ${
                            progress.percentage >= 100 ? 'bg-green-500' :
                            progress.percentage >= 75 ? 'bg-blue-500' :
                            progress.percentage >= 50 ? 'bg-yellow-500' :
                            progress.percentage >= 25 ? 'bg-orange-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${progress.percentage}%` }}
                        />
                      </div>

                      {/* Completed Items Count */}
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-400">
                          {progress.completedItems}/{progress.totalItems} tasks
                        </div>
                        <div className="text-xs text-gray-400">
                          {project.business_priority}
                        </div>
                      </div>
                    </button>

                    {/* Delete button for each project */}
                    <button
                      onClick={(e) => handleDeleteClick(project, e)}
                      className="absolute right-2 top-3 p-2 opacity-0 group-hover:opacity-100 hover:bg-red-100 text-red-600 rounded transition-all"
                      title="Delete project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {filteredProjects.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No projects found</p>
                <button
                  onClick={handleCreateProject}
                  className="mt-2 text-blue-600 hover:underline text-sm"
                >
                  Create your first project
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          {/* Tab Navigation */}
          <div className="bg-white border-b border-gray-200">
            <div className="overflow-x-auto">
              <div className="flex gap-1 px-4 min-w-max">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600 bg-blue-50'
                          : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6 overflow-y-auto" style={{ height: 'calc(100vh - 180px)' }}>
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : !currentProject ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-600 mb-2">
                    No Project Selected
                  </h2>
                  <p className="text-gray-500 mb-4">
                    Create a new project or select an existing one to get started
                  </p>
                  <button
                    onClick={handleCreateProject}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create New Project
                  </button>
                </div>
              </div>
            ) : activeTab === 'overview' ? (
              <Overview project={currentProject} setProject={setCurrentProject} />
            ) : activeTab === 'checklist' ? (
              <Checklist projectId={currentProject.id} />
            ) : activeTab === 'assessment' ? (
              <Assessment projectId={currentProject.id} />
            ) : activeTab === 'tracking' ? (
              <Tracking projectId={currentProject.id} />
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {tabs.find(t => t.id === activeTab)?.label}
                </h2>
                <p className="text-gray-600">
                  This section is coming soon! The full components will be added next.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;