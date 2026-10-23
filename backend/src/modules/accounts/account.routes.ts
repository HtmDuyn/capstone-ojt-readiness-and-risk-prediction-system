import { Router } from "express";

import {
  authenticate,
} from "../../middleware/authenticate";

import {
  authorizeRoles,
} from "../../middleware/authorize";

import {
  createAccount,
  listAccounts,
  updateAccountById,
  updateMyProfile,
} from "./account.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Accounts
 *     description: User account and profile management
 */

/**
 * @swagger
 * /api/accounts:
 *   get:
 *     summary: Get account list
 *     tags:
 *       - Accounts
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account list retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: ADMIN role required
 */
router.get(
  "/",
  authenticate,
  authorizeRoles("ADMIN"),
  listAccounts,
);

/**
 * @swagger
 * /api/accounts:
 *   post:
 *     summary: Create a new account
 *     tags:
 *       - Accounts
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - fullName
 *               - roleId
 *             properties:
 *               username:
 *                 type: string
 *                 example: student05
 *               email:
 *                 type: string
 *                 format: email
 *                 example: student05@student.edu.vn
 *               password:
 *                 type: string
 *                 example: Student@123
 *               fullName:
 *                 type: string
 *                 example: Nguyen Van A
 *               phone:
 *                 type: string
 *                 nullable: true
 *                 example: "0900000005"
 *               roleId:
 *                 type: integer
 *                 example: 4
 *     responses:
 *       201:
 *         description: Account created successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: ADMIN role required
 *       409:
 *         description: Username or email already exists
 */
router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN"),
  createAccount,
);

/**
 * @swagger
 * /api/accounts/me/profile:
 *   patch:
 *     summary: Update current user's profile
 *     description: User can update only allowed personal profile fields.
 *     tags:
 *       - Accounts
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Nguyen Van A
 *               phone:
 *                 type: string
 *                 nullable: true
 *                 example: "0909123456"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Authentication required
 */
router.patch(
  "/me/profile",
  authenticate,
  updateMyProfile,
);

/**
 * @swagger
 * /api/accounts/update:
 *   patch:
 *     summary: Update account
 *     description: Admin cập nhật thông tin, trạng thái và vai trò trong một lần. Chỉ gửi trường cần thay đổi.
 *     tags:
 *       - Accounts
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId:
 *                 type: integer
 *                 minimum: 1
 *                 example: 12
 *               fullName:
 *                 type: string
 *                 example: Nguyen Van A
 *               phone:
 *                 type: string
 *                 nullable: true
 *                 example: "0909123456"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: ADMIN only
 *                 example: newemail@example.com
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, LOCKED, INACTIVE]
 *               roleId:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Account updated successfully
 *       403:
 *         description: Operation or field forbidden
 *       404:
 *         description: Account not found
 */
router.patch(
  "/update",
  authenticate,
  authorizeRoles('ADMIN'),
  updateAccountById,
);

export default router;
