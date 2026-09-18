const path = require("path");
const { Pool } = require("pg");

require("dotenv").config({
    path: path.resolve(__dirname, "../../.env")
});

const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === "true"
        ? { rejectUnauthorized: false }
        : false
});

pool.query("SELECT NOW()")
    .then(() => {
        console.log("✅ Supabase PostgreSQL connected");
    })
    .catch((err) => {
        console.error("❌ Database connection failed:");
        console.error(err.message);
    });

const query = async (text, params) => {
    return pool.query(text, params);
};

module.exports = {
    pool,
    query
};