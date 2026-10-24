const configured = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "https://capstone-ojt-readiness-and-risk.onrender.com"
).replace(/\/+$/, "");
export const API_ORIGIN = configured.replace(/\/api$/, "");
export const API_URL = API_ORIGIN + "/api";
