import {
  readdirSync,
} from "node:fs";

import path from "node:path";

import swaggerJSDoc from "swagger-jsdoc";
import { describeManualInputs } from './swagger-inputs';
import { buildJsonInputOperations, documentJsonInputOperations } from './json-input-operations';

const modulesDirectory =
  path.resolve(
    __dirname,
    "../modules",
  );

const collectApiFiles = (
  directory: string,
): string[] => {
  return readdirSync(
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
};

const options: swaggerJSDoc.Options =
  {
    definition: {
      openapi: "3.0.0",

      info: {
        title:
          "OJT Management API",

        version:
          "1.0.0",

        description:
          "API for OJT Management and Academic Eligibility",
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
            type:
              "http",

            scheme:
              "bearer",

            bearerFormat:
              "JWT",

            description:
              "Enter JWT token only.",
          },
        },

        schemas: {
          /*
           * =========================
           * ERROR
           * =========================
           */
          ErrorResponse: {
            type:
              "object",

            properties: {
              success: {
                type:
                  "boolean",

                example:
                  false,
              },

              errorCode: {
                type:
                  "string",

                example:
                  "INVALID_CREDENTIALS",
              },

              message: {
                type:
                  "string",

                example:
                  "Invalid email or password.",
              },
            },
          },

          /*
           * =========================
           * LOGIN
           * =========================
           */
          LoginRequest: {
            type:
              "object",

            required: [
              "email",
              "password",
            ],

            properties: {
              email: {
                type:
                  "string",

                format:
                  "email",

                example:
                  "admin@ojtrpa.edu.vn",
              },

              password: {
                type:
                  "string",

                format:
                  "password",

                example:
                  "Password@123",
              },
            },
          },

          LoginResponse: {
            type:
              "object",

            properties: {
              success: {
                type:
                  "boolean",

                example:
                  true,
              },

              message: {
                type:
                  "string",

                example:
                  "Login successful",
              },

              token: {
                type:
                  "string",

                example:
                  "eyJhbGciOiJIUzI1NiIs...",
              },
              mustChangePassword: {
                type: "boolean",
                description: "Change the temporary password before using protected business APIs.",
                example: false,
              },
            },
          },

          /*
           * =========================
           * USER
           * =========================
           */
          UserResponse: {
            type:
              "object",

            properties: {
              mustChangePassword: { type: "boolean", example: false },
              id: {
                type:
                  "integer",

                example:
                  1,
              },

              username: {
                type:
                  "string",

                example:
                  "admin01",
              },

              email: {
                type:
                  "string",

                format:
                  "email",

                example:
                  "admin@ojtrpa.edu.vn",
              },

              fullName: {
                type:
                  "string",

                example:
                  "System Administrator",
              },

              status: {
                type:
                  "string",

                example:
                  "ACTIVE",
              },

              roleCode: {
                type:
                  "string",

                nullable:
                  true,

                example:
                  "ADMIN",
              },

              roleName: {
                type:
                  "string",

                nullable:
                  true,

                example:
                  "System Administrator",
              },
            },
          },

          CurrentUserResponse: {
            type:
              "object",

            properties: {
              success: {
                type:
                  "boolean",

                example:
                  true,
              },

              message: {
                type:
                  "string",

                example:
                  "User profile retrieved successfully",
              },

              user: {
                $ref:
                  "#/components/schemas/UserResponse",
              },
            },
          },

          /*
           * =========================
           * LOGOUT
           * =========================
           */
          LogoutResponse: {
            type:
              "object",

            properties: {
              success: {
                type:
                  "boolean",

                example:
                  true,
              },

              message: {
                type:
                  "string",

                example:
                  "Logout successful",
              },
            },
          },
        },
      },
    },

    apis:
      collectApiFiles(
        modulesDirectory,
      ),
  };

const originalSpec = describeManualInputs(swaggerJSDoc(options));
export const jsonInputOperations = buildJsonInputOperations(originalSpec);
export const swaggerSpec = documentJsonInputOperations(originalSpec, jsonInputOperations);
