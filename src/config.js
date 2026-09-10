// Central configuration for API URL
// In development: defaults to http://localhost:5000 (or VITE_API_URL if provided)
// In production: defaults to "" (same host, relative path) when served by Express,
// or uses VITE_API_URL if frontend is deployed separately (e.g. on Vercel).

const isDev = import.meta.env.DEV;
const envApi = import.meta.env.VITE_API_URL;

export const API = envApi !== undefined && envApi !== ''
  ? envApi.replace(/\/$/, '')
  : (isDev ? 'http://localhost:5000' : '');

export default { API };
