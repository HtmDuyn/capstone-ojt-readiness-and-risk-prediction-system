import {
  existsSync,
} from "node:fs";

import path from "node:path";

import express from "express";

import swaggerUi from "swagger-ui-express";

import {
  corsMiddleware,
} from "./config/cors";

import {
  swaggerSpec,
} from "./config/swagger";

import {
  errorHandler,
} from "./middleware/error-handler";

import routes from "./routes";

const app = express();

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

        health:
          "/api/health",

        docs:
          "/api-docs",
      });
  },
);

app.use(
  "/api",
  routes,
);

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(
    swaggerSpec,
    {
      customSiteTitle:
        "OJT Management API",

      customCssUrl:
        "/swagger-static/swagger-custom.css",

      swaggerOptions: {
        docExpansion:
          "list",

        defaultModelsExpandDepth:
          -1,

        defaultModelExpandDepth:
          -1,

        tryItOutEnabled:
          true,

        displayRequestDuration:
          true,

        filter:
          true,
      },
    },
  ),
);

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