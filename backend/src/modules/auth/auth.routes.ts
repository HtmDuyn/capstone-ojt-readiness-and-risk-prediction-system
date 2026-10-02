import { Router } from "express";

import { authenticate } from "../../middleware/authenticate";

import {
  getCurrentUser,
  login,
} from "./auth.controller";

const router = Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with username/email and password
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: student01
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Missing username or password
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account inactive or locked
 */
router.post(
  "/login",
  login,
);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Invalid or expired token
 *       403:
 *         description: Account inactive or locked
 *       404:
 *         description: User not found
 */
router.get(
  "/me",
  authenticate,
  getCurrentUser,
);

export default router;