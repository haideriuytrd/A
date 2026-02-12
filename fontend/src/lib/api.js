const defaultOrigin = 'http://127.0.0.1:8000'

function getApiOrigin() {
  try {
    if (typeof window !== 'undefined' && window.__API_ORIGIN) return window.__API_ORIGIN
  } catch (e) {}
  return process.env.REACT_APP_BACKEND_URL || defaultOrigin
}

export const API_ORIGIN = getApiOrigin()
export const API_URL = API_ORIGIN.replace(/\/$/, '') + '/api'

export default API_URL
