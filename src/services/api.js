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
  toggleDistributionPaid: (id) => request(`/distributions/${id}/toggle-paid`, {
    method: 'PATCH'
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
  })
};
