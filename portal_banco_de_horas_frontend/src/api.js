// src/api.js
// (Versão Final Completa - Todas as Funções)

import axios from 'axios';

// URL do Backend (Verifique se está rodando nesta porta)
const API_URL = 'https://portal-backend-dtf6.onrender.com';
const TOKEN_KEY = 'auth_token_14reg';

// --- Helpers de Token ---
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// --- Configuração do Axios ---
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Injeta o token em cada requisição automaticamente
api.interceptors.request.use(config => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- 1. Autenticação ---
export const auth = {
  login: (email, password) => api.post('/login', { email, password }),
  signup: (name, role, email, password) => api.post('/signup', { name, role, email, password }),
};

// --- 2. Funções de Utilizador ---
export const user = {
  getProfile: () => api.get('/me'),
  getRequests: () => api.get('/me/requests'),
  createRequest: (type, hours, reason) => api.post('/me/requests', { type, hours, reason }),
  convertPoints: (hours) => api.post('/me/convert', { hours }),
  getParticipations: () => api.get('/me/participations'), // Para ver status dos desafios
};

// --- 3. Funções de Desafios (Público/User) ---
export const challenge = {
  getAll: () => api.get('/challenges'),
  enroll: (challenge_id) => api.post(`/me/challenges/${challenge_id}/enroll`),
  submitProof: (challenge_id, proof_url) => api.post(`/me/challenges/${challenge_id}/proof`, { proof_url }),
};

// --- 4. Funções de Administrador ---
export const admin = {
  // Configurações Gerais
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (points_per_hour) => api.put('/admin/settings', { points_per_hour }),
  
  // Gestão de Pedidos
  getAllRequests: () => api.get('/admin/requests'), 
  processRequest: (request_id, status) => api.post(`/admin/requests/${request_id}/process`, { status }),
  
  // Gestão de Desafios
  createChallenge: (data) => api.post('/admin/challenges', data),
  deleteChallenge: (challenge_id) => api.delete(`/admin/challenges/${challenge_id}`),
  
  // Validação de Provas
  getPendingValidations: () => api.get('/admin/participants/pending'),
  getAllParticipations: () => api.get('/admin/participants/all'),
  validateParticipant: (participant_id, approved) => api.post(`/admin/participants/${participant_id}/validate`, { approved }),
  
  // Gestão de Usuários
  getAllUsers: () => api.get('/admin/users'),
  updateUser: (user_id, data) => api.put(`/admin/users/${user_id}`, data),
  deleteUser: (user_id) => api.delete(`/admin/users/${user_id}`),
  resetPassword: (user_id, new_password) => api.post(`/admin/users/${user_id}/reset_password`, { new_password }),
  
  // Detalhes de Usuário
  getUserRequests: (user_id) => api.get(`/admin/users/${user_id}/requests`),
  adjustUserHours: (user_id, hours, reason) => api.post(`/admin/users/${user_id}/adjust`, { hours, reason }),

  // Gestão de Cargos (Roles)
  addRole: (name) => api.post('/admin/roles', { name }),
  deleteRole: (id) => api.delete(`/admin/roles/${id}`),
};

// --- 5. Funções Públicas ---
export const getPublicRoles = () => api.get('/roles');