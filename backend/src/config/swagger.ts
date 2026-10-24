import { describeAcademicRest } from './swagger-academic-rest';
import { describeHandoffWorkflow } from './swagger-handoff-workflow';
import { describeAcademicContracts } from './swagger-academic-contracts';
import { describeOfficialResults } from '../modules/ojt-results/result.openapi';
import { describeListBaseFields } from './swagger-list-base-fields';
import {
  readdirSync,
} from "node:fs";

import path from "node:path";

import swaggerJSDoc from "swagger-jsdoc";
import { describeManualInputs } from './swagger-inputs';
import { addAdminOperations } from '../modules/admin/admin.openapi';
import { addPortalOperations } from '../modules/student-portal/portal.openapi';
import { mergeSharedRoleContracts } from './shared-role-contracts';
import { addEnterpriseOperations } from '../modules/qhdn/enterprise.openapi';
import { addRecruitmentOperations } from '../modules/recruitment/recruitment.openapi';
import { describeRestOperations } from './rest-operations';
import { describeStudentJsonOperations } from './student-json-contracts';
import { groupSwaggerByRole } from './swagger-role-groups';
import { describeMergedSearchResponses } from './swagger-search-contracts';
import { describeFeResponses } from './swagger-fe-contracts';
import { describeStudentWorkflow } from '../modules/students/student-workflow.openapi';
import { describeListResponses, describeAdditionalListResponses } from './swagger-list-contracts';
import { describeMergedDetailLists } from './swagger-merged-details';
import { describeImportWorkflow } from './import-workflow-contracts';

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
          "API quản lý OJT",

        version:
          "1.0.0",

        description:
          "Quản lý học vụ, tuyển dụng và thực tập OJT.",
      },

      servers: [
        {
          url:
            "http://localhost:3000",

          description:
            "Máy chủ phát triển",
        },

        {
          url:
            "https://capstone-ojt-readiness-and-risk.onrender.com",

          description:
            "Máy chủ triển khai",
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

const swaggerWithQhdn = swaggerJSDoc(options);
const qhdnOriginalPaths = structuredClone((swaggerWithQhdn as Record<string, any>).paths ?? {});
addAdminOperations(swaggerWithQhdn);
mergeSharedRoleContracts(swaggerWithQhdn, qhdnOriginalPaths);
addEnterpriseOperations(swaggerWithQhdn as Record<string, any>);
addRecruitmentOperations(swaggerWithQhdn as Record<string, any>);
describeOfficialResults(swaggerWithQhdn as Record<string, any>);
describeMergedSearchResponses(swaggerWithQhdn);
describeFeResponses(swaggerWithQhdn);
const describedSpec = describeManualInputs(addPortalOperations(swaggerWithQhdn));
describeStudentWorkflow(describedSpec);
describeListResponses(describedSpec);
describeMergedDetailLists(describedSpec);
describeImportWorkflow(describedSpec);
describeOfficialResults(describedSpec);
describeAdditionalListResponses(describedSpec);
describeListBaseFields(describedSpec);
describeHandoffWorkflow(describedSpec);
describeAcademicContracts(describedSpec);
export const swaggerSpec = describeStudentJsonOperations(describeRestOperations(describeAcademicRest(groupSwaggerByRole(describedSpec))));
