import path from "node:path";
import dotenv from "dotenv";

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

// Existing development checkouts keep their environment in src/.env.
// Deployment variables and backend/.env always take precedence.
dotenv.config({
  path: path.resolve(__dirname, "../../src/.env"),
});
