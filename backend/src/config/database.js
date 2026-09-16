const path = require("path");
const { Pool } = require("pg");

require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const isProduction = process.env.NODE_ENV === "production";

const localDatabaseUrl =
  process.env.LOCAL_DATABASE_URL ||
  (process.env.DB_USER && process.env.DB_PASSWORD
    ? `postgresql://${process.env.DB_USER}:${encodeURIComponent(
        process.env.DB_PASSWORD
      )}@${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || 5432}/${
        process.env.DB_NAME || "ojt_db"
      }`
    : "");

const databaseConfig = {
  url: isProduction
    ? process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL || localDatabaseUrl
    : process.env.LOCAL_DATABASE_URL || localDatabaseUrl,
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  name: process.env.DB_NAME || "ojt_db",
  user: process.env.DB_USER || "",
  password: process.env.DB_PASSWORD || "",
  ssl: process.env.DB_SSL === "true" || isProduction ? { rejectUnauthorized: false } : false,
};

const connectionString = databaseConfig.url;
const pool = connectionString ? new Pool({
  connectionString,
  ssl: databaseConfig.ssl === true || (databaseConfig.ssl && databaseConfig.ssl.rejectUnauthorized === false)
    ? { rejectUnauthorized: false }
    : false
}) : null;

const query = async (text, params) => {
  if (!pool) {
    throw new Error("Database is not configured. Set LOCAL_DATABASE_URL or DATABASE_URL.");
  }

  return pool.query(text, params);
};

module.exports = {
  ...databaseConfig,
  pool,
  query
};
