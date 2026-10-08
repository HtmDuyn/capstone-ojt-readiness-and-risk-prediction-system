import eligibilityRoutes from '../modules/eligibility/eligibility.routes';
import { Router } from "express";
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
router.use(academicRoutes);
router.use(studentRoutes);
router.use(curriculumRoutes);
router.use(comboRoutes);
router.use(eligibilityRoutes);
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
