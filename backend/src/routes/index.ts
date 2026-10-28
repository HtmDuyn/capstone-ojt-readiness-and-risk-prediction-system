import qhdnRoutes from '../modules/qhdn/qhdn.routes';
import recruitmentRoutes from '../modules/recruitment/recruitment.routes';
import enterpriseRoutes from '../modules/qhdn/enterprise.routes';
import adminRoutes from '../modules/admin/admin.routes';
import resultRoutes from '../modules/ojt-results/result.routes';
import workflowRoutes from '../modules/academic/workflow.routes';
import ojtRegistrationRoutes from '../modules/ojt-registration/registration.routes';
import eligibilityRoutes from '../modules/eligibility/eligibility.routes';
import { Router } from "express";
import { academicJsonRequests } from '../shared/academic-api-contract';
import importRoutes from '../modules/imports/import.routes';
import academicRoutes from '../modules/academic/academic.routes';
import academicRestRoutes from '../modules/academic/rest.routes';
import studentRoutes from '../modules/students/student.routes';
import curriculumRoutes from '../modules/curriculum/curriculum.routes';
import comboRoutes from '../modules/combo-registration/combo.routes';

import authRoutes from "../modules/auth/auth.routes";
import accountRoutes from "../modules/accounts/account.routes";
import portalRoutes from '../modules/student-portal/portal.routes';
import { requireNoBody } from '../middleware/json-body';
const router = Router();
router.use((req, res, next) => req.method === 'GET' ? requireNoBody(req, res, next) : next());
router.use(portalRoutes);
router.use(academicJsonRequests);
router.use(academicRestRoutes);
router.use(adminRoutes);
router.use(academicRoutes);
router.use(qhdnRoutes);
router.use('/recruitment', recruitmentRoutes);
router.use('/enterprise', enterpriseRoutes);
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

export default router;
