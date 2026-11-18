import cors from "cors";

const productionOrigin = "https://capstone-ojt-readiness-and-risk-pre.vercel.app";

export function createCorsMiddleware(configuredOrigins = process.env.CORS_ORIGIN) {
  // CORS_ORIGIN adds local/custom origins; a copied localhost-only .env must
  // not prevent the deployed frontend from reaching the API.
  const allowedOrigins = [
    productionOrigin,
    ...(configuredOrigins || "http://localhost:5173")
      .split(",")
      .map((origin) => origin.trim().replace(/\/+$/, ""))
      .filter(Boolean),
  ];

  return cors({
    origin: [...new Set(allowedOrigins)],
    credentials: true,
  });
}

export const corsMiddleware = createCorsMiddleware();
