// frontend/src/components/StatusReport.jsx
import React, { useState, useEffect, useRef } from 'react';
import { X, Download, FileText, Calendar, Users, CheckCircle, AlertTriangle, Clock, TrendingUp, Printer } from 'lucide-react';
import { projectsAPI } from '../services/api';

const StatusReport = ({ projectId, onClose }) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const reportRef = useRef(null);

  useEffect(() => {
    loadReportData();
  }, [projectId]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await projectsAPI.getReport(projectId);
      setReportData(response.data);
    } catch (err) {
      console.error('Error loading report:', err);
      setError('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    // Trigger browser print dialog
    window.print();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'complete':
      case 'completed':
      case 'resolved':
        return 'text-green-600 bg-green-50';
      case 'in progress':
        return 'text-blue-600 bg-blue-50';
      case 'not started':
      case 'open':
        return 'text-gray-600 bg-gray-50';
      case 'scheduled':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'alta':
      case 'high':
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'media':
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'bassa':
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-lg">Generating report...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!reportData) return null;

  const { project, statistics, teamContacts, checklistByPhase, assessmentsByPhase, knowledgeSessions, issues, attachments, phaseNames } = reportData;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-auto p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header - No Print */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex justify-between items-center print:hidden">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6" />
            <h2 className="text-2xl font-bold">Handover Status Report</h2>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 px-4 py-2 bg-white text-blue-600 rounded hover:bg-blue-50 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-blue-700 rounded transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div ref={reportRef} className="report-content flex-1 overflow-auto p-8 print:p-4">
          {/* Print Header */}
          <div className="hidden print:block mb-8 border-b-2 pb-4">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Handover Management System</h1>
            <h2 className="text-2xl text-gray-600">Status Report</h2>
            <p className="text-sm text-gray-500 mt-2">Generated on {formatDate(new Date().toISOString())}</p>
          </div>

          {/* COMPACT HEADER: Sections 1-4 Combined */}
          <section className="mb-6 page-break-inside-avoid">
            <h3 className="text-xl font-bold text-gray-800 mb-3 border-b-2 border-blue-500 pb-2">
              Project Summary
            </h3>

            {/* Two-column layout for compact display */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* Left Column: Project Details & Leadership */}
              <div className="space-y-3">
                {/* Project Information */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">Project Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">ID:</span>
                      <span className="ml-1 font-semibold">{project.handover_id || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className={`ml-1 px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(project.status)}`}>
                        {project.status || 'Active'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600">Name:</span>
                      <span className="ml-1 font-semibold">{project.project_name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Phase:</span>
                      <span className="ml-1 font-medium">{project.current_phase || 'Phase 1'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Score:</span>
                      <span className="ml-1 font-semibold text-green-700">{project.project_score || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Timeline & Progress */}
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-3 rounded-lg border border-purple-200">
                  <h4 className="text-sm font-semibold text-purple-900 mb-2">Timeline & Progress</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start:</span>
                      <span className="font-medium">{formatDate(project.start_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Target:</span>
                      <span className="font-medium">{formatDate(project.target_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Days Left:</span>
                      <span className={`font-semibold ${project.daysRemaining < 0 ? 'text-red-600' : project.daysRemaining < 7 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {project.daysRemaining !== null ? `${project.daysRemaining} days` : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Completion:</span>
                        <span className="font-semibold text-green-700">{project.completionPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-green-600 h-2.5 rounded-full transition-all"
                          style={{ width: `${project.completionPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Project Metrics */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Project Metrics</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Priority:</span>
                      <span className={`ml-1 px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(project.business_priority)}`}>
                        {project.business_priority || 'Not set'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Complexity:</span>
                      <span className={`ml-1 px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(project.complexity_level)}`}>
                        {project.complexity_level || 'Not set'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Leadership */}
                <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-3 rounded-lg border border-indigo-200">
                  <h4 className="text-sm font-semibold text-indigo-900 mb-2">Project Leadership</h4>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-gray-600">R&D Lead:</span>
                      <span className="ml-1 font-medium">{project.rd_lead || 'Not assigned'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Automation Lead:</span>
                      <span className="ml-1 font-medium">{project.automation_lead || 'Not assigned'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Statistics Grid */}
              <div>
                <div className="bg-white border-2 border-gray-200 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Progress Statistics</h4>
                  <div className="grid grid-cols-2 gap-3">

                    {/* Checklist Items */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-xs text-gray-600 mb-1">Checklist Items</p>
                          <p className="text-2xl font-bold text-green-700 leading-none">{statistics.checklist.completed}/{statistics.checklist.total}</p>
                          <p className="text-xs text-gray-600 mt-1">{statistics.checklist.completionPercentage}% Complete</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-600 opacity-40" />
                      </div>
                    </div>

                    {/* Knowledge Sessions */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-xs text-gray-600 mb-1">Knowledge Sessions</p>
                          <p className="text-2xl font-bold text-blue-700 leading-none">{statistics.knowledge.completed}/{statistics.knowledge.total}</p>
                          <p className="text-xs text-gray-600 mt-1">Completed</p>
                        </div>
                        <Users className="w-8 h-8 text-blue-600 opacity-40" />
                      </div>
                    </div>

                    {/* Open Issues */}
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-3 rounded-lg border border-yellow-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-xs text-gray-600 mb-1">Open Issues</p>
                          <p className="text-2xl font-bold text-yellow-700 leading-none">{statistics.issues.open + statistics.issues.inProgress}</p>
                          <p className="text-xs text-gray-600 mt-1">of {statistics.issues.total} total</p>
                        </div>
                        <AlertTriangle className="w-8 h-8 text-yellow-600 opacity-40" />
                      </div>
                    </div>

                    {/* Attachments */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg border border-purple-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-xs text-gray-600 mb-1">Attachments</p>
                          <p className="text-2xl font-bold text-purple-700 leading-none">{statistics.attachments.total}</p>
                          <p className="text-xs text-gray-600 mt-1">{formatFileSize(statistics.attachments.totalSize)}</p>
                        </div>
                        <FileText className="w-8 h-8 text-purple-600 opacity-40" />
                      </div>
                    </div>

                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* Team Composition - Moved here for better organization */}
          {teamContacts.length > 0 && (
            <section className="mb-6 page-break-inside-avoid">
              <h3 className="text-xl font-bold text-gray-800 mb-3 border-b-2 border-blue-500 pb-2 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Team Composition
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold">Department</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold">Role</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold">Name</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold">Email</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold">Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamContacts.map((contact, idx) => (
                      <tr key={idx} className="border-t border-gray-200">
                        <td className="px-3 py-2">{contact.department}</td>
                        <td className="px-3 py-2">{contact.role}</td>
                        <td className="px-3 py-2 font-medium">{contact.name}</td>
                        <td className="px-3 py-2">{contact.email}</td>
                        <td className="px-3 py-2">{contact.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* SECTION 2: Phase Breakdown */}
          <section className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-3 border-b-2 border-blue-500 pb-2">
              Phase Progress Breakdown
            </h3>
            {Object.keys(statistics.phases).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(statistics.phases).map(([phase, stats]) => {
                  const phaseName = phaseNames.find(p => p.phase_id === phase)?.phase_name || phase;
                  return (
                    <div key={phase} className="bg-gray-50 p-4 rounded-lg page-break-inside-avoid">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-lg font-semibold">{phaseName}</h4>
                        <span className="text-sm font-semibold text-blue-600">{stats.percentage}% Complete</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all"
                          style={{ width: `${stats.percentage}%` }}
                        ></div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center text-sm">
                        <div>
                          <p className="text-gray-600">Total</p>
                          <p className="font-semibold">{stats.total}</p>
                        </div>
                        <div>
                          <p className="text-green-600">Complete</p>
                          <p className="font-semibold">{stats.completed}</p>
                        </div>
                        <div>
                          <p className="text-blue-600">In Progress</p>
                          <p className="font-semibold">{stats.inProgress}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Not Started</p>
                          <p className="font-semibold">{stats.notStarted}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 italic">No phase data available</p>
            )}
          </section>

          {/* SECTION 3: Checklist Details */}
          <section className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-3 border-b-2 border-blue-500 pb-2">
              Checklist Status Details
            </h3>
            {Object.keys(checklistByPhase).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(checklistByPhase).map(([phase, categories]) => {
                  const phaseName = phaseNames.find(p => p.phase_id === phase)?.phase_name || phase;
                  return (
                    <div key={phase} className="page-break-inside-avoid">
                      <h4 className="text-xl font-semibold mb-3 text-gray-700">{phaseName}</h4>
                      {Object.entries(categories).map(([category, items]) => (
                        <div key={category} className="mb-4 ml-4">
                          <h5 className="text-lg font-medium mb-2 text-gray-600">{category}</h5>
                          <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-200 text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-semibold">Requirement</th>
                                  <th className="px-3 py-2 text-left text-xs font-semibold">Status</th>
                                  <th className="px-3 py-2 text-left text-xs font-semibold">Verified By</th>
                                  <th className="px-3 py-2 text-left text-xs font-semibold">Date</th>
                                  <th className="px-3 py-2 text-left text-xs font-semibold">Notes</th>
                                </tr>
                              </thead>
                              <tbody>
                                {items.map((item, idx) => (
                                  <tr key={idx} className="border-t border-gray-200">
                                    <td className="px-3 py-2">{item.requirement}</td>
                                    <td className="px-3 py-2">
                                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                                        {item.status}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2">{item.verified_by || '-'}</td>
                                    <td className="px-3 py-2">{formatDate(item.verification_date)}</td>
                                    <td className="px-3 py-2 text-xs">{item.notes || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 italic">No checklist items available</p>
            )}
          </section>

          {/* SECTION 4: Assessment Summary */}
          {Object.keys(assessmentsByPhase).length > 0 && (
            <section className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-3 border-b-2 border-blue-500 pb-2">
                Assessment Summary
              </h3>
              <div className="space-y-4">
                {Object.entries(assessmentsByPhase).map(([phase, scores]) => {
                  const phaseName = phaseNames.find(p => p.phase_id === phase)?.phase_name || phase;
                  const avgScore = scores.length > 0
                    ? (scores.reduce((sum, s) => sum + (s.score || 0), 0) / scores.length).toFixed(1)
                    : 'N/A';
                  return (
                    <div key={phase} className="page-break-inside-avoid">
                      <h4 className="text-lg font-semibold mb-2">{phaseName} - Average Score: {avgScore}</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-200 text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-semibold">Category</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold">Criteria</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold">Score</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold">Evidence</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold">Assessed By</th>
                            </tr>
                          </thead>
                          <tbody>
                            {scores.map((score, idx) => (
                              <tr key={idx} className="border-t border-gray-200">
                                <td className="px-3 py-2">{score.category}</td>
                                <td className="px-3 py-2">{score.criteria}</td>
                                <td className="px-3 py-2">
                                  <span className="font-semibold text-blue-600">{score.score}/10</span>
                                </td>
                                <td className="px-3 py-2 text-xs">{score.evidence || '-'}</td>
                                <td className="px-3 py-2">{score.assessed_by || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* SECTION 5: Knowledge Transfer Sessions */}
          {knowledgeSessions.length > 0 && (
            <section className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-3 border-b-2 border-blue-500 pb-2">
                Knowledge Transfer Sessions
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold">Topic</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold">Date</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold">Duration</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold">Attendees</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {knowledgeSessions.map((session, idx) => (
                      <tr key={idx} className="border-t border-gray-200">
                        <td className="px-3 py-2">{session.session_topic}</td>
                        <td className="px-3 py-2">{formatDate(session.scheduled_date)}</td>
                        <td className="px-3 py-2">{session.duration || '-'}</td>
                        <td className="px-3 py-2 text-xs">{session.attendees || '-'}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(session.status)}`}>
                            {session.status}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          {session.effectiveness_rating ? `${session.effectiveness_rating}/5` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* SECTION 6: Issues & Risks */}
          {issues.length > 0 && (
            <section className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-3 border-b-2 border-blue-500 pb-2">
                Issues & Risks
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold">Issue ID</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold">Priority</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold">Description</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold">Assigned To</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold">Target Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issues.map((issue, idx) => (
                      <tr key={idx} className="border-t border-gray-200">
                        <td className="px-3 py-2 font-medium">{issue.issue_id}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getPriorityColor(issue.priority)}`}>
                            {issue.priority}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs max-w-xs">{issue.description}</td>
                        <td className="px-3 py-2">{issue.assigned_to || '-'}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(issue.status)}`}>
                            {issue.status}
                          </span>
                        </td>
                        <td className="px-3 py-2">{formatDate(issue.target_resolution)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* SECTION 7: Attachments */}
          {attachments.length > 0 && (
            <section className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-3 border-b-2 border-blue-500 pb-2">
                Attachments & Documentation
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold">File Name</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold">Size</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold">Type</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold">Description</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold">Uploaded By</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attachments.map((attachment, idx) => (
                      <tr key={idx} className="border-t border-gray-200">
                        <td className="px-3 py-2 font-medium">{attachment.original_name}</td>
                        <td className="px-3 py-2">{formatFileSize(attachment.file_size)}</td>
                        <td className="px-3 py-2 text-xs">{attachment.mime_type}</td>
                        <td className="px-3 py-2 text-xs">{attachment.description || '-'}</td>
                        <td className="px-3 py-2">{attachment.uploaded_by || '-'}</td>
                        <td className="px-3 py-2">{formatDate(attachment.uploaded_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Report Footer */}
          <div className="mt-12 pt-6 border-t-2 border-gray-300 text-center text-sm text-gray-500">
            <p>End of Handover Status Report</p>
            <p className="mt-2">Generated by Handover Management System on {formatDate(new Date().toISOString())}</p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          /* Hide everything except report content */
          body * {
            visibility: hidden;
          }

          /* Show only the report content */
          .report-content, .report-content * {
            visibility: visible;
          }

          /* Position report at top of page */
          .report-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }

          /* Hide modal overlay and non-printable elements */
          .print\\:hidden {
            display: none !important;
          }

          /* Avoid page breaks inside elements */
          .page-break-inside-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          /* Preserve colors when printing */
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }

          /* Remove backgrounds from modal */
          .fixed {
            position: static !important;
            background: white !important;
          }

          /* Full width for print */
          .max-w-6xl {
            max-width: 100% !important;
          }

          /* Remove shadows and borders from container */
          .shadow-2xl {
            box-shadow: none !important;
          }

          .rounded-lg {
            border-radius: 0 !important;
          }

          /* Optimize spacing for print */
          .p-8 {
            padding: 1rem !important;
          }

          /* Ensure tables fit on page */
          table {
            page-break-inside: auto;
          }

          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }

          thead {
            display: table-header-group;
          }

          /* Better page margins */
          @page {
            margin: 1cm;
          }
        }
      `}} />
    </div>
  );
};

export default StatusReport;
