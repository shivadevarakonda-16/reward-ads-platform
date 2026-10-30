import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('reward_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for session expiration
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      // Clear token on 401
      localStorage.removeItem('reward_token');
      localStorage.removeItem('reward_user');
    }
    return Promise.reject(error.response?.data || error);
  }
);

// Modular API functions
export const authApi = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  getMe: () => apiClient.get('/auth/me')
};

export const userApi = {
  getProfile: () => apiClient.get('/users/me'),
  updateProfile: (data) => apiClient.patch('/users/me', data)
};

export const campaignApi = {
  getCampaigns: (params) => apiClient.get('/campaigns', { params }),
  getCampaignById: (id) => apiClient.get(`/campaigns/${id}`),
  getFeed: (params) => apiClient.get('/campaigns/feed', { params })
};

export const adViewApi = {
  start: (data) => apiClient.post('/adviews/start', data),
  heartbeat: (id, data) => apiClient.post(`/adviews/${id}/heartbeat`, data),
  end: (id, data) => apiClient.post(`/adviews/${id}/end`, data),
  getDailyStats: () => apiClient.get('/adviews/daily-stats')
};

export const activityApi = {
  submit: (data) => apiClient.post('/activities', data),
  getMine: () => apiClient.get('/activities/mine')
};

export const referralApi = {
  generate: (data) => apiClient.post('/referrals/generate', data),
  getMine: () => apiClient.get('/referrals/mine')
};

export const dealApi = {
  getDeals: (params) => apiClient.get('/deals', { params }),
  redeem: (id) => apiClient.post(`/deals/${id}/redeem`)
};

export const walletApi = {
  getSummary: () => apiClient.get('/wallet'),
  getTransactions: (params) => apiClient.get('/wallet/transactions', { params }),
  withdraw: (data) => apiClient.post('/wallet/withdraw', data)
};

export const notificationApi = {
  getAll: () => apiClient.get('/notifications'),
  markRead: (id) => apiClient.patch(`/notifications/${id}/read`),
  markAllRead: () => apiClient.post('/notifications/mark-all-read')
};

export const adminApi = {
  getStats: () => apiClient.get('/admin/stats'),
  // Products
  getProducts: (params) => apiClient.get('/admin/products', { params }),
  createProduct: (data) => apiClient.post('/admin/products', data),
  updateProduct: (id, data) => apiClient.put(`/admin/products/${id}`, data),
  deleteProduct: (id) => apiClient.delete(`/admin/products/${id}`),
  // Sponsors
  getSponsors: (params) => apiClient.get('/admin/sponsors', { params }),
  createSponsor: (data) => apiClient.post('/admin/sponsors', data),
  updateSponsor: (id, data) => apiClient.put(`/admin/sponsors/${id}`, data),
  deleteSponsor: (id) => apiClient.delete(`/admin/sponsors/${id}`),
  // Campaigns
  getCampaigns: (params) => apiClient.get('/admin/campaigns', { params }),
  createCampaign: (data) => apiClient.post('/admin/campaigns', data),
  updateCampaign: (id, data) => apiClient.put(`/admin/campaigns/${id}`, data),
  updateCampaignStatus: (id, status) => apiClient.patch(`/admin/campaigns/${id}/status`, { status }),
  // Activities Queue
  getActivities: (params) => apiClient.get('/admin/activities', { params }),
  decideActivity: (id, data) => apiClient.patch(`/admin/activities/${id}/decision`, data),
  // Rewards
  getRewards: (params) => apiClient.get('/admin/rewards', { params }),
  decideReward: (id, data) => apiClient.patch(`/admin/rewards/${id}/decision`, data),
  bulkDecideRewards: (data) => apiClient.post('/admin/rewards/bulk-decision', data),
  // Fraud & Users
  getFraudLogs: (params) => apiClient.get('/admin/fraud', { params }),
  toggleUserStatus: (id, data) => apiClient.patch(`/admin/users/${id}/status`, data),
  getUsers: (params) => apiClient.get('/admin/users', { params }),
  // Audit Logs
  getAuditLogs: (params) => apiClient.get('/admin/audit', { params })
};
