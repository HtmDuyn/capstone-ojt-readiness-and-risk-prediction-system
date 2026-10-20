import { Router } from "express";

import { getHealth } from "../health.controller";

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Check backend and database status
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: Backend and database are running
 *       500:
 *         description: Backend or database error
 */
router.get("/", getHealth);

export default router;
