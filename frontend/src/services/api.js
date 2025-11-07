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

// --- API per i Contatti del Team ---
export const teamContactsAPI = {
  getContacts: (projectId) => apiClient.get(`/team-contacts/${projectId}`),
  addContact: (projectId, contactData) => apiClient.post(`/team-contacts/${projectId}`, contactData),
  updateContact: (projectId, contactId, contactData) => apiClient.put(`/team-contacts/${projectId}/${contactId}`, contactData),
  deleteContact: (projectId, contactId) => apiClient.delete(`/team-contacts/${projectId}/${contactId}`),
};

// Esportiamo il client di default per usi generici, se necessario.
export default apiClient;
