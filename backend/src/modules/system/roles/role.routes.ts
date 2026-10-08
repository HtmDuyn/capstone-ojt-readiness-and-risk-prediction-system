import { Router } from "express";

import {
  authenticate,
} from "../../../middleware/authenticate";

import {
  authorizeRoles,
} from "../../../middleware/authorize";

import {
  listRoles,
} from "./role.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Roles
 *     description: Five fixed actor roles
 */

router.use(
  authenticate,
  authorizeRoles("ADMIN"),
);

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Get all roles
 *     tags:
 *       - Roles
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Roles retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               roles:
 *                 - id: 1
 *                   code: ADMIN
 *                   name: Quản trị viên
 *                 - id: 4
 *                   code: STUDENT
 *                   name: Sinh viên
 *       403:
 *         description: ADMIN role required
 */
router.get(
  "/",
  listRoles,
);

export default router;
