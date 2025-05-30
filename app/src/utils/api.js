import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Create API instance
const API_BASE_URL = 'http://10.0.2.2:3000/api'; // Uses 10.0.2.2 for Android emulator to connect to localhost

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth token
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API functions for Auth
export const auth = {
  login: (email, password) => {
    return api.post('/auth/login', { email, password });
  },
  register: (userData) => {
    return api.post('/auth/register', userData);
  },
  getCurrentUser: () => {
    return api.get('/auth/me');
  },
};

// API functions for Families
export const families = {
  create: (familyData) => {
    return api.post('/families', familyData);
  },
  getAll: () => {
    return api.get('/families');
  },
  getById: (id) => {
    return api.get(`/families/${id}`);
  },
  update: (id, familyData) => {
    return api.put(`/families/${id}`, familyData);
  },
  delete: (id) => {
    return api.delete(`/families/${id}`);
  },
  getProfiles: (id) => {
    return api.get(`/families/${id}/profiles`);
  },
  createProfile: (id, profileData) => {
    return api.post(`/families/${id}/profiles`, profileData);
  },
  getDevices: (id) => {
    return api.get(`/families/${id}/devices`);
  },
  generateEnrollment: (id) => {
    return api.post(`/families/${id}/enroll`);
  },
  validateEnrollmentCode: (code) => {
    return api.get(`/families/enroll/validate/${code}`);
  },
};

// API functions for Devices
export const devices = {
  getById: (id) => {
    return api.get(`/devices/${id}`);
  },
  update: (id, deviceData) => {
    return api.put(`/devices/${id}`, deviceData);
  },
  delete: (id) => {
    return api.delete(`/devices/${id}`);
  },
  updateRestrictions: (id, profileId) => {
    return api.put(`/devices/${id}/restrictions`, { profileId });
  },
  blockApp: (id, appData) => {
    return api.post(`/devices/${id}/apps/block`, appData);
  },
  allowApp: (id, appBundleId) => {
    return api.post(`/devices/${id}/apps/allow`, { appBundleId });
  },
  getBlockedApps: (id) => {
    return api.get(`/devices/${id}/apps/blocked`);
  },
  lockDevice: (id, message) => {
    return api.post(`/devices/${id}/lock`, { message });
  },
};

// API functions for Profiles
export const profiles = {
  getById: (id) => {
    return api.get(`/profiles/${id}`);
  },
  update: (id, profileData) => {
    return api.put(`/profiles/${id}`, profileData);
  },
  delete: (id) => {
    return api.delete(`/profiles/${id}`);
  },
  getDefaultTemplates: () => {
    return api.get('/profiles/templates/default');
  },
};

export default api;