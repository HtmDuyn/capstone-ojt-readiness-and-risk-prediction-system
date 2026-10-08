import reportingRoutes from '../modules/academic-reporting/report.routes';
import resultRoutes from '../modules/ojt-results/result.routes';
import workflowRoutes from '../modules/academic/workflow.routes';
import ojtRegistrationRoutes from '../modules/ojt-registration/registration.routes';
import eligibilityRoutes from '../modules/eligibility/eligibility.routes';
import { Router } from "express";
import { createJsonInputRouter } from './json-input.routes';
import importRoutes from '../modules/imports/import.routes';
import academicRoutes from '../modules/academic/academic.routes';
import studentRoutes from '../modules/students/student.routes';
import curriculumRoutes from '../modules/curriculum/curriculum.routes';
import comboRoutes from '../modules/combo-registration/combo.routes';

import authRoutes from "../modules/auth/auth.routes";
import accountRoutes from "../modules/accounts/account.routes";
import roleRoutes from "../modules/system/roles/role.routes";
import healthRoutes from "../modules/system/health/health.routes";
const router = Router();
router.use(createJsonInputRouter(router));
router.use(academicRoutes);
router.use(reportingRoutes);
router.use(resultRoutes);
router.use(workflowRoutes);
router.use(studentRoutes);
router.use(curriculumRoutes);
router.use(comboRoutes);
router.use(eligibilityRoutes);
router.use(ojtRegistrationRoutes);
router.use('/imports', importRoutes);

/*
 * ==========================
 * HEALTH
 * ==========================
 */
router.use(
  "/health",
  healthRoutes,
);

/*
 * ==========================
 * AUTH
 * ==========================
 */
router.use(
  "/auth",
  authRoutes,
);

/*
 * ==========================
 * ACCOUNTS
 * ==========================
 */
router.use(
  "/accounts",
  accountRoutes,
);

/*
 * ==========================
 * ROLES
 * ==========================
 */
router.use(
  "/roles",
  roleRoutes,
);

export default router;
