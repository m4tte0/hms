// frontend/src/components/Overview.jsx
import React from 'react';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

const Overview = ({ project, setProject }) => {
  const handleChange = (field, value) => {
    setProject({ ...project, [field]: value });
  };

  const phases = [
    {
      name: 'Phase 1: Pre-Handover Assessment',
      duration: '2-4 weeks',
      status: 'complete',
      activities: 'Prerequisites completion, documentation review, initial assessment',
      criteria: 'All technical and documentation requirements met'
    },
    {
      name: 'Phase 2: Knowledge Transfer',
      duration: '2-6 weeks',
      status: 'progress',
      activities: 'Training sessions, hands-on activities, shadow support',
      criteria: 'Team demonstrates competency in system operation'
    },
    {
      name: 'Phase 3: Acceptance Testing',
      duration: '1-2 weeks',
      status: 'pending',
      activities: 'Independent validation, operational testing',
      criteria: 'All acceptance criteria passed'
    },
    {
      name: 'Phase 4: Official Handover',
      duration: '1 week',
      status: 'pending',
      activities: 'Final approvals, access transfer, documentation handover',
      criteria: 'Formal sign-offs completed'
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
            <input
              type="text"
              value={project.rd_lead || ''}
              onChange={(e) => handleChange('rd_lead', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Name and email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Automation Team Lead
            </label>
            <input
              type="text"
              value={project.automation_lead || ''}
              onChange={(e) => handleChange('automation_lead', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Name and email"
            />
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

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Priority
            </label>
            <select
              value={project.business_priority || 'Standard'}
              onChange={(e) => handleChange('business_priority', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Mission Critical">Mission Critical</option>
              <option value="Business Critical">Business Critical</option>
              <option value="Important">Important</option>
              <option value="Standard">Standard</option>
            </select>
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
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">{phase.duration}</span>
                      {phase.status === 'complete' && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      {phase.status === 'progress' && (
                        <Clock className="w-5 h-5 text-yellow-500" />
                      )}
                    </div>
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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-blue-600 mb-1">25%</div>
          <div className="text-sm text-gray-600">Overall Progress</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-green-600 mb-1">12</div>
          <div className="text-sm text-gray-600">Tasks Completed</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-yellow-600 mb-1">8</div>
          <div className="text-sm text-gray-600">Tasks In Progress</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-red-600 mb-1">3</div>
          <div className="text-sm text-gray-600">Pending Issues</div>
        </div>
      </div>
    </div>
  );
};

export default Overview;