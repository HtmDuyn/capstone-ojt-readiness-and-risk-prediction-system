import { Router } from "express";
import { changePassword } from './auth.service';
import { requestPasswordReset } from './password-reset.service';
import { authorizeRoles } from '../../middleware/authorize';
import { positiveId } from '../students/student.validation';

import {
  authenticate,
} from "../../middleware/authenticate";

import {
  getCurrentUser,
  login,
  logout,
} from "./auth.controller";

const router = Router();
router.post('/users/:userId/password-reset', authenticate, authorizeRoles('ADMIN'), async (req,res,next) => {
  try { res.status(202).json({success:true,data:await requestPasswordReset(positiveId(req.params.userId,'userId'),req.user!.userId)}); }
  catch(error) { next(error); }
});
router.post('/change-password', authenticate, async (req, res, next) => {
  try {
    await changePassword(req.user!.userId, req.body?.currentPassword, req.body?.newPassword);
    res.json({ success: true, message: 'Password changed. Please login again.' });
  } catch (error) { next(error); }
});

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication APIs
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     description: >
 *       Authenticate a user using email and password.
 *       If login succeeds, the API returns a JWT token.
 *       Use this token in Swagger Authorize as Bearer Token.
 *     tags:
 *       - Auth
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             email: admin@ojtrpa.edu.vn
 *             password: Admin@123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *             example:
 *               success: true
 *               message: Login successful
 *               token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *
 *       400:
 *         description: Missing or invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingEmail:
 *                 value:
 *                   success: false
 *                   errorCode: MISSING_EMAIL
 *                   message: Email is required.
 *
 *               missingPassword:
 *                 value:
 *                   success: false
 *                   errorCode: MISSING_PASSWORD
 *                   message: Password is required.
 *
 *       401:
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               errorCode: INVALID_CREDENTIALS
 *               message: Invalid email or password.
 *
 *       403:
 *         description: Account inactive or locked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               errorCode: ACCOUNT_INACTIVE
 *               message: This account is currently inactive or locked.
 *
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
 *     description: >
 *       Return information about the currently authenticated user.
 *       A valid Bearer JWT token is required.
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CurrentUserResponse'
 *             example:
 *               success: true
 *               message: User profile retrieved successfully
 *               user:
 *                 id: 1
 *                 username: admin01
 *                 email: admin@ojtrpa.edu.vn
 *                 fullName: System Administrator
 *                 status: ACTIVE
 *                 roleCode: ADMIN
 *                 roleName: System Administrator
 *
 *       401:
 *         description: Authentication token is missing, invalid or expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               authRequired:
 *                 value:
 *                   success: false
 *                   errorCode: AUTH_REQUIRED
 *                   message: Authentication required. Please provide a bearer token.
 *
 *               invalidToken:
 *                 value:
 *                   success: false
 *                   errorCode: INVALID_TOKEN
 *                   message: Invalid authentication token.
 *
 *               expiredToken:
 *                 value:
 *                   success: false
 *                   errorCode: TOKEN_EXPIRED
 *                   message: Token expired. Please login again.
 *
 *       403:
 *         description: Account inactive or locked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               errorCode: ACCOUNT_INACTIVE
 *               message: This account is currently inactive or locked.
 *
 *       404:
 *         description: Authenticated user not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/me",
  authenticate,
  getCurrentUser,
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout current user
 *     description: >
 *       Acknowledge logout. The client should discard its JWT.
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LogoutResponse'
 *             example:
 *               success: true
 *               message: Logout successful
 *
 *       401:
 *         description: Authentication token is missing, invalid or expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               authRequired:
 *                 value:
 *                   success: false
 *                   errorCode: AUTH_REQUIRED
 *                   message: Authentication required.
 *
 *               expiredToken:
 *                 value:
 *                   success: false
 *                   errorCode: TOKEN_EXPIRED
 *                   message: Token expired. Please login again.
 *
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/logout",
  authenticate,
  logout,
);

export default router;
