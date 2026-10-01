import cors from "cors";

const allowedOrigins = process.env.CORS_ORIGIN
  ?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const corsMiddleware = cors({
  origin: allowedOrigins?.length ? allowedOrigins : true,
  credentials: true,
});