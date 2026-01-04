import React, { useState, useEffect } from 'react';
import {
  FileText, CheckCircle, BarChart3, Clock, Users, Paperclip,
  Save, AlertCircle, Menu, X, Plus, Search, Loader, RefreshCw, Trash2, AlertTriangle, FileBarChart
} from 'lucide-react';
import Checklist from './components/Checklist';
import Overview from './components/Overview';
import Assessment from './components/Assessment';
import Tracking from './components/Tracking';
import Knowledge from './components/Knowledge';
import Attachments from './components/Attachments';
import Issues from './components/Issues';
import StatusReport from './components/StatusReport';
import { projectsAPI, checklistAPI } from './services/api';

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
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Report modal state
  const [showReport, setShowReport] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'checklist', label: 'Checklist', icon: CheckCircle },
    { id: 'assessment', label: 'Assessment', icon: BarChart3 },
    { id: 'tracking', label: 'Tracking', icon: Clock },
    { id: 'knowledge', label: 'Knowledge', icon: Users },
    { id: 'issues', label: 'Issues', icon: AlertTriangle },
    { id: 'attachments', label: 'Attachments', icon: Paperclip },
  ];

  useEffect(() => {
    console.log('🚀 App mounted, loading projects...');
    loadProjects();
  }, []);

  useEffect(() => {
    if (!currentProject || !currentProject.id) {
      return;
    }
    const timer = setTimeout(() => {
      handleAutoSave();
    }, 2000);
    return () => clearTimeout(timer);
  }, [currentProject]);

  const loadProjects = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      console.log(`📥 Fetching projects...`);
      const response = await projectsAPI.getAll();
      const data = response.data;
      console.log('✅ Projects loaded:', data);

      const sortedData = data.sort((a, b) =>
        new Date(a.created_at) - new Date(b.created_at)
      );

      setProjects(sortedData);
      await loadAllProjectsProgress(sortedData);

      if (sortedData.length > 0) {
        if (currentProject && currentProject.id) {
          const updatedProject = sortedData.find(p => p.id === currentProject.id);
          if (updatedProject) {
            setCurrentProject(updatedProject);
          } else {
            setCurrentProject(sortedData[0]);
          }
        } else {
          setCurrentProject(sortedData[0]);
        }
      } else {
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
      const progressPromises = projectsList.map(async (project) => {
        try {
          const response = await checklistAPI.getAll(project.id);
          const checklistItems = response.data;
          const totalItems = checklistItems.length;
          const completedItems = checklistItems.filter(item => item.status === 'Complete').length;
          const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
          const currentPhase = calculateCurrentPhase(checklistItems);
          progressData[project.id] = { percentage, completedItems, totalItems, currentPhase };
        } catch (error) {
          console.error(`Error loading progress for project ${project.id}:`, error);
          progressData[project.id] = { percentage: 0, completedItems: 0, totalItems: 0, currentPhase: 'Phase 1' };
        }
      });

      await Promise.all(progressPromises);
      setProjectsProgress(progressData);
    } catch (error) {
      console.error('❌ Error loading projects progress:', error);
    }
  };

  const calculateCurrentPhase = (checklistItems) => {
    const phases = ['Phase 1', 'Phase 2', 'Phase 3'];
    for (const phase of phases) {
      const phaseItems = checklistItems.filter(item => item.phase === phase);
      if (phaseItems.length === 0) continue;
      const completedInPhase = phaseItems.filter(item => item.status === 'Complete').length;
      if (completedInPhase < phaseItems.length) {
        return phase;
      }
    }
    return 'Phase 3';
  };

  const handleRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    setRefreshing(true);
    loadProjects(true);
  };

  const handleAutoSave = async () => {
    if (!currentProject?.id) return;
    try {
      setSaveStatus('saving');
      const saveData = {
        handover_id: currentProject.handover_id,
        project_name: currentProject.project_name,
        rd_lead: currentProject.rd_lead,
        automation_lead: currentProject.automation_lead,
        start_date: currentProject.start_date,
        target_date: currentProject.target_date,
        business_priority: currentProject.business_priority,
        complexity_level: currentProject.complexity_level,
        project_score: currentProject.project_score,
        status: currentProject.status,
        current_phase: currentProject.current_phase,
        machine_family: currentProject.machine_family,
        description: currentProject.description,
        context_usage: currentProject.context_usage,
        deliverable: currentProject.deliverable,
      };
      await projectsAPI.update(currentProject.id, saveData);
      const now = new Date();
      setLastSaved(now);
      setSaveStatus('saved');

      // Update the projects array with the current edited project
      // This ensures changes persist when switching between projects
      setProjects(prev => prev.map(p =>
        p.id === currentProject.id ? currentProject : p
      ));

      setTimeout(() => setSaveStatus(''), 3000);
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
      business_priority: 'Media',
      complexity_level: 'Media',
      project_score: 0,
      status: 'active',
      current_phase: 'Phase 1',
      machine_family: '',
      description: '',
      context_usage: '',
      deliverable: 0,
    };
    try {
      const response = await projectsAPI.create(newProject);
      const result = response.data;
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

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    try {
      setIsDeleting(true);
      await projectsAPI.delete(projectToDelete.id);
      setShowDeleteModal(false);
      setProjectToDelete(null);
      setSaveStatus('Project deleted');
      setTimeout(() => setSaveStatus(''), 3000);
      await loadProjects();
    } catch (error) {
      console.error('❌ Error deleting project:', error);
      setSaveStatus('Error deleting project');
      setTimeout(() => setSaveStatus(''), 5000);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteClick = (project, event) => {
    if (event) {
      event.stopPropagation();
    }
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setProjectToDelete(null);
  };

  const handleProjectSelect = (project) => {
    setCurrentProject(project);
    setShowProjectList(false);
  };

  const handleProjectChange = (field, value) => {
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
          <div className="flex items-center gap-1.5 text-primary-700 text-xs bg-primary-100 px-2 py-1 rounded">
            <Loader className="w-3 h-3 animate-spin" />
            <span>Saving...</span>
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center gap-1.5 text-success-700 text-xs bg-success-100 px-2 py-1 rounded">
            <CheckCircle className="w-3 h-3" />
            <span>Saved {lastSaved ? `${lastSaved.toLocaleTimeString()}` : ''}</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1.5 text-danger-700 text-xs bg-danger-100 px-2 py-1 rounded">
            <AlertCircle className="w-3 h-3" />
            <span>Error saving</span>
          </div>
        );
      case 'Project deleted':
        return (
          <div className="flex items-center gap-1.5 text-warning-700 text-xs bg-warning-100 px-2 py-1 rounded">
            <CheckCircle className="w-3 h-3" />
            <span>Project deleted</span>
          </div>
        );
      default:
        return lastSaved ? (
          <div className="text-secondary-600 text-xs font-medium">
            Last saved: {lastSaved.toLocaleTimeString()}
          </div>
        ) : null;
    }
  };

  return (
    <div className="h-screen bg-slate-100 overflow-hidden">
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-danger-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-danger-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-secondary-900">Delete Project?</h3>
                <p className="text-xs text-secondary-500">This action cannot be undone</p>
              </div>
            </div>
            <div className="bg-secondary-50 rounded p-3 mb-3">
              <p className="text-xs text-secondary-700 mb-1">You are about to delete:</p>
              <p className="font-semibold text-sm text-secondary-900">{projectToDelete?.project_name}</p>
              <p className="text-xs text-secondary-600">ID: {projectToDelete?.handover_id}</p>
            </div>
            <div className="bg-warning-50 border border-warning-200 rounded p-2 mb-3">
              <p className="text-xs text-warning-800"><strong>Warning:</strong> This will permanently delete all project data.</p>
              <ul className="text-xs text-warning-700 mt-1 ml-4 list-disc">
                <li>Checklist items</li>
                <li>Knowledge transfer sessions</li>
                <li>Assessment scores</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <button onClick={handleDeleteCancel} disabled={isDeleting} className="flex-1 px-3 py-1.5 text-sm border border-secondary-300 text-secondary-700 rounded hover:bg-secondary-50 transition-colors disabled:opacity-50">Cancel</button>
              <button onClick={handleDeleteConfirm} disabled={isDeleting} className="flex-1 px-3 py-1.5 text-sm bg-danger-600 text-white rounded hover:bg-danger-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
                {isDeleting ? (<><Loader className="w-3.5 h-3.5 animate-spin" />Deleting...</>) : (<><Trash2 className="w-3.5 h-3.5" />Delete Project</>)}
              </button>
            </div>
          </div>
        </div>
      )}
      <header className="bg-gradient-to-r from-primary-700 to-primary-800 border-b-2 border-primary-900 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-4 relative">
            <button onClick={() => setShowProjectList(!showProjectList)} className="absolute left-0 p-2 hover:bg-primary-600 rounded transition-colors" title="Toggle project list">
              <Menu className="w-6 h-6 text-white" />
            </button>
            <div className="text-center">
              <h1 className="text-xl font-bold text-white">Handover Management System</h1>
              {currentProject && (
                <p className="text-sm text-primary-100 mt-0.5">
                  {currentProject.project_name} <span className="text-xs">({currentProject.handover_id})</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Project Sidebar */}
        <aside
          className={`${
            showProjectList ? 'translate-x-0' : '-translate-x-full'
          } fixed lg:relative lg:translate-x-0 w-72 bg-gradient-to-b from-secondary-200 to-secondary-300 border-r-2 border-secondary-400 h-full transition-transform duration-300 z-40 shadow-xl flex flex-col`}
        >
          {/* Projects List - Scrollable */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="flex items-center justify-between mb-3 pb-3 border-b-2 border-secondary-500">
              <h2 className="text-sm font-semibold text-secondary-900">Projects ({projects.length})</h2>
              <button onClick={() => setShowProjectList(false)} className="lg:hidden p-1 hover:bg-secondary-100 rounded"><X className="w-4 h-4" /></button>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary-400" />
              <input type="text" placeholder="Search projects..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-8 pr-3 py-1.5 text-sm border border-secondary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div className="space-y-1.5">
              {filteredProjects.map((project) => {
                const progress = projectsProgress[project.id] || { percentage: 0, completedItems: 0, totalItems: 0, currentPhase: 'Phase 1' };
                const isSelected = currentProject?.id === project.id;

                return (
                  <div key={project.id} className={`group relative rounded transition-all ${
                      isSelected
                        ? 'bg-white border-2 border-primary-600 shadow-lg'
                        : 'bg-secondary-50 hover:bg-white border-2 border-secondary-300 hover:border-primary-400 hover:shadow-sm'
                    }`}>
                    <button onClick={() => handleProjectSelect(project)} className={`w-full text-left pr-8 ${isSelected ? 'p-2' : 'p-1.5'}`}>
                      <div className={`font-medium text-sm text-secondary-900 truncate ${isSelected ? 'mb-0.5' : 'mb-0'}`}>
                        {project.project_name}
                      </div>
                      <div className={`text-xs text-secondary-500 truncate ${isSelected ? 'mb-1.5' : 'mb-0'}`}>
                        {project.handover_id}
                      </div>

                      {isSelected ? (
                        <>
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-xs font-medium text-primary-600">{progress.currentPhase}</div>
                            <div className="text-xs font-semibold text-secondary-700">{progress.percentage}%</div>
                          </div>
                          <div className="w-full bg-secondary-200 rounded-full h-1 mb-1.5">
                            <div className={`h-1 rounded-full transition-all duration-500 ${
                                progress.percentage >= 100 ? 'bg-success-500' :
                                progress.percentage >= 75 ? 'bg-primary-500' :
                                progress.percentage >= 50 ? 'bg-warning-500' :
                                progress.percentage >= 25 ? 'bg-warning-600' :
                                'bg-danger-500'
                              }`} style={{ width: `${progress.percentage}%` }} />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-secondary-400">{progress.completedItems}/{progress.totalItems} tasks</div>
                            <div className="text-xs text-secondary-400">{project.business_priority}</div>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-between text-xs text-secondary-400">
                          <span>{progress.currentPhase} • {progress.percentage}%</span>
                          <span>{progress.completedItems}/{progress.totalItems}</span>
                        </div>
                      )}
                    </button>
                    <button onClick={(e) => handleDeleteClick(project, e)} className={`absolute right-1.5 p-1 opacity-0 group-hover:opacity-100 hover:bg-danger-100 text-danger-600 rounded transition-all ${isSelected ? 'top-2' : 'top-1'}`} title="Delete project">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
            {filteredProjects.length === 0 && (
              <div className="text-center py-6 text-secondary-500">
                <p className="text-sm">No projects found</p>
                <button onClick={handleCreateProject} className="mt-2 text-primary-600 hover:underline text-xs">Create your first project</button>
              </div>
            )}
          </div>

          {/* Bottom Controls - Fixed */}
          <div className="border-t-2 border-secondary-500 bg-secondary-300 p-3 space-y-2">
            {/* Save Status */}
            <div className="flex items-center justify-center h-6">
              {getSaveStatusDisplay()}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleCreateProject}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors font-medium shadow-sm"
              >
                <Plus className="w-4 h-4" />
                New Project
              </button>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 bg-white hover:bg-secondary-50 text-secondary-700 rounded transition-colors shadow-sm"
                  title="Refresh data"
                >
                  <RefreshCw className={`w-4 h-4 mx-auto ${refreshing ? 'animate-spin' : ''}`} />
                </button>

                {currentProject && (
                  <>
                    <button
                      onClick={() => setShowReport(true)}
                      className="p-2 bg-white hover:bg-secondary-50 text-secondary-700 rounded transition-colors shadow-sm"
                      title="Generate status report"
                    >
                      <FileBarChart className="w-4 h-4 mx-auto" />
                    </button>

                    <button
                      onClick={() => handleDeleteClick(currentProject)}
                      className="p-2 bg-white hover:bg-danger-50 text-danger-600 rounded transition-colors shadow-sm"
                      title="Delete current project"
                    >
                      <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white">
          {/* Tab Navigation */}
          <div className="bg-white border-b-2 border-secondary-300 shadow-sm">
            <div className="overflow-x-auto">
              <div className="flex gap-0.5 px-3 min-w-max">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-1.5 px-4 py-2.5 border-b-3 text-sm transition-all whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'border-secondary-700 text-white bg-secondary-700 font-semibold shadow-md rounded-t -mb-0.5'
                          : 'border-transparent text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100'
                      }`}>
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-4 overflow-y-auto flex-1 bg-white">
            {loading ? (
              <div className="flex items-center justify-center h-full"><Loader className="w-6 h-6 text-primary-600 animate-spin" /></div>
            ) : !currentProject ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <FileText className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
                  <h2 className="text-lg font-semibold text-secondary-600 mb-2">No Project Selected</h2>
                  <p className="text-sm text-secondary-500 mb-3">Create a new project or select an existing one to get started</p>
                  <button onClick={handleCreateProject} className="px-4 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors">Create New Project</button>
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
            ) : activeTab === 'knowledge' ? (
              <Knowledge projectId={currentProject.id} />
            ) : activeTab === 'issues' ? (
              <Issues projectId={currentProject.id} />
            ) : activeTab === 'attachments' ? (
              <Attachments projectId={currentProject.id} />
            ) : (
              <div className="bg-white rounded shadow-sm border border-secondary-200 p-4">
                <h2 className="text-base font-semibold text-secondary-900 mb-3">{tabs.find(t => t.id === activeTab)?.label}</h2>
                <p className="text-sm text-secondary-600">This section is coming soon! The full components will be added next.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Status Report Modal */}
      {showReport && currentProject && (
        <StatusReport
          projectId={currentProject.id}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}

export default App;