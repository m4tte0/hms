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
        return 'text-secondary-600 bg-gray-50';
      case 'scheduled':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-secondary-600 bg-gray-50';
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
        return 'text-secondary-600 bg-gray-50';
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

  const { project, statistics, teamContacts, checklistByPhase, knowledgeSessions, issues, attachments, phaseNames, features } = reportData;

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
          {/* Frontispiece - Cover Page for Print */}
          <div className="hidden print:flex print:flex-col print:justify-center print:items-center print:min-h-screen print:page-break-after-always text-center">
            {/* Top spacing */}
            <div className="flex-1"></div>

            {/* Main content */}
            <div className="flex-1 flex flex-col justify-center">
              {/* Document Type */}
              <div className="mb-8">
                <div className="inline-block px-6 py-2 border-2 border-slate-300 rounded-lg">
                  <p className="text-sm uppercase tracking-widest text-slate-600 font-semibold">
                    Handover Management System
                  </p>
                </div>
              </div>

              {/* Project Title */}
              <h1 className="text-5xl font-bold text-slate-800 mb-4 leading-tight">
                {project.project_name || 'Handover Project'}
              </h1>

              {/* Subtitle */}
              <p className="text-xl text-slate-600 mb-12">
                Status Report
              </p>

              {/* Divider */}
              <div className="w-32 h-1 bg-slate-600 mx-auto mb-12"></div>

              {/* Metadata */}
              <div className="space-y-4 text-slate-700">
                <div>
                  <p className="text-sm uppercase tracking-wide text-slate-500 mb-1">Project ID</p>
                  <p className="text-lg font-semibold">{project.handover_id || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-sm uppercase tracking-wide text-slate-500 mb-1">Handover Start Date</p>
                  <p className="text-lg font-semibold">{formatDate(project.start_date)}</p>
                </div>

                <div>
                  <p className="text-sm uppercase tracking-wide text-slate-500 mb-1">Prepared By</p>
                  <p className="text-lg font-semibold">{project.automation_lead || project.rd_lead || 'Project Team'}</p>
                </div>
              </div>
            </div>

            {/* Bottom section */}
            <div className="flex-1 flex flex-col justify-end pb-12">
              <p className="text-sm text-slate-500">
                Generated on {formatDate(new Date().toISOString())}
              </p>
            </div>
          </div>

          {/* Table of Contents */}
          <div className="mb-6 print-page-break-before">
            <h2 className="text-2xl font-bold text-slate-800 mb-4 border-b-2 border-slate-600 pb-2">
              Table of Contents
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between py-1 border-b border-dotted border-slate-300">
                <span className="font-medium text-slate-700">1. Project Summary</span>
              </div>
              {teamContacts.length > 0 && (
                <div className="flex items-center justify-between py-1 border-b border-dotted border-slate-300">
                  <span className="font-medium text-slate-700">2. Team Composition</span>
                </div>
              )}
              {features && features.length > 0 && (
                <div className="flex items-center justify-between py-1 border-b border-dotted border-slate-300">
                  <span className="font-medium text-slate-700">3. Specifiche Funzionalità</span>
                </div>
              )}
              {knowledgeSessions.length > 0 && (
                <div className="flex items-center justify-between py-1 border-b border-dotted border-slate-300">
                  <span className="font-medium text-slate-700">4. Knowledge Transfer Calendar</span>
                </div>
              )}
              <div className="flex items-center justify-between py-1 border-b border-dotted border-slate-300">
                <span className="font-medium text-slate-700">5. Handover Process Overview</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-dotted border-slate-300">
                <span className="font-medium text-slate-700">6. Checklist Status Details</span>
              </div>
              {issues.length > 0 && (
                <div className="flex items-center justify-between py-1 border-b border-dotted border-slate-300">
                  <span className="font-medium text-slate-700">7. Issues & Risks</span>
                </div>
              )}
              {attachments.length > 0 && (
                <div className="flex items-center justify-between py-1 border-b border-dotted border-slate-300">
                  <span className="font-medium text-slate-700">8. Attachments & Documentation</span>
                </div>
              )}
            </div>
          </div>

          {/* COMPACT HEADER: Sections 1-4 Combined */}
          <section className="mb-6 page-break-inside-avoid print-page-break-before">
            <h3 className="text-xl font-bold text-secondary-800 mb-3 border-b-2 border-slate-600 pb-2">
              Project Summary
            </h3>

            {/* Two-column layout for compact display */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* Left Column: Project Details & Leadership - Clean style matching Overview tab */}
              <div className="space-y-4">
                {/* Project Information */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-2 pb-1 border-b border-slate-200">
                    Project Information
                  </h4>
                  <div className="space-y-2">
                    <div className="flex flex-col md:flex-row gap-2">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-slate-600 mb-0.5">Project Name</label>
                        <div className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm font-semibold text-slate-900">
                          {project.project_name || 'N/A'}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <label className="block text-xs font-medium text-slate-600 mb-0.5">ID</label>
                        <div className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm text-slate-700">
                          {project.handover_id || 'N/A'}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <label className="block text-xs font-medium text-slate-600 mb-0.5">Status</label>
                        <div className="px-2 py-1.5">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(project.status)}`}>
                            {project.status || 'Active'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-0.5">Current Phase</label>
                        <div className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm text-slate-700">
                          {project.current_phase || 'Phase 1'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-0.5">Project Score</label>
                        <div className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm font-semibold text-slate-700">
                          {project.project_score || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Project Metrics */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-2 pb-1 border-b border-slate-200">
                    Project Metrics
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-0.5">Priority</label>
                      <div className="px-2 py-1.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${getPriorityColor(project.business_priority)}`}>
                          {project.business_priority || 'Not set'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-0.5">Complexity</label>
                      <div className="px-2 py-1.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${getPriorityColor(project.complexity_level)}`}>
                          {project.complexity_level || 'Not set'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Project Details */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-2 pb-1 border-b border-slate-200">
                    Project Details
                  </h4>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-0.5">Machine Family</label>
                        <div className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm text-slate-700">
                          {project.machine_family || 'Not specified'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-0.5">Deliverable</label>
                        <div className="px-2 py-1.5">
                          {project.deliverable ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-semibold">
                              <CheckCircle className="w-3 h-3" />
                              Yes (Voce a Listino)
                            </span>
                          ) : (
                            <span className="text-sm text-slate-600">No</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {project.description && (
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-0.5">Description</label>
                        <div className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 leading-relaxed">
                          {project.description}
                        </div>
                      </div>
                    )}
                    {project.context_usage && (
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-0.5">Context and Usage</label>
                        <div className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 leading-relaxed">
                          {project.context_usage}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Leadership */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-2 pb-1 border-b border-slate-200">
                    Project Leadership
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-0.5">R&D Lead</label>
                      <div className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm text-slate-700">
                        {project.rd_lead || 'Not assigned'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-0.5">Automation Lead</label>
                      <div className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm text-slate-700">
                        {project.automation_lead || 'Not assigned'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Statistics Grid - Clean style matching Overview tab */}
              <div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-2 pb-1 border-b border-slate-200">
                    Progress Statistics
                  </h4>
                  <div className="grid grid-cols-2 gap-3">

                    {/* Checklist Items */}
                    <div className="bg-slate-50 border border-slate-200 rounded p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-xs text-slate-600 font-medium mb-1">Checklist</p>
                          <p className="text-xl font-bold text-slate-800 leading-none">{statistics.checklist.completed}/{statistics.checklist.total}</p>
                          <p className="text-xs text-emerald-600 font-medium mt-1">{statistics.checklist.completionPercentage}% Done</p>
                        </div>
                        <CheckCircle className="w-5 h-5 text-emerald-500 opacity-50" />
                      </div>
                    </div>

                    {/* Knowledge Sessions */}
                    <div className="bg-slate-50 border border-slate-200 rounded p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-xs text-slate-600 font-medium mb-1">Sessions</p>
                          <p className="text-xl font-bold text-slate-800 leading-none">{statistics.knowledge.completed}/{statistics.knowledge.total}</p>
                          <p className="text-xs text-blue-600 font-medium mt-1">Completed</p>
                        </div>
                        <Users className="w-5 h-5 text-blue-500 opacity-50" />
                      </div>
                    </div>

                    {/* Open Issues */}
                    <div className="bg-slate-50 border border-slate-200 rounded p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-xs text-slate-600 font-medium mb-1">Open Issues</p>
                          <p className="text-xl font-bold text-slate-800 leading-none">{statistics.issues.open + statistics.issues.inProgress}</p>
                          <p className="text-xs text-amber-600 font-medium mt-1">of {statistics.issues.total} total</p>
                        </div>
                        <AlertTriangle className="w-5 h-5 text-amber-500 opacity-50" />
                      </div>
                    </div>

                    {/* Attachments */}
                    <div className="bg-slate-50 border border-slate-200 rounded p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-xs text-slate-600 font-medium mb-1">Files</p>
                          <p className="text-xl font-bold text-slate-800 leading-none">{statistics.attachments.total}</p>
                          <p className="text-xs text-slate-600 font-medium mt-1">{formatFileSize(statistics.attachments.totalSize)}</p>
                        </div>
                        <FileText className="w-5 h-5 text-slate-500 opacity-50" />
                      </div>
                    </div>

                  </div>
                </div>
              </div>

            </div>

            {/* Project Timeline - Full Width - Clean style */}
            <div className="mt-4 page-break-inside-avoid">
              <h4 className="text-sm font-semibold text-slate-900 mb-2 pb-1 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-600" />
                  <span>Project Timeline</span>
                </div>
                <span className={`text-xs font-semibold ${project.daysRemaining < 0 ? 'text-red-600' : project.daysRemaining < 7 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {project.daysRemaining !== null ? `${project.daysRemaining} days remaining` : ''}
                </span>
              </h4>

              {/* Visual Timeline with Phase Colors */}
              {project.start_date && project.target_date && (() => {
                const start = new Date(project.start_date);
                const end = new Date(project.target_date);
                const today = new Date();
                const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
                const elapsedDays = Math.ceil((today - start) / (1000 * 60 * 60 * 24));
                const timeProgress = Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));

                return (
                  <div className="bg-slate-50 rounded p-3">
                    <div className="relative">
                      {/* Timeline Bar with Phase Segments */}
                      <div className="relative h-3 rounded-full overflow-hidden flex">
                        {/* Background */}
                        <div className="absolute inset-0 bg-slate-200" />
                        {/* Phase segments - default division */}
                        <div className="absolute h-full bg-gradient-to-r from-blue-300 to-blue-500" style={{ left: '0%', width: '33%' }} />
                        <div className="absolute h-full bg-gradient-to-r from-yellow-300 to-yellow-500" style={{ left: '33%', width: '50%' }} />
                        <div className="absolute h-full bg-gradient-to-r from-green-300 to-green-500" style={{ left: '83%', width: '17%' }} />
                      </div>

                      {/* Phase Divider Markers */}
                      <div className="absolute top-0 flex flex-col items-center pointer-events-none" style={{ left: '33%', transform: 'translateX(-50%)' }}>
                        <div className="w-0.5 h-3 bg-slate-700 opacity-60"></div>
                        <div className="w-1.5 h-1.5 bg-slate-700 rounded-full opacity-60"></div>
                      </div>
                      <div className="absolute top-0 flex flex-col items-center pointer-events-none" style={{ left: '83%', transform: 'translateX(-50%)' }}>
                        <div className="w-0.5 h-3 bg-slate-700 opacity-60"></div>
                        <div className="w-1.5 h-1.5 bg-slate-700 rounded-full opacity-60"></div>
                      </div>

                      {/* Month Markers */}
                      {(() => {
                        const monthMarkers = [];
                        let currentDate = new Date(start.getFullYear(), start.getMonth() + 1, 1);
                        while (currentDate < end) {
                          const markerPercent = ((currentDate - start) / (end - start)) * 100;
                          if (markerPercent > 0 && markerPercent < 100) {
                            monthMarkers.push(
                              <div
                                key={currentDate.toISOString()}
                                className="absolute top-0 flex flex-col items-center pointer-events-none"
                                style={{ left: `${markerPercent}%`, transform: 'translateX(-50%)' }}
                              >
                                <div className="w-px h-3 bg-slate-400 opacity-40"></div>
                                <div className="mt-0.5 text-[9px] text-slate-500 opacity-70 whitespace-nowrap">
                                  {currentDate.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })}
                                </div>
                              </div>
                            );
                          }
                          currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
                        }
                        return monthMarkers;
                      })()}

                      {/* Today Marker */}
                      <div
                        className="absolute top-0 flex flex-col items-center z-10"
                        style={{ left: `${timeProgress}%`, transform: 'translateX(-50%)' }}
                      >
                        <div className="w-0.5 h-3 bg-red-600"></div>
                        <div className="w-3 h-3 bg-red-600 rounded-full border-2 border-white shadow-md"></div>
                        <div className="mt-1 px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded whitespace-nowrap">
                          TODAY
                        </div>
                      </div>
                    </div>

                    {/* Date Labels */}
                    <div className="flex justify-between items-center mt-8 text-xs">
                      <div className="text-left">
                        <div className="text-slate-500 font-medium">Start</div>
                        <div className="text-sm font-semibold text-slate-900">{formatDate(project.start_date)}</div>
                      </div>
                      <div className="text-center bg-emerald-50 px-3 py-1 rounded">
                        <div className="text-slate-500 font-medium">Duration</div>
                        <div className="text-sm font-semibold text-slate-900">{totalDays} days</div>
                      </div>
                      <div className="text-right">
                        <div className="text-slate-500 font-medium">Target</div>
                        <div className="text-sm font-semibold text-slate-900">{formatDate(project.target_date)}</div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Status Indicator */}
              <div className={`mt-3 p-2 rounded ${project.completionPercentage >= (project.daysRemaining !== null ? Math.round(((new Date() - new Date(project.start_date)) / (new Date(project.target_date) - new Date(project.start_date))) * 100) : 0) ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                <div className="flex items-center gap-2">
                  {project.completionPercentage >= (project.daysRemaining !== null ? Math.round(((new Date() - new Date(project.start_date)) / (new Date(project.target_date) - new Date(project.start_date))) * 100) : 0) ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span className="text-xs font-medium text-emerald-800">On Track - Work progress ({project.completionPercentage}%) is ahead of schedule</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span className="text-xs font-medium text-amber-800">Behind Schedule - Work progress ({project.completionPercentage}%) is behind timeline</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Team Composition - Moved here for better organization */}
          {teamContacts.length > 0 && (
            <section className="mb-6 page-break-inside-avoid">
              <h3 className="text-xl font-bold text-secondary-800 mb-3 border-b-2 border-blue-500 pb-2 flex items-center">
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

          {/* Specifiche Funzionalità - Feature Specifications */}
          {features && features.length > 0 && (
            <section className="mb-6 print-page-break-before">
              <h3 className="text-xl font-bold text-secondary-800 mb-3 border-b-2 border-purple-500 pb-2 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Specifiche Funzionalità
              </h3>
              <div className="space-y-4">
                {features.map((feature, idx) => (
                  <div
                    key={idx}
                    className="bg-white border-l-4 border-purple-500 rounded-lg shadow-sm page-break-inside-avoid"
                  >
                    <div className="p-4">
                      {/* Feature Name Header */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-lg text-sm font-semibold">
                          #{idx + 1}
                        </span>
                        <h4 className="text-lg font-semibold text-secondary-900">
                          {feature.feature_name || 'Unnamed Feature'}
                        </h4>
                      </div>

                      {/* Feature Details */}
                      <div className="space-y-3">
                        {/* Description */}
                        {feature.description && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wide mb-1">
                              Descrizione
                            </p>
                            <p className="text-sm text-secondary-700 leading-relaxed whitespace-pre-wrap">
                              {feature.description}
                            </p>
                          </div>
                        )}

                        {/* Purpose / Finalità */}
                        {feature.purpose && (
                          <div className="bg-blue-50 rounded-lg p-3">
                            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
                              Finalità
                            </p>
                            <p className="text-sm text-secondary-700 leading-relaxed whitespace-pre-wrap">
                              {feature.purpose}
                            </p>
                          </div>
                        )}

                        {/* Technical Specifications */}
                        {feature.tech_specs && (
                          <div className="bg-amber-50 rounded-lg p-3">
                            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">
                              Specifiche Tecniche
                            </p>
                            <p className="text-sm text-secondary-700 leading-relaxed whitespace-pre-wrap font-mono">
                              {feature.tech_specs}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Features Summary */}
              <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-3 text-center page-break-inside-avoid">
                <p className="text-sm text-secondary-600">
                  Total Features Documented: <span className="font-bold text-purple-700">{features.length}</span>
                </p>
              </div>
            </section>
          )}

          {/* Knowledge Transfer Calendar - Compact Multi-Month View (same style as Calendario tab) */}
          {knowledgeSessions.length > 0 && (
            <section className="mb-6 print-page-break-before">
              <h3 className="text-xl font-bold text-secondary-800 mb-3 border-b-2 border-blue-500 pb-2 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Knowledge Transfer Calendar
              </h3>

              {/* Calendar Legend */}
              <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-blue-50 border-2 border-blue-300"></div>
                  <span className="text-secondary-600">Has Sessions</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-green-100 border border-green-400"></div>
                  <span className="text-secondary-600">Completed</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-400"></div>
                  <span className="text-secondary-600">Scheduled</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-red-100 border border-red-400"></div>
                  <span className="text-secondary-600">Cancelled</span>
                </div>
              </div>

              {/* Multi-Month Calendar Grid */}
              {(() => {
                // Helper functions
                const getDaysInMonth = (date) => {
                  const year = date.getFullYear();
                  const month = date.getMonth();
                  const firstDay = new Date(year, month, 1);
                  const lastDay = new Date(year, month + 1, 0);
                  const daysInMonth = lastDay.getDate();
                  const startingDayOfWeek = firstDay.getDay();
                  const adjustedStartDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1; // Monday = 0
                  return { daysInMonth, startingDayOfWeek: adjustedStartDay, year, month };
                };

                const getSessionsForDate = (date) => {
                  return knowledgeSessions.filter(session => {
                    const sessionDate = new Date(session.scheduled_date + 'T00:00:00');
                    return sessionDate.toDateString() === date.toDateString();
                  });
                };

                // Get unique months from sessions
                const sessionMonths = new Set();
                knowledgeSessions.forEach(session => {
                  const date = new Date(session.scheduled_date + 'T00:00:00');
                  sessionMonths.add(`${date.getFullYear()}-${date.getMonth()}`);
                });

                // Convert to sorted array of Date objects
                const projectMonths = Array.from(sessionMonths)
                  .map(key => {
                    const [year, month] = key.split('-').map(Number);
                    return new Date(year, month, 1);
                  })
                  .sort((a, b) => a - b);

                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

                return (
                  <div className="bg-white border border-secondary-200 rounded-lg p-4 page-break-inside-avoid">
                    {/* Multi-Month Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {projectMonths.map((monthDate, index) => {
                        const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(monthDate);

                        return (
                          <div key={index} className="bg-white border border-secondary-200 rounded p-3">
                            {/* Month Header */}
                            <div className="text-center mb-2">
                              <div className="text-sm font-bold text-secondary-900">{monthNames[month]}</div>
                              <div className="text-xs text-secondary-500">{year}</div>
                            </div>

                            {/* Day Name Headers */}
                            <div className="grid grid-cols-7 gap-1 mb-1">
                              {dayNames.map((name, i) => (
                                <div key={i} className="text-[10px] font-semibold text-secondary-500 text-center">
                                  {name}
                                </div>
                              ))}
                            </div>

                            {/* Calendar Days */}
                            <div className="grid grid-cols-7 gap-1">
                              {/* Empty cells before first day */}
                              {Array.from({ length: startingDayOfWeek }, (_, i) => (
                                <div key={`empty-${i}`} className="aspect-square"></div>
                              ))}

                              {/* Day cells */}
                              {Array.from({ length: daysInMonth }, (_, i) => {
                                const day = i + 1;
                                const date = new Date(year, month, day);
                                const daySessions = getSessionsForDate(date);
                                const hasSessions = daySessions.length > 0;

                                // Determine background color based on session status
                                let bgClass = 'bg-white text-secondary-700';
                                let ringClass = '';

                                if (hasSessions) {
                                  const hasCompleted = daySessions.some(s => s.status === 'Completed');
                                  const hasCancelled = daySessions.some(s => s.status === 'Cancelled');
                                  const hasScheduled = daySessions.some(s => s.status === 'Scheduled' || !s.status);

                                  if (hasCompleted && !hasScheduled && !hasCancelled) {
                                    bgClass = 'bg-green-100 text-green-800';
                                    ringClass = 'ring-2 ring-green-400';
                                  } else if (hasCancelled && !hasScheduled && !hasCompleted) {
                                    bgClass = 'bg-red-100 text-red-800';
                                    ringClass = 'ring-2 ring-red-400';
                                  } else {
                                    bgClass = 'bg-blue-50 text-blue-700';
                                    ringClass = 'ring-2 ring-blue-300';
                                  }
                                }

                                return (
                                  <div
                                    key={day}
                                    className={`aspect-square flex items-center justify-center text-xs font-medium rounded ${bgClass} ${ringClass}`}
                                    title={hasSessions ? daySessions.map(s => s.session_topic).join(', ') : ''}
                                  >
                                    {day}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Sessions List Below Calendar */}
                    <div className="mt-4 pt-4 border-t border-secondary-200">
                      <h4 className="text-sm font-semibold text-secondary-900 mb-3">Session Details</h4>
                      <div className="space-y-2">
                        {knowledgeSessions
                          .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))
                          .map((session, idx) => (
                            <div key={idx} className="flex items-start gap-3 bg-gray-50 rounded p-2 text-sm page-break-inside-avoid">
                              <div className={`flex-shrink-0 px-2 py-1 rounded text-xs font-medium min-w-[80px] text-center ${
                                session.status === 'Completed'
                                  ? 'bg-green-100 text-green-700'
                                  : session.status === 'Cancelled'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {formatDate(session.scheduled_date)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-secondary-900">{session.session_topic}</div>
                                <div className="text-xs text-secondary-500">
                                  {session.start_time && <span>{session.start_time}</span>}
                                  {session.duration && <span> ({session.duration})</span>}
                                  {session.attendees && <span> · {session.attendees}</span>}
                                </div>
                              </div>
                              <span className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(session.status)}`}>
                                {session.status || 'Scheduled'}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Summary Stats */}
              <div className="mt-4 grid grid-cols-3 gap-3 page-break-inside-avoid">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-secondary-600 mb-1">Total Sessions</p>
                  <p className="text-2xl font-bold text-blue-700">{knowledgeSessions.length}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-secondary-600 mb-1">Completed</p>
                  <p className="text-2xl font-bold text-green-700">
                    {knowledgeSessions.filter(s => s.status === 'Completed').length}
                  </p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-secondary-600 mb-1">Scheduled</p>
                  <p className="text-2xl font-bold text-yellow-700">
                    {knowledgeSessions.filter(s => s.status === 'Scheduled').length}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* SECTION 2: Phase Breakdown - Matching Overview tab style */}
          <section className="mb-6 print-page-break-before">
            <h3 className="text-xl font-bold text-secondary-800 mb-3 border-b-2 border-blue-500 pb-2">
              Handover Process Overview
            </h3>
            {Object.keys(statistics.phases).length > 0 ? (
              <div className="bg-white rounded shadow-sm border border-slate-200 p-4">
                <div className="space-y-2">
                  {(() => {
                    // Define phase metadata
                    const phaseMetadata = {
                      'Phase 1': {
                        activities: 'Prerequisites completion, documentation review, initial assessment',
                        criteria: 'All technical and documentation requirements met'
                      },
                      'Phase 2': {
                        activities: 'Training sessions, hands-on activities, shadow support',
                        criteria: 'Team demonstrates competency in system operation'
                      },
                      'Phase 3': {
                        activities: 'Approvals, documentation handover, transition activities',
                        criteria: 'All sign-offs completed and access transferred'
                      }
                    };

                    return Object.entries(statistics.phases).map(([phase, stats], index) => {
                      const phaseName = phaseNames.find(p => p.phase_id === phase)?.phase_name || phase;
                      const metadata = phaseMetadata[phase] || { activities: 'Phase activities', criteria: 'Phase criteria' };

                      // Determine status based on progress
                      const status = stats.percentage === 100 ? 'complete' :
                                    (stats.percentage > 0 || stats.inProgress > 0) ? 'progress' : 'pending';

                      return (
                        <div
                          key={phase}
                          className={`p-3 rounded border page-break-inside-avoid ${
                            status === 'complete' ? 'bg-emerald-50 border-emerald-200' :
                            status === 'progress' ? 'bg-amber-50 border-amber-200' :
                            'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Phase Number Circle */}
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                              status === 'complete' ? 'bg-emerald-500 text-white' :
                              status === 'progress' ? 'bg-amber-500 text-white' :
                              'bg-slate-300 text-slate-600'
                            }`}>
                              {index + 1}
                            </div>

                            <div className="flex-1 min-w-0">
                              {/* Phase Header */}
                              <div className="flex items-center justify-between mb-1.5">
                                <h4 className="text-sm font-semibold text-slate-900">{phaseName}</h4>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-blue-600">{stats.percentage}%</span>
                                  {status === 'complete' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                                  {status === 'progress' && <Clock className="w-4 h-4 text-amber-500" />}
                                </div>
                              </div>

                              {/* Progress Bar */}
                              <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    status === 'complete' ? 'bg-emerald-500' :
                                    status === 'progress' ? 'bg-amber-500' :
                                    'bg-slate-400'
                                  }`}
                                  style={{ width: `${stats.percentage}%` }}
                                />
                              </div>

                              {/* Key Activities and Success Criteria */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="font-medium text-slate-700">Key Activities:</span>
                                  <p className="text-slate-600 mt-0.5">{metadata.activities}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-slate-700">Success Criteria:</span>
                                  <p className="text-slate-600 mt-0.5">{metadata.criteria}</p>
                                </div>
                              </div>

                              {/* Task Statistics */}
                              <div className="mt-2 pt-2 border-t border-slate-200">
                                <div className="flex flex-wrap gap-3 text-xs">
                                  <span className="text-slate-600">
                                    <span className="font-medium">Total:</span> {stats.total}
                                  </span>
                                  <span className="text-emerald-600">
                                    <span className="font-medium">Complete:</span> {stats.completed}
                                  </span>
                                  <span className="text-blue-600">
                                    <span className="font-medium">In Progress:</span> {stats.inProgress}
                                  </span>
                                  <span className="text-slate-500">
                                    <span className="font-medium">Not Started:</span> {stats.notStarted}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            ) : (
              <p className="text-secondary-500 italic">No phase data available</p>
            )}
          </section>

          {/* SECTION 3: Checklist Details */}
          <section className="mb-6 print-page-break-before">
            <h3 className="text-xl font-bold text-secondary-800 mb-3 border-b-2 border-blue-500 pb-2">
              Checklist Status Details
            </h3>
            {Object.keys(checklistByPhase).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(checklistByPhase).map(([phase, categories]) => {
                  const phaseName = phaseNames.find(p => p.phase_id === phase)?.phase_name || phase;
                  return (
                    <div key={phase} className="page-break-inside-avoid">
                      <h4 className="text-xl font-semibold mb-3 text-secondary-700">{phaseName}</h4>
                      {Object.entries(categories).map(([category, items]) => (
                        <div key={category} className="mb-4 ml-4">
                          <h5 className="text-lg font-medium mb-2 text-secondary-600">{category}</h5>
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
              <p className="text-secondary-500 italic">No checklist items available</p>
            )}
          </section>

          {/* SECTION 4: Issues & Risks */}
          {issues.length > 0 && (
            <section className="mb-6 print-page-break-before">
              <h3 className="text-xl font-bold text-secondary-800 mb-3 border-b-2 border-blue-500 pb-2">
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

          {/* SECTION 5: Attachments */}
          {attachments.length > 0 && (
            <section className="mb-6 print-page-break-before">
              <h3 className="text-xl font-bold text-secondary-800 mb-3 border-b-2 border-blue-500 pb-2">
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
          <div className="mt-12 pt-6 border-t-2 border-gray-300 text-center text-sm text-secondary-500">
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

          /* Frontispiece - full page cover */
          .print\\:page-break-after-always {
            page-break-after: always !important;
            break-after: always !important;
          }

          .print\\:min-h-screen {
            min-height: 100vh !important;
          }

          .print\\:flex {
            display: flex !important;
          }

          .print\\:flex-col {
            flex-direction: column !important;
          }

          .print\\:justify-center {
            justify-content: center !important;
          }

          .print\\:items-center {
            align-items: center !important;
          }

          /* Avoid page breaks inside elements */
          .page-break-inside-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          /* Force page break before element - for new sections */
          .print-page-break-before {
            page-break-before: always !important;
            break-before: always !important;
          }

          /* Prevent section headers from being orphaned at bottom of page */
          h3, h4 {
            page-break-after: avoid;
            break-after: avoid;
          }

          /* Keep section headers with their first content */
          section > h3 {
            page-break-after: avoid;
            break-after: avoid;
          }

          /* Avoid breaking sections right after header */
          section {
            page-break-inside: auto;
          }

          /* Keep first element after any header with the header */
          h3 + *, h4 + * {
            page-break-before: avoid;
            break-before: avoid;
          }

          /* Prevent orphaned table headers */
          thead, caption {
            page-break-after: avoid;
            break-after: avoid;
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
