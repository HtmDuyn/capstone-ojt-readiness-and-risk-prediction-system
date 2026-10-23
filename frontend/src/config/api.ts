// Login and Admin must use the same backend and token issuer.
export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'https://capstone-ojt-readiness-and-risk.onrender.com/api'
).replace(/\/+$/, '');
