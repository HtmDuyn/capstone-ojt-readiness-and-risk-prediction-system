require("dotenv").config();

const app = require("./app");
const { connectDatabase } = require("./config/database");

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await connectDatabase();

        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:");
        console.error(error);
        process.exit(1);
    }
}

startServer();