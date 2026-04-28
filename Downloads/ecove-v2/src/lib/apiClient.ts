import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// Response interceptor — surface errors as toasts
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err?.response?.data?.error || 'Something went wrong.'
    if (err?.response?.status === 401) {
      // Redirect to login handled by middleware, just show message
      toast.error('Session expired. Please log in again.')
    } else if (err?.response?.status !== 404) {
      toast.error(msg)
    }
    return Promise.reject(err)
  }
)

export default api
