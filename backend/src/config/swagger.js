const swaggerJSDoc = require("swagger-jsdoc");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "OJT Management API",
            version: "1.0.0",
            description: "API for OJT Management and AI Risk Prediction System"
        },
        servers: [
            {
                url: "https://capstone-ojt-readiness-and-risk.onrender.com",
                description: "Production Server"
            },
            {
                url: "http://localhost:3000",
                description: "Local Development"
            }
        ]
    },
    apis: [
        "./src/routes/*.js"
    ]
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
