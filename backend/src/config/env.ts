import path from "node:path";
import { existsSync } from "node:fs";
import dotenv from "dotenv";

const backendEnv = path.resolve(__dirname, "../../.env");
dotenv.config({
  path: existsSync(backendEnv) ? backendEnv : path.resolve(__dirname, "../../src/.env"),
});
