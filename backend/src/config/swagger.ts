import {
  readdirSync,
} from "node:fs";

import path from "node:path";

import swaggerJSDoc from "swagger-jsdoc";

const modulesDirectory =
  path.resolve(
    __dirname,
    "../modules",
  );

const collectApiFiles = (
  directory: string,
): string[] =>
  readdirSync(
    directory,
    {
      withFileTypes: true,
    },
  ).flatMap(
    (entry) => {
      const entryPath =
        path.join(
          directory,
          entry.name,
        );

      if (
        entry.isDirectory()
      ) {
        return collectApiFiles(
          entryPath,
        );
      }

      return /\.(ts|js|openapi\.yaml)$/.test(
        entry.name,
      )
        ? [entryPath]
        : [];
    },
  );

const options: swaggerJSDoc.Options =
  {
    definition: {
      openapi:
        "3.0.0",

      info: {
        title:
          "OJT Management API",

        version:
          "1.0.0",

        description:
          "API for OJT Management and AI Risk Prediction System",
      },

      servers: [
        {
          url:
            "http://localhost:3000",

          description:
            "Local Development",
        },

        {
          url:
            "https://capstone-ojt-readiness-and-risk.onrender.com",

          description:
            "Production Server",
        },
      ],

      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",

            scheme:
              "bearer",

            bearerFormat:
              "JWT",
          },
        },
      },
    },

    apis:
      collectApiFiles(
        modulesDirectory,
      ),
  };

export const swaggerSpec =
  swaggerJSDoc(options);