require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT || 3000;
const baseUrl = `http://localhost:${PORT}`;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`========================================`);
    console.log(`OJT Backend is running`);
    console.log(`Base URL: ${baseUrl}`);
    console.log(`Health check: ${baseUrl}/api/health`);
    console.log(`Login API: ${baseUrl}/api/auth/login`);
    console.log(`Swagger docs: ${baseUrl}/api-docs`);
    console.log(`========================================`);
});
