// All roles share one backend/token issuer. Local development uses Vite's API proxy.
export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? '/api' : 'https://capstone-ojt-readiness-and-risk.onrender.com/api')
).replace(/\/+$/, '');

// Aliases used by the education services.
export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, "");
export const API_URL = API_BASE_URL;
