const path = require("path");
const { Pool } = require("pg");

require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

console.log("========== DATABASE CONFIG ==========");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_PORT:", process.env.DB_PORT);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_SSL:", process.env.DB_SSL);
console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
console.log("SUPABASE_DATABASE_URL exists:", !!process.env.SUPABASE_DATABASE_URL);
console.log("LOCAL_DATABASE_URL exists:", !!process.env.LOCAL_DATABASE_URL);
console.log("====================================");

const preferredDatabaseUrl =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DATABASE_URL ||
  process.env.LOCAL_DATABASE_URL ||
  (process.env.DB_USER && process.env.DB_PASSWORD
    ? `postgresql://${process.env.DB_USER}:${encodeURIComponent(
        process.env.DB_PASSWORD
      )}@${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || 5432}/${
        process.env.DB_NAME || "ojt_db"
      }`
    : "");

const databaseConfig = {
  url: preferredDatabaseUrl,
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  name: process.env.DB_NAME || "ojt_db",
  user: process.env.DB_USER || "",
  password: process.env.DB_PASSWORD || "",
  ssl: process.env.DB_SSL === "true" || Boolean(process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL)
    ? { rejectUnauthorized: false }
    : false,
};

const connectionString = databaseConfig.url;
const pool = connectionString ? new Pool({
  connectionString,
  ssl: databaseConfig.ssl === true || (databaseConfig.ssl && databaseConfig.ssl.rejectUnauthorized === false)
    ? { rejectUnauthorized: false }
    : false
}) : null;

if (pool) {
  pool
    .query("SELECT NOW()")
    .then(() => console.log("✅ Supabase PostgreSQL connected"))
    .catch((err) => console.error("❌ Database connection failed:", err.message));
}

const query = async (text, params) => {
    console.log("🔥 DATABASE QUERY CALLED");
    console.log("🔥 DB HOST:", process.env.DB_HOST);
    console.log("🔥 SQL:", text.substring(0, 150));

    if (!pool) {
        throw new Error(
            "Database is not configured. Set DB_HOST/DB_USER/DB_PASSWORD or DATABASE_URL."
        );
    }

    try {
        const result = await pool.query(text, params);

        console.log("🔥 QUERY SUCCESS");
        console.log("🔥 ROW COUNT:", result.rows.length);

        return result;
    } catch (error) {
        console.error("🔥 QUERY ERROR:", error.message);
        throw error;
    }
};

module.exports = {
  ...databaseConfig,
  pool,
  query
};
