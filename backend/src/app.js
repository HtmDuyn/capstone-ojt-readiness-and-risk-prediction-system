const express = require("express");
const path = require("path");
const swaggerUi = require("swagger-ui-express");

const swaggerSpec = require("./config/swagger");
const routes = require("./routes");

const app = express();


// ============================================================
// Middleware
// ============================================================

app.use(express.json());


// ============================================================
// Static files
// Used for Swagger custom CSS
// ============================================================

app.use(
    "/swagger-static",
    express.static(
        path.join(__dirname, "public")
    )
);


// ============================================================
// Root endpoint
// ============================================================

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "OJT Backend is running",
        health: "/api/health",
        docs: "/api-docs"
    });
});


// ============================================================
// API Routes
// ============================================================

app.use("/api", routes);


// ============================================================
// Swagger UI
// ============================================================

app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {

        // Browser tab title
        customSiteTitle: "OJT Management API",

        // Custom CSS
        customCssUrl: "/swagger-static/swagger-custom.css",

        // Custom JavaScript for automatic JWT authorization
        customJs: "/swagger-static/swagger-custom.js",

        // Swagger UI settings
        swaggerOptions: {

            // Keep tags collapsed initially
            docExpansion: "list",

            // Hide Schemas section
            defaultModelsExpandDepth: -1,

            // Hide model details
            defaultModelExpandDepth: -1,

            // Enable Try it out
            tryItOutEnabled: true,

            // Do not show request duration
            displayRequestDuration: false,

            // Disable endpoint filtering
            filter: false,

            // Disable Swagger Explorer
            showExtensions: false,
            showCommonExtensions: false
        }
    })
);


module.exports = app;

