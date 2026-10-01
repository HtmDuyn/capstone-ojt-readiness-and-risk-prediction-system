import { query } from "../../config/database";

export const getHealthStatus =
  async () => {
    await query(
      "SELECT 1 AS health",
    );

    return {
      status: "ok",
      service:
        "backend",
      database:
        "connected",
    };
  };