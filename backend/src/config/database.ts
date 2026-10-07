import path from "node:path";
import {
  Pool,
  type QueryResult,
  type QueryResultRow,
} from "pg";

import type { DatabaseConfig } from "../database/database.types";
import { logger } from "./logger";

const dbUser = process.env.DB_USER
  ? encodeURIComponent(process.env.DB_USER)
  : "";

const dbPassword = process.env.DB_PASSWORD
  ? encodeURIComponent(process.env.DB_PASSWORD)
  : "";

const preferredDatabaseUrl =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DATABASE_URL ||
  process.env.LOCAL_DATABASE_URL ||
  (dbUser && dbPassword
    ? `postgresql://${dbUser}:${dbPassword}@${
        process.env.DB_HOST || "localhost"
      }:${process.env.DB_PORT || 5432}/${
        process.env.DB_NAME || "ojt_db"
      }`
    : "");

export const databaseConfig: DatabaseConfig = {
  url: preferredDatabaseUrl,

  host: process.env.DB_HOST || "localhost",

  port: Number(process.env.DB_PORT || 5432),

  name: process.env.DB_NAME || "ojt_db",

  user: process.env.DB_USER || "",

  password: process.env.DB_PASSWORD || "",

  ssl:
    process.env.DB_SSL === "true" ||
    Boolean(
      process.env.DATABASE_URL ||
        process.env.SUPABASE_DATABASE_URL,
    )
      ? {
          rejectUnauthorized: false,
        }
      : false,
};

export const pool = databaseConfig.url
  ? new Pool({
      connectionString: databaseConfig.url,
      ssl: databaseConfig.ssl,

      max: 10,

      idleTimeoutMillis: 30_000,

      connectionTimeoutMillis: 10_000,
    })
  : null;

export const query = async <
  Row extends QueryResultRow = QueryResultRow,
>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<Row>> => {
  if (!pool) {
    throw new Error(
      "Database is not configured. Please check database environment variables.",
    );
  }

  return pool.query<Row>(text, params);
};

export const testDatabaseConnection =
  async (): Promise<void> => {
    if (!pool) {
      throw new Error(
        "Database is not configured.",
      );
    }

    const client = await pool.connect();

    try {
      await client.query("SELECT NOW()");

      logger.info(
        "PostgreSQL database connected successfully",
      );
    } finally {
      client.release();
    }
  };

export const closeDatabaseConnection =
  async (): Promise<void> => {
    if (!pool) {
      return;
    }

    await pool.end();

    logger.info(
      "PostgreSQL database connection closed",
    );
  };

export const databasePath = path.resolve(
  __dirname,
  "../../",
);