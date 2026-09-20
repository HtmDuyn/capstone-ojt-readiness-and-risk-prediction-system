const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const requireAdmin = require("../middlewares/admin.middleware");

const {
    getUsers,
    getUserById,
    updateUserStatus,
    updateUser
} = require("../controllers/admin.controller");

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users
 *     description: Get user list with optional search and role filter. Admin only.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         required: false
 *         schema:
 *           type: string
 *         description: Search by username, full name, email, or student code
 *       - in: query
 *         name: role
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by role code
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Administrator access required
 *       500:
 *         description: Unable to retrieve users
 */
router.get(
    "/users",
    authMiddleware,
    requireAdmin,
    getUsers
);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Get detailed information for one user. Admin only.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       400:
 *         description: Invalid user ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Administrator access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Unable to retrieve user
 */
router.get(
    "/users/:id",
    authMiddleware,
    requireAdmin,
    getUserById
);

/**
 * @swagger
 * /api/admin/users/{id}/status:
 *   patch:
 *     summary: Lock or unlock user account
 *     description: Change account status between ACTIVE and LOCKED. Admin only.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
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
 *                 example: LOCKED
 *     responses:
 *       200:
 *         description: User account status updated successfully
 *       400:
 *         description: Invalid user ID or status
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Administrator access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Unable to update user status
 */
router.patch(
    "/users/:id/status",
    authMiddleware,
    requireAdmin,
    updateUserStatus
);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   patch:
 *     summary: Update user account
 *     description: Partially update user account information. Admin only.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 maxLength: 50
 *                 example: student.test
 *               email:
 *                 type: string
 *                 maxLength: 100
 *                 example: student.test@ojt.local
 *               phone:
 *                 type: string
 *                 nullable: true
 *                 maxLength: 20
 *                 example: "0912345678"
 *               fullName:
 *                 type: string
 *                 maxLength: 150
 *                 example: Nguyen Van A
 *               roleCode:
 *                 type: string
 *                 example: STUDENT
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Administrator access required
 *       404:
 *         description: User not found
 *       409:
 *         description: Username or email already exists
 *       500:
 *         description: Unable to update user
 */
router.patch(
    "/users/:id",
    authMiddleware,
    requireAdmin,
    updateUser
);

module.exports = router;