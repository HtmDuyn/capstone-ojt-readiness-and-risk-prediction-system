const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");

const swaggerSpec = require("./config/swagger");
const routes = require("./routes");
const errorMiddleware = require("./middlewares/error.middleware");

const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN || "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.use(express.json());

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "OJT Backend is running",
        health: "/api/health",
        docs: "/api-docs"
    });
});

app.use("/api", routes);

app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
);

app.use(errorMiddleware);

module.exports = app;