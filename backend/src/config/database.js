const path = require("path");
const sql = require("mssql");

require("dotenv").config({
    path: path.resolve(__dirname, "../../.env"),
});

const databaseConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 1433),
    database: process.env.DB_NAME || "ojt_rpa_db",

    options: {
        encrypt: process.env.DB_ENCRYPT === "true",
        trustServerCertificate:
            process.env.DB_TRUST_SERVER_CERTIFICATE !== "false",
    },

    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
    },
};

let pool = null;

async function connectDatabase() {
    if (pool && pool.connected) {
        return pool;
    }

    pool = await new sql.ConnectionPool(databaseConfig).connect();

    console.log(
        `Database connected: ${databaseConfig.database} @ ${databaseConfig.server}:${databaseConfig.port}`
    );

    return pool;
}

function getPool() {
    if (!pool || !pool.connected) {
        throw new Error("Database is not connected");
    }

    return pool;
}

module.exports = {
    sql,
    databaseConfig,
    connectDatabase,
    getPool,
};