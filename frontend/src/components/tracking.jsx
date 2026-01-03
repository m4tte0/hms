// frontend/src/components/Tracking.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle, Plus, Edit2, Trash2, X, Save } from 'lucide-react';

const Tracking = ({ projectId }) => {
  const [checklistItems, setChecklistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [ganttView, setGanttView] = useState('phase'); // 'phase' or 'category'

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load project info
      const projectResponse = await fetch(`${API_BASE_URL}/projects/${projectId}`);
      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        setProject(projectData);
      }

      // Load checklist items
      const checklistResponse = await fetch(`${API_BASE_URL}/checklist/${projectId}`);
      if (checklistResponse.ok) {
        const checklistData = await checklistResponse.json();
        setChecklistItems(checklistData);
      }
    } catch (error) {
      console.error('Error loading tracking data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate progress by phase
  const getPhaseProgress = (phaseId) => {
    const phaseItems = checklistItems.filter(item => item.phase === phaseId);
    if (phaseItems.length === 0) return 0;
    const completed = phaseItems.filter(item => item.status === 'Complete').length;
    return Math.round((completed / phaseItems.length) * 100);
  };

  // Calculate progress by category
  const getCategoryProgress = (phase, category) => {
    const categoryItems = checklistItems.filter(
      item => item.phase === phase && item.category === category
    );
    if (categoryItems.length === 0) return 0;
    const completed = categoryItems.filter(item => item.status === 'Complete').length;
    return Math.round((completed / categoryItems.length) * 100);
  };

  // Get unique categories per phase
  const getCategoriesByPhase = (phaseId) => {
    const phaseItems = checklistItems.filter(item => item.phase === phaseId);
    const categories = [...new Set(phaseItems.map(item => item.category))];
    return categories;
  };

  // Calculate status for visual indicator
  const getStatusColor = (progress) => {
    if (progress === 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getStatusText = (progress) => {
    if (progress === 100) return 'Complete';
    if (progress >= 75) return 'Nearly Complete';
    if (progress >= 50) return 'In Progress';
    if (progress >= 25) return 'Started';
    return 'Not Started';
  };

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

  const phases = [
    { id: 'Phase 1', name: 'Phase 1: Pre-Handover Assessment', color: 'blue' },
    { id: 'Phase 2', name: 'Phase 2: Knowledge Transfer Sessions', color: 'yellow' },
    { id: 'Phase 3', name: 'Phase 3: Final Sign-Offs', color: 'green' }
  ];

  const timeline = calculateTimeline();
  const overallProgress = checklistItems.length > 0
    ? Math.round((checklistItems.filter(i => i.status === 'Complete').length / checklistItems.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timeline Summary */}
      {timeline && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-secondary-900">Project Timeline</h2>
            <div className="flex items-center gap-2 text-sm text-secondary-600">
              <Clock className="w-4 h-4" />
              <span>{timeline.remainingDays} days remaining</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-secondary-600 mb-1">Start Date</div>
              <div className="text-lg font-semibold text-secondary-900">
                {timeline.start.toLocaleDateString()}
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-sm text-secondary-600 mb-1">Target Date</div>
              <div className="text-lg font-semibold text-secondary-900">
                {timeline.end.toLocaleDateString()}
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-secondary-600 mb-1">Total Duration</div>
              <div className="text-lg font-semibold text-secondary-900">
                {timeline.totalDays} days
              </div>
            </div>
          </div>

          {/* Time Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-secondary-600">Time Progress</span>
              <span className="font-semibold text-blue-600">{timeline.timeProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${timeline.timeProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-secondary-500">
              <span>{timeline.elapsedDays} days elapsed</span>
              <span>{timeline.remainingDays} days remaining</span>
            </div>
          </div>

          {/* Work Progress vs Time Progress */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-secondary-600">Work Progress</span>
              <span className="font-semibold text-green-600">{overallProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>

            {/* Progress Status Indicator */}
            <div className="mt-3 p-3 rounded-lg" style={{
              backgroundColor: overallProgress >= timeline.timeProgress ? '#ecfdf5' : '#fef3c7'
            }}>
              <div className="flex items-center gap-2">
                {overallProgress >= timeline.timeProgress ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      On Track - Work progress is ahead of schedule
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">
                      Behind Schedule - Work progress is {timeline.timeProgress - overallProgress}% behind timeline
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gantt Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-secondary-900">Gantt Chart</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setGanttView('phase')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                ganttView === 'phase'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-secondary-600 hover:bg-gray-200'
              }`}
            >
              By Phase
            </button>
            <button
              onClick={() => setGanttView('category')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                ganttView === 'category'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-secondary-600 hover:bg-gray-200'
              }`}
            >
              By Category
            </button>
          </div>
        </div>

        {ganttView === 'phase' ? (
          // Phase View
          <div className="space-y-4">
            {phases.map((phase) => {
              const progress = getPhaseProgress(phase.id);
              const phaseItems = checklistItems.filter(item => item.phase === phase.id);

              return (
                <div key={phase.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        phase.color === 'blue' ? 'bg-blue-500' :
                        phase.color === 'yellow' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`} />
                      <h3 className="font-semibold text-secondary-900">{phase.name}</h3>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-secondary-600">
                        {phaseItems.filter(i => i.status === 'Complete').length}/{phaseItems.length} tasks
                      </span>
                      <span className="text-sm font-semibold text-blue-600">{progress}%</span>
                    </div>
                  </div>

                  {/* Progress Bar with Segments */}
                  <div className="relative">
                    <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                      <div
                        className={`h-8 rounded-full transition-all duration-500 flex items-center justify-center ${getStatusColor(progress)}`}
                        style={{ width: `${progress}%` }}
                      >
                        {progress > 10 && (
                          <span className="text-xs font-bold text-white">
                            {getStatusText(progress)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Task Breakdown */}
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-green-50 rounded p-2">
                      <div className="font-medium text-green-700">Complete</div>
                      <div className="text-green-900 font-bold">
                        {phaseItems.filter(i => i.status === 'Complete').length}
                      </div>
                    </div>
                    <div className="bg-yellow-50 rounded p-2">
                      <div className="font-medium text-yellow-700">In Progress</div>
                      <div className="text-yellow-900 font-bold">
                        {phaseItems.filter(i => i.status === 'In Progress').length}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <div className="font-medium text-secondary-700">Not Started</div>
                      <div className="text-secondary-900 font-bold">
                        {phaseItems.filter(i => i.status === 'Not Started').length}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Category View
          <div className="space-y-6">
            {phases.map((phase) => {
              const categories = getCategoriesByPhase(phase.id);

              if (categories.length === 0) return null;

              return (
                <div key={phase.id} className="space-y-3">
                  <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
                    <div className={`w-3 h-3 rounded-full ${
                      phase.color === 'blue' ? 'bg-blue-500' :
                      phase.color === 'yellow' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`} />
                    <h3 className="font-semibold text-secondary-900">{phase.name}</h3>
                  </div>

                  <div className="space-y-2 pl-6">
                    {categories.map((category) => {
                      const progress = getCategoryProgress(phase.id, category);
                      const categoryItems = checklistItems.filter(
                        item => item.phase === phase.id && item.category === category
                      );

                      return (
                        <div key={category} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-secondary-900">{category}</h4>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-secondary-600">
                                {categoryItems.filter(i => i.status === 'Complete').length}/{categoryItems.length}
                              </span>
                              <span className="text-xs font-semibold text-blue-600">{progress}%</span>
                            </div>
                          </div>

                          <div className="w-full bg-gray-200 rounded-full h-4">
                            <div
                              className={`h-4 rounded-full transition-all duration-500 ${getStatusColor(progress)}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Phase Milestones */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-secondary-900 mb-4">Phase Milestones</h2>

        <div className="space-y-4">
          {phases.map((phase, index) => {
            const progress = getPhaseProgress(phase.id);
            const isComplete = progress === 100;
            const isInProgress = progress > 0 && progress < 100;

            return (
              <div key={phase.id} className="flex items-start gap-4">
                {/* Timeline Dot */}
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                    isComplete ? 'bg-green-500 text-white' :
                    isInProgress ? 'bg-blue-500 text-white' :
                    'bg-gray-300 text-secondary-600'
                  }`}>
                    {isComplete ? '✓' : index + 1}
                  </div>
                  {index < phases.length - 1 && (
                    <div className={`w-0.5 h-16 ${
                      isComplete ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>

                {/* Phase Info */}
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-secondary-900">{phase.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      isComplete ? 'bg-green-100 text-green-800' :
                      isInProgress ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-secondary-800'
                    }`}>
                      {isComplete ? 'Completed' : isInProgress ? 'In Progress' : 'Pending'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-secondary-600">
                    <span>{progress}% complete</span>
                    <span>•</span>
                    <span>
                      {checklistItems.filter(i => i.phase === phase.id).length} tasks
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Tracking;
