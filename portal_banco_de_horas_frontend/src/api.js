import axios from 'axios';

const API_URL = 'https://portal-backend-dtf6.onrender.com';
const TOKEN_KEY = 'auth_token_14reg';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(config => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const auth = {
  login: (email, password) => api.post('/login', { email, password }),
  signup: (name, role, email, password) => api.post('/signup', { name, role, email, password }),
};

export const user = {
  getProfile: () => api.get('/me'),
  getRequests: () => api.get('/me/requests'),
  createRequest: (type, hours, reason) => api.post('/me/requests', { type, hours, reason }),
  convertPoints: (hours) => api.post('/me/convert', { hours }),
  getParticipations: () => api.get('/me/participations'),
  
  // --- AQUI ESTÁ A CHAVE DO PROBLEMA ---
  getSettings: () => api.get('/me/settings'),
};

export const challenge = {
  getAll: () => api.get('/challenges'),
  enroll: (challenge_id) => api.post(`/me/challenges/${challenge_id}/enroll`),
  submitProof: (challenge_id, proof_url) => api.post(`/me/challenges/${challenge_id}/proof`, { proof_url }),
};

export const admin = {
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (points_per_hour) => api.put('/admin/settings', { points_per_hour }),
  getAllRequests: () => api.get('/admin/requests'), 
  processRequest: (request_id, status) => api.post(`/admin/requests/${request_id}/process`, { status }),
  createChallenge: (data) => api.post('/admin/challenges', data),
  deleteChallenge: (challenge_id) => api.delete(`/admin/challenges/${challenge_id}`),
  getPendingValidations: () => api.get('/admin/participants/pending'),
  getAllParticipations: () => api.get('/admin/participants/all'),
  validateParticipant: (participant_id, approved) => api.post(`/admin/participants/${participant_id}/validate`, { approved }),
  getAllUsers: () => api.get('/admin/users'),
  updateUser: (user_id, data) => api.put(`/admin/users/${user_id}`, data),
  deleteUser: (user_id) => api.delete(`/admin/users/${user_id}`),
  resetPassword: (user_id, new_password) => api.post(`/admin/users/${user_id}/reset_password`, { new_password }),
  getUserRequests: (user_id) => api.get(`/admin/users/${user_id}/requests`),
  adjustUserHours: (user_id, hours, reason) => api.post(`/admin/users/${user_id}/adjust`, { hours, reason }),
  addRole: (name) => api.post('/admin/roles', { name }),
  deleteRole: (id) => api.delete(`/admin/roles/${id}`),
};

export const getPublicRoles = () => api.get('/roles');