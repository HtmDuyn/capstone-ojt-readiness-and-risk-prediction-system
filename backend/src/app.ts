import 'dotenv/config';

import {
  existsSync,
} from "node:fs";

import path from "node:path";

import express from "express";

import {
  corsMiddleware,
} from "./config/cors";

import { pool } from "./config/database";
import { logger } from "./config/logger";

import {
  errorHandler,
} from "./middleware/error-handler";

import routes from "./routes";
import { apiNoCache } from './middleware/api-no-cache';

const app = express();
app.disable('etag');
app.use('/api',apiNoCache);

const slowRequestMs = Number(process.env.HTTP_SLOW_REQUEST_MS ?? 1000);
if (Number.isFinite(slowRequestMs) && slowRequestMs > 0) {
  app.use('/api', (req, res, next) => {
    const startedAt = performance.now();
    res.once('finish', () => {
      const durationMs = Math.round(performance.now() - startedAt);
      if (durationMs < slowRequestMs) return;

      logger.warn('Slow API request', {
        method: req.method,
        route: req.route?.path,
        status: res.statusCode,
        durationMs,
        dbPool: pool && {
          total: pool.totalCount,
          idle: pool.idleCount,
          waiting: pool.waitingCount,
        },
      });
    });
    next();
  });
}

const publicDirectory =
  path.join(
    __dirname,
    "public",
  );

const staticDirectory =
  existsSync(
    publicDirectory,
  )
    ? publicDirectory
    : path.resolve(
        __dirname,
        "../src/public",
      );

app.disable(
  "x-powered-by",
);

app.use(
  corsMiddleware,
);

app.use(
  express.json({
    limit: "1mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
  }),
);

app.use(
  "/swagger-static",
  express.static(
    staticDirectory,
  ),
);

app.get(
  "/",
  (_req, res) => {
    res
      .status(200)
      .json({
        success: true,

        message:
          "OJT Backend is running",

        docs:
          "/api-docs",
      });
  },
);

app.use(
  "/api",
  routes,
);

app.get('/api-docs/openapi.json', async (_req, res) => {
  const { swaggerSpec } = await import('./config/swagger.js');
  res.json(swaggerSpec);
});

let swaggerRouter: express.Router | undefined;
app.use('/api-docs', async (req, res, next) => {
  if (!swaggerRouter) {
    const [{ default: swaggerUi }, { swaggerSpec }] = await Promise.all([
      import('swagger-ui-express'),
      import('./config/swagger.js'),
    ]);
    swaggerRouter ??= express.Router().use(swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'OJT Management API',
      customCssUrl: '/swagger-static/swagger-custom.css',
      swaggerOptions: {
        docExpansion: 'list',
        defaultModelsExpandDepth: -1,
        defaultModelExpandDepth: 2,
        tryItOutEnabled: true,
        displayRequestDuration: true,
        filter: true,
      },
    }));
  }
  swaggerRouter(req, res, next);
});

/*
 * Route không tồn tại
 */
app.use(
  (_req, res) => {
    res
      .status(404)
      .json({
        success: false,

        errorCode:
          "ROUTE_NOT_FOUND",

        message:
          "API route not found.",
      });
  },
);

/*
 * Global error handler phải đặt cuối cùng.
 */
app.use(
  errorHandler,
);

export default app;
