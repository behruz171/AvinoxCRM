import axios from 'axios'

const BASE_URL = 'http://ordercrm.pythonanywhere.com/api'

const api = axios.create({
  baseURL: BASE_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const res = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh })
          localStorage.setItem('access_token', res.data.access)
          originalRequest.headers.Authorization = `Bearer ${res.data.access}`
          return api(originalRequest)
        } catch {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api

// Auth
export const authApi = {
  register: (data: object) => api.post('/auth/register/', data),
  login: (data: object) => api.post('/auth/login/', data),
  me: () => api.get('/auth/me/'),
  logout: (refresh: string) => api.post('/auth/logout/', { refresh }),
}

// Categories
export const categoriesApi = {
  list: () => api.get('/products/categories/'),
  create: (data: object) => api.post('/products/categories/', data),
}

// Products
export const productsApi = {
  list: (params?: object) => api.get('/products/', { params }),
  create: (data: FormData) => api.post('/products/', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: number, data: FormData) => api.patch(`/products/${id}/`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: number) => api.delete(`/products/${id}/`),
  get: (id: number) => api.get(`/products/${id}/`),
}

const publicApi = axios.create({ baseURL: BASE_URL })

// Orders
export const ordersApi = {
  list: () => api.get('/orders/'),
  create: (data: object) => api.post('/orders/', data),
  update: (id: number, data: object) => api.put(`/orders/${id}/`, data),
  delete: (id: number) => api.delete(`/orders/${id}/`),
  get: (id: number) => api.get(`/orders/${id}/`),
  getPublic: (id: number) => publicApi.get(`/orders/${id}/view/`),
  exportExcel: (id: number, onProgress?: (pct: number) => void) =>
    api.get(`/orders/${id}/export/excel/`, {
      responseType: 'blob',
      onDownloadProgress: onProgress ? (e: any) => {
        if (e.total) onProgress(Math.round((e.loaded / e.total) * 100))
      } : undefined,
    }),
  exportPdf: (id: number, onProgress?: (pct: number) => void) =>
    api.get(`/orders/${id}/export/pdf/`, {
      responseType: 'blob',
      onDownloadProgress: onProgress ? (e: any) => {
        if (e.total) onProgress(Math.round((e.loaded / e.total) * 100))
      } : undefined,
    }),
}
