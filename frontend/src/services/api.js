import axios from 'axios';

// L'URL del backend viene letto UNA SOLA VOLTA dalla variabile d'ambiente.
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Viene creata un'istanza di Axios che sarÃ  usata in tutta l'app.
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// --- API per i Progetti ---
export const projectsAPI = {
  getAll: () => apiClient.get('/projects'),
  getOne: (id) => apiClient.get(`/projects/${id}`),
  getById: (id) => apiClient.get(`/projects/${id}`),
  create: (projectData) => apiClient.post('/projects', projectData),
  update: (id, projectData) => apiClient.put(`/projects/${id}`, projectData),
  delete: (id) => apiClient.delete(`/projects/${id}`),
  getReport: (id) => apiClient.get(`/projects/${id}/report`),
};

// --- API per la Checklist ---
export const checklistAPI = {
  getAll: (projectId) => apiClient.get(`/checklist/${projectId}`),
  // Aggiungi qui altri metodi se necessario (create, update, delete)
};

// --- API per gli Issues ---
export const issuesAPI = {
  getAll: (projectId) => apiClient.get(`/issues/${projectId}`),
};

// --- API per i Nomi delle Fasi ---
export const phaseNamesAPI = {
  get: (projectId) => apiClient.get(`/phase-names/${projectId}`),
  save: (projectId, phases) => apiClient.post(`/phase-names/${projectId}`, { phases }),
};

// --- API per le Date delle Fasi ---
export const phaseDatesAPI = {
  get: (projectId) => apiClient.get(`/phase-dates/${projectId}`),
  save: (projectId, phaseId, startDate, endDate) =>
    apiClient.post(`/phase-dates/${projectId}`, { phaseId, startDate, endDate }),
  delete: (projectId, phaseId) => apiClient.delete(`/phase-dates/${projectId}/${phaseId}`),
};

// --- API per i Contatti del Team ---
export const teamContactsAPI = {
  getContacts: (projectId) => apiClient.get(`/team-contacts/${projectId}`),
  addContact: (projectId, contactData) => apiClient.post(`/team-contacts/${projectId}`, contactData),
  updateContact: (projectId, contactId, contactData) => apiClient.put(`/team-contacts/${projectId}/${contactId}`, contactData),
  deleteContact: (projectId, contactId) => apiClient.delete(`/team-contacts/${projectId}/${contactId}`),
};

// --- API per le Newsletter ---
export const newsletterAPI = {
  // Subscriptions
  getSubscriptions: (projectId) => apiClient.get(`/newsletter/subscriptions/${projectId}`),
  addSubscription: (projectId, email) => apiClient.post(`/newsletter/subscriptions/${projectId}`, { email }),
  updateSubscription: (projectId, subscriptionId, subscribed) =>
    apiClient.put(`/newsletter/subscriptions/${projectId}/${subscriptionId}`, { subscribed }),
  deleteSubscription: (projectId, subscriptionId) =>
    apiClient.delete(`/newsletter/subscriptions/${projectId}/${subscriptionId}`),
  autoSubscribe: (projectId) => apiClient.post(`/newsletter/auto-subscribe/${projectId}`),

  // Settings
  getSettings: (projectId) => apiClient.get(`/newsletter/settings/${projectId}`),
  updateSettings: (projectId, settings) => apiClient.put(`/newsletter/settings/${projectId}`, settings),

  // History
  getHistory: (projectId) => apiClient.get(`/newsletter/history/${projectId}`),

  // Manual trigger (testing only)
  triggerNow: () => apiClient.post('/newsletter/trigger')
};

// Esportiamo il client di default per usi generici, se necessario.
export default apiClient;
