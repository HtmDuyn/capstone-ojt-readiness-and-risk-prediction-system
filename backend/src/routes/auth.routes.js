const express = require("express");
const router = express.Router();

const { login, getCurrentUser } = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with username/email and password
 *     tags: [Auth]
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
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Missing username or password
 *       401:
 *         description: Invalid credentials
 *       404:
 *         description: User not found    
 *       500:
 *         description: Internal server error
 */
router.post("/login", login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: User is not authenticated
 *       404:
 *         description: Authenticated user not found
 *       500:
 *         description: Internal server error
 */
router.get("/me", authMiddleware, getCurrentUser);

module.exports = router;
