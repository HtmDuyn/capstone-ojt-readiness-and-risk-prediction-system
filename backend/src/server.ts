import "./config/env";
import { startAdvisoryWorker } from './modules/student-portal/advisory.service';
import { startRecruitmentWorker } from './jobs/recruitment';
import { startEligibilityWorker } from './jobs/eligibility';
import { startProvisioningJobs } from './jobs/provisioning';

import app from "./app";

import {
  closeDatabaseConnection,
  testDatabaseConnection,
} from "./config/database";

import {
  logger,
} from "./config/logger";

const port =
  Number(
    process.env.PORT ||
      3000,
  );

const baseUrl =
  `http://localhost:${port}`;

const startServer =
  async (): Promise<void> => {
    try {
      await testDatabaseConnection();
      const stopRecruitment = startRecruitmentWorker();
      const stopAdvisories = process.env.ADVISORY_WORKER_ENABLED !== 'false' ? startAdvisoryWorker() : () => {};
      const stopEligibility = process.env.ELIGIBILITY_WORKER_ENABLED !== 'false' ? startEligibilityWorker() : () => {};
      const stopJobs = process.env.PROVISIONING_JOBS_ENABLED !== 'false' ? startProvisioningJobs() : () => {};

      const server =
        app.listen(
          port,
          "0.0.0.0",
          () => {
            logger.info(
              "OJT Backend is running",
            );

            logger.info(
              `Base URL: ${baseUrl}`,
            );

            logger.info(
              `Login API: ${baseUrl}/api/auth/login`,
            );

            logger.info(
              `Swagger docs: ${baseUrl}/api-docs`,
            );
          },
        );

      const shutdown =
        async () => {
          stopJobs();
          stopRecruitment();
          stopAdvisories();
          stopEligibility();
          logger.info(
            "Shutting down server...",
          );

          server.close(
            async () => {
              await closeDatabaseConnection();

              process.exit(0);
            },
          );
        };

      process.on(
        "SIGTERM",
        shutdown,
      );

      process.on(
        "SIGINT",
        shutdown,
      );
    } catch (error) {
      logger.error(
        "Unable to start backend:",
        error instanceof Error
          ? error.message
          : error,
      );

      process.exit(1);
    }
  };

void startServer();
