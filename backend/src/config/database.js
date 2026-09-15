require("dotenv").config();

const databaseConfig = {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    name: process.env.DB_NAME || "ojt_db",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || ""
};

module.exports = databaseConfig;
