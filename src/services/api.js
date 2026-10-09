// Frontend API Client for Zakat System Backend
const BASE_URL = '/api';

async function request(endpoint, options = {}) {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || `HTTP ${res.status}`);
    }
    return json;
  } catch (err) {
    console.warn(`[API] Call to ${endpoint} failed:`, err.message);
    throw err;
  }
}

export const api = {
  // System Initial State Bootstrapper
  getInitialState: () => request('/system/initial-state'),
  resetSystem: () => request('/system/reset', { method: 'POST' }),
  setCustomBudget: (customBudget) => request('/system/custom-budget', {
    method: 'POST',
    body: JSON.stringify({ customBudget })
  }),

  // Distributions
  getDistributions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/distributions${query ? `?${query}` : ''}`);
  },
  createDistribution: (data) => request('/distributions', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateDistribution: (id, data) => request(`/distributions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  toggleDistributionPaid: (id, { userName, userRole } = {}) => request(`/distributions/${id}/toggle-paid`, {
    method: 'PATCH',
    body: JSON.stringify({ userName, userRole })
  }),
  approveDistribution: (id, { userName, userRole } = {}) => request(`/distributions/${id}/approve`, {
    method: 'PATCH',
    body: JSON.stringify({ userName, userRole })
  }),
  rejectDistribution: (id, { userName, userRole, reason } = {}) => request(`/distributions/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ userName, userRole, reason })
  }),
  deleteDistribution: (id) => request(`/distributions/${id}`, {
    method: 'DELETE'
  }),

  // Beneficiaries
  getBeneficiaries: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/beneficiaries${query ? `?${query}` : ''}`);
  },
  createBeneficiary: (data) => request('/beneficiaries', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateBeneficiary: (id, data) => request(`/beneficiaries/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteBeneficiary: (id) => request(`/beneficiaries/${id}`, {
    method: 'DELETE'
  }),

  // Categories
  getCategories: () => request('/categories'),
  createCategory: (data) => request('/categories', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateCategory: (id, data) => request(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  // Assessment Years
  getYears: () => request('/years'),
  createYear: (data) => request('/years', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  deleteYear: (year, userName = 'Admin') => request(`/years/${year}`, {
    method: 'DELETE',
    body: JSON.stringify({ userName })
  }),

  // Masters
  getMasters: () => request('/masters/all'),
  updateAsset: (id, data) => request(`/masters/assets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  // Audit Logs & Version History
  getAuditLogs: (recordId = null) => {
    return request(recordId ? `/audit-logs/${recordId}` : '/audit-logs');
  },

  // Recycle Bin
  getRecycleBin: () => request('/recycle-bin'),
  restoreRecycleBin: (id, userName = 'Admin') => request(`/recycle-bin/${id}/restore`, {
    method: 'POST',
    body: JSON.stringify({ userName })
  }),
  deleteRecycleBinItem: (id) => request(`/recycle-bin/${id}`, {
    method: 'DELETE'
  }),
  emptyRecycleBin: () => request('/recycle-bin', {
    method: 'DELETE'
  }),

  // User Management (Admin)
  getUsers: () => request('/users'),
  createUser: (data) => request('/users', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateUser: (id, data) => request(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteUser: (id, adminName = 'Admin') => request(`/users/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ adminName })
  }),
  resetUser2FA: (id, adminName = 'Admin') => request(`/users/${id}/reset-2fa`, {
    method: 'POST',
    body: JSON.stringify({ adminName })
  }),

  // Authentication & 2-Step Verification (2FA / TOTP)
  login: (data) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  changePassword: (data) => request('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  disable2FA: (data) => request('/auth/disable-2fa', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  setup2FA: (userId) => request('/auth/setup-2fa', {
    method: 'POST',
    body: JSON.stringify({ userId })
  }),
  verify2FA: (data) => request('/auth/verify-2fa', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  validateLogin2FA: (data) => request('/auth/validate-login-2fa', {
    method: 'POST',
    body: JSON.stringify(data)
  })
};
