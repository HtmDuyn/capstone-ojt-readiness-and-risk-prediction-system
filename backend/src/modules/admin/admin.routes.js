const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middlewares/auth.middleware");
const requireAdmin = require("./admin.middleware");

const {
    getUsers,
    getUserById,
    updateUserStatus,
    updateUser,
    getSystemConfig,
    updateSystemConfig,
    getNotificationTemplates,
    getNotificationTemplateById,
    createNotificationTemplate,
    updateNotificationTemplate
} = require("./admin.controller");



/**
 * @swagger
 * /api/admin/system-config:
 *   get:
 *     summary: Get system configuration
 *     description: Get the current academic year, current OJT semester, and available period options. Admin only.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System configuration retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Administrator access required
 *       500:
 *         description: Unable to retrieve system configuration
 *   patch:
 *     summary: Update system configuration
 *     description: Set the current academic year and OJT semester. The selected OJT semester must belong to the selected academic year. Admin only.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - academicYearId
 *               - ojtSemesterId
 *             properties:
 *               academicYearId:
 *                 type: integer
 *                 minimum: 1
 *                 example: 3
 *               ojtSemesterId:
 *                 type: integer
 *                 minimum: 1
 *                 example: 2
 *     responses:
 *       200:
 *         description: System configuration updated successfully
 *       400:
 *         description: Invalid ID or OJT semester does not belong to the selected academic year
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Administrator access required
 *       404:
 *         description: Academic year or OJT semester not found
 *       409:
 *         description: Selected period became invalid before update
 *       500:
 *         description: Unable to update system configuration
 */

router.get(
    "/system-config",
    authMiddleware,
    requireAdmin,
    getSystemConfig
);

router.patch(
    "/system-config",
    authMiddleware,
    requireAdmin,
    updateSystemConfig
);

/**
 * @swagger
 * /api/admin/notification-templates:
 *   get:
 *     summary: Get notification templates
 *     description: Get all notification templates with their notification usage counts. Admin only.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification templates retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Administrator access required
 *       500:
 *         description: Unable to retrieve notification templates
 *   post:
 *     summary: Create notification template
 *     description: Create a new notification template. Template code is normalized to uppercase and must be unique. Admin only.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - templateCode
 *               - channel
 *             properties:
 *               templateCode:
 *                 type: string
 *                 maxLength: 30
 *                 example: OJT_DEADLINE
 *               subject:
 *                 type: string
 *                 nullable: true
 *                 maxLength: 200
 *                 example: OJT deadline reminder
 *               bodyTemplate:
 *                 type: string
 *                 nullable: true
 *                 example: OJT registration closes on {{deadline}}.
 *               channel:
 *                 type: string
 *                 enum: [EMAIL, IN_APP]
 *                 example: EMAIL
 *     responses:
 *       201:
 *         description: Notification template created successfully
 *       400:
 *         description: Invalid template data
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Administrator access required
 *       409:
 *         description: Template code already exists
 *       500:
 *         description: Unable to create notification template
 */

/**
 * @swagger
 * /api/admin/notification-templates/{id}:
 *   get:
 *     summary: Get notification template by ID
 *     description: Get one notification template and its notification usage count. Admin only.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: Notification template retrieved successfully
 *       400:
 *         description: Invalid notification template ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Administrator access required
 *       404:
 *         description: Notification template not found
 *       500:
 *         description: Unable to retrieve notification template
 *   patch:
 *     summary: Update notification template
 *     description: Update subject, body template, or channel. Template code is immutable. Admin only.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject:
 *                 type: string
 *                 nullable: true
 *                 maxLength: 200
 *                 example: Updated reminder subject
 *               bodyTemplate:
 *                 type: string
 *                 nullable: true
 *                 example: Updated notification body for {{value}}.
 *               channel:
 *                 type: string
 *                 enum: [EMAIL, IN_APP]
 *                 example: IN_APP
 *     responses:
 *       200:
 *         description: Notification template updated successfully
 *       400:
 *         description: Invalid ID, invalid editable field, or attempt to change template code
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Administrator access required
 *       404:
 *         description: Notification template not found
 *       500:
 *         description: Unable to update notification template
 */

router.get(
    "/notification-templates",
    authMiddleware,
    requireAdmin,
    getNotificationTemplates
);

router.get(
    "/notification-templates/:id",
    authMiddleware,
    requireAdmin,
    getNotificationTemplateById
);

router.post(
    "/notification-templates",
    authMiddleware,
    requireAdmin,
    createNotificationTemplate
);

router.patch(
    "/notification-templates/:id",
    authMiddleware,
    requireAdmin,
    updateNotificationTemplate
);

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