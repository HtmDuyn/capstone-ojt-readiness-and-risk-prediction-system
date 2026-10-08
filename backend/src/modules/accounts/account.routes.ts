import { Router } from "express";

import {
  authenticate,
} from "../../middleware/authenticate";

import {
  authorizeRoles,
} from "../../middleware/authorize";

import {
  createAccount,
  getAccount,
  getMyProfile,
  listAccounts,
  updateAccountById,
  updateMyProfile,
  updateRole,
  updateStatus,
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
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: roleCode
 *         schema:
 *           type: string
 *           enum:
 *             - ADMIN
 *             - ACADEMIC
 *             - OJT_COORD
 *             - STUDENT
 *             - ENTERPRISE
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - ACTIVE
 *             - LOCKED
 *             - INACTIVE
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
 *   get:
 *     summary: Get current user's profile
 *     tags:
 *       - Accounts
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Account not found
 */
router.get(
  "/me/profile",
  authenticate,
  getMyProfile,
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
 * /api/accounts/{userId}:
 *   get:
 *     summary: Get account by ID
 *     description: ADMIN can access any account. Other users can only access their own account.
 *     tags:
 *       - Accounts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 4
 *     responses:
 *       200:
 *         description: Account retrieved successfully
 *       403:
 *         description: Resource forbidden
 *       404:
 *         description: Account not found
 */
router.get(
  "/:userId",
  authenticate,
  getAccount,
);

/**
 * @swagger
 * /api/accounts/{userId}:
 *   put:
 *     summary: Update account
 *     description: ADMIN can update supported account fields. Other users may only update permitted fields of their own account.
 *     tags:
 *       - Accounts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
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
 *               email:
 *                 type: string
 *                 format: email
 *                 description: ADMIN only
 *                 example: newemail@example.com
 *     responses:
 *       200:
 *         description: Account updated successfully
 *       403:
 *         description: Operation or field forbidden
 *       404:
 *         description: Account not found
 */
router.put(
  "/:userId",
  authenticate,
  updateAccountById,
);

/**
 * @swagger
 * /api/accounts/{userId}/status:
 *   patch:
 *     summary: Change account status
 *     tags:
 *       - Accounts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum:
 *                   - ACTIVE
 *                   - LOCKED
 *                   - INACTIVE
 *                 example: LOCKED
 *     responses:
 *       200:
 *         description: Account status updated successfully
 *       403:
 *         description: ADMIN role required
 *       404:
 *         description: Account not found
 */
router.patch(
  "/:userId/status",
  authenticate,
  authorizeRoles("ADMIN"),
  updateStatus,
);

/**
 * @swagger
 * /api/accounts/{userId}/role:
 *   patch:
 *     summary: Change account role
 *     tags:
 *       - Accounts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleId
 *             properties:
 *               roleId:
 *                 type: integer
 *                 example: 4
 *     responses:
 *       200:
 *         description: Account role updated successfully
 *       403:
 *         description: ADMIN role required
 *       404:
 *         description: Account or role not found
 */
router.patch(
  "/:userId/role",
  authenticate,
  authorizeRoles("ADMIN"),
  updateRole,
);

export default router;