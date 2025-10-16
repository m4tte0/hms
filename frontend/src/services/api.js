// frontend/src/services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ==================== PROJECTS API ====================

export const projectsAPI = {
  getAll: () => api.get('/projects'),
  
  getById: (id) => api.get(`/projects/${id}`),
  
  create: (projectData) => api.post('/projects', projectData),
  
  update: (id, projectData) => api.put(`/projects/${id}`, projectData),
  
  delete: (id) => api.delete(`/projects/${id}`),
};

// ==================== CHECKLIST API ====================

export const checklistAPI = {
  getItems: (projectId) => api.get(`/checklist/${projectId}`),
  
  addItem: (projectId, itemData) => api.post(`/checklist/${projectId}`, itemData),
  
  updateItem: (projectId, itemId, itemData) => 
    api.put(`/checklist/${projectId}/${itemId}`, itemData),
  
  deleteItem: (projectId, itemId) => 
    api.delete(`/checklist/${projectId}/${itemId}`),
};

// ==================== KNOWLEDGE TRANSFER API ====================

export const knowledgeAPI = {
  getSessions: (projectId) => api.get(`/knowledge/${projectId}`),
  
  createSession: (projectId, sessionData) => 
    api.post(`/knowledge/${projectId}`, sessionData),
  
  updateSession: (projectId, sessionId, sessionData) => 
    api.put(`/knowledge/${projectId}/${sessionId}`, sessionData),
  
  deleteSession: (projectId, sessionId) => 
    api.delete(`/knowledge/${projectId}/${sessionId}`),
};

// ==================== ASSESSMENT API ====================

export const assessmentAPI = {
  getScores: (projectId) => api.get(`/assessment/${projectId}`),
  
  saveScore: (projectId, scoreData) => 
    api.post(`/assessment/${projectId}`, scoreData),
  
  calculateReadiness: (projectId) => 
    api.post(`/assessment/${projectId}/calculate`),
};

// ==================== ISSUES API ====================

export const issuesAPI = {
  getIssues: (projectId) => api.get(`/issues/${projectId}`),

  createIssue: (projectId, issueData) =>
    api.post(`/issues/${projectId}`, issueData),

  updateIssue: (projectId, issueId, issueData) =>
    api.put(`/issues/${projectId}/${issueId}`, issueData),

  deleteIssue: (projectId, issueId) =>
    api.delete(`/issues/${projectId}/${issueId}`),
};

// ==================== TEAM CONTACTS API ====================

export const teamContactsAPI = {
  getContacts: (projectId) => api.get(`/team-contacts/${projectId}`),

  addContact: (projectId, contactData) =>
    api.post(`/team-contacts/${projectId}`, contactData),

  updateContact: (projectId, contactId, contactData) =>
    api.put(`/team-contacts/${projectId}/${contactId}`, contactData),

  deleteContact: (projectId, contactId) =>
    api.delete(`/team-contacts/${projectId}/${contactId}`),
};

// ==================== UTILITY FUNCTIONS ====================

export const healthCheck = () => api.get('/health');

export default api;