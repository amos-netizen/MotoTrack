import { getToken } from './auth'
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  try {
    // Create abort controller for timeout if not provided
    let signal = options?.signal
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    if (!signal) {
      const controller = new AbortController()
      timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      signal = controller.signal
    }
    
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...options,
      signal,
    });
    
    if (timeoutId) clearTimeout(timeoutId)
    
    if (!res.ok) {
      let errorMessage = `${res.status} ${res.statusText}`
      try {
        const errorData = await res.json()
        errorMessage = errorData.detail || errorData.message || errorMessage
      } catch {
        const text = await res.text()
        if (text) errorMessage = text
      }
      throw new Error(errorMessage)
    }
    
    return res.json();
  } catch (error: any) {
    // Handle network errors
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      throw new Error('Request timed out. Please check your connection.')
    }
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('Cannot connect to server. Please ensure the backend is running on http://localhost:8000')
    }
    throw error
  }
}

export const api = {
  health: () => request<{ status: string }>(`/healthz`),
  // Auth
  signup: (payload: { email: string; password: string; role?: string; garage_id?: number|null }) => request(`/auth/signup`, { method: 'POST', body: JSON.stringify(payload) }),
  createStaffProfile: (payload: { email: string; password: string; role: string; garage_id: number; full_name?: string; phone?: string }) => request(`/auth/create-staff-profile`, { method: 'POST', body: JSON.stringify(payload) }),
  login: async (email: string, password: string) => {
    try {
      const body = new URLSearchParams({ username: email, password, grant_type: 'password' })
      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const res = await fetch(`${API_BASE}/auth/token`, { 
        method: 'POST', 
        body, 
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!res.ok) {
        let errorMessage = 'Login failed'
        try {
          const errorData = await res.json()
          errorMessage = errorData.detail || errorData.message || errorMessage
        } catch {
          const errorText = await res.text()
          errorMessage = errorText || errorMessage
        }
        
        if (res.status === 401 || res.status === 400) {
          throw new Error('Incorrect email or password')
        }
        throw new Error(errorMessage)
      }
      
      const data = await res.json()
      if (!data.access_token) {
        throw new Error('Invalid response from server')
      }
      return data as { access_token: string, token_type: string }
    } catch (error: any) {
      // Handle network errors
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        throw new Error('Request timed out. Please check your connection and try again.')
      }
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Cannot connect to server. Please ensure the backend is running on http://localhost:8000')
      }
      // Re-throw other errors
      throw error
    }
  },
  me: () => request(`/auth/me`),
  // Orders
  listOrders: () => request(`/orders/`),
  createOrder: (vehicle_vin: string) => request(`/orders/`, {
    method: 'POST',
    body: JSON.stringify({ vehicle_vin }),
  }),
  setOrderStatus: (
    orderId: number,
    payload: { status: string; work_done?: string; final_cost?: number; mechanic_notes?: string }
  ) => request(`/orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify(payload) }),
  // Appointments
  listAppointments: () => request(`/appointments/`),
  createAppointment: (payload: { vehicle_vin: string; service_type: string; scheduled_at: string; notes?: string }) =>
    request(`/appointments/`, { method: 'POST', body: JSON.stringify(payload) }),
  updateAppointment: (
    id: number,
    payload: Partial<{ service_type: string; scheduled_at: string; notes: string; status: string }>
  ) => request(`/appointments/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  recommendation: (vin: string) => request(`/appointments/next-service/recommendation/${vin}`),
  // Garages
  listGarages: () => request(`/garages/`),
  // Jobs
  createJob: (payload: any) => request(`/jobs/`, { method: 'POST', body: JSON.stringify(payload) }),
  listJobs: (params?: { status?: string; operations_stream?: string }) => {
    const query = new URLSearchParams()
    if (params?.status) query.append('status_filter', params.status)
    if (params?.operations_stream) query.append('operations_stream', params.operations_stream)
    return request(`/jobs/?${query.toString()}`)
  },
  getJob: (id: number) => request(`/jobs/${id}`),
  assignJob: (id: number, technician_id: number) => request(`/jobs/${id}/assign`, { method: 'POST', body: JSON.stringify({ technician_id }) }),
  updateJob: (id: number, payload: any) => request(`/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  completeJob: (id: number) => request(`/jobs/${id}/complete`, { method: 'POST' }),
  managerReview: (id: number, notes?: string) => request(`/jobs/${id}/manager-review?${notes ? `notes=${encodeURIComponent(notes)}` : ''}`, { method: 'POST' }),
  moveToBilling: (id: number) => request(`/jobs/${id}/move-to-billing`, { method: 'POST' }),
  // Spare Parts
  createSparePartRequest: (job_id: number, payload: any) => request(`/spare-parts/jobs/${job_id}/request`, { method: 'POST', body: JSON.stringify(payload) }),
  listJobRequests: (job_id: number) => request(`/spare-parts/jobs/${job_id}`),
  approveRequest: (id: number) => request(`/spare-parts/requests/${id}/approve`, { method: 'POST' }),
  rejectRequest: (id: number, notes?: string) => request(`/spare-parts/requests/${id}/reject?${notes ? `notes=${encodeURIComponent(notes)}` : ''}`, { method: 'POST' }),
  issueParts: (id: number) => request(`/spare-parts/requests/${id}/issue`, { method: 'POST' }),
  completeRequest: (id: number) => request(`/spare-parts/requests/${id}/complete`, { method: 'POST' }),
  listPendingRequests: () => request(`/spare-parts/pending`),
  // Warehouse
  createWarehouseItem: (payload: any) => request(`/warehouse/items`, { method: 'POST', body: JSON.stringify(payload) }),
  listWarehouseItems: (active_only: boolean = true) => request(`/warehouse/items?active_only=${active_only}`),
  getWarehouseItem: (id: number) => request(`/warehouse/items/${id}`),
  updateWarehouseItem: (id: number, payload: any) => request(`/warehouse/items/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  listLowStockItems: () => request(`/warehouse/items/low-stock`),
  // Billing
  createInvoice: (job_id: number, payload: any) => request(`/billing/jobs/${job_id}/invoice`, { method: 'POST', body: JSON.stringify(payload) }),
  createAutoInvoice: (job_id: number, tax_rate: number = 0) => request(`/billing/jobs/${job_id}/auto-invoice?tax_rate=${tax_rate}`, { method: 'POST' }),
  listInvoices: () => request(`/billing/invoices`),
  getInvoice: (id: number) => request(`/billing/invoices/${id}`),
  markInvoicePaid: (id: number) => request(`/billing/invoices/${id}/mark-paid`, { method: 'POST' }),
  // Task Actions
  createTaskAction: (payload: any) => request(`/task-actions/`, { method: 'POST', body: JSON.stringify(payload) }),
  listTaskActions: (params?: { operations_stream?: string; active_only?: boolean }) => {
    const query = new URLSearchParams()
    if (params?.operations_stream) query.append('operations_stream', params.operations_stream)
    if (params?.active_only !== undefined) query.append('active_only', params.active_only.toString())
    return request(`/task-actions/?${query.toString()}`)
  },
  getTaskAction: (id: number) => request(`/task-actions/${id}`),
  updateTaskAction: (id: number, payload: any) => request(`/task-actions/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  addTaskToJob: (job_id: number, payload: any) => request(`/task-actions/jobs/${job_id}/add-task`, { method: 'POST', body: JSON.stringify(payload) }),
  listJobTasks: (job_id: number) => request(`/task-actions/jobs/${job_id}/tasks`),
  completeJobTask: (job_id: number, task_id: number) => request(`/task-actions/jobs/${job_id}/tasks/${task_id}/complete`, { method: 'PATCH' }),
  // Users (for technician list)
  listUsers: (role?: string) => request(`/auth/users${role ? `?role=${role}` : ''}`),
};


