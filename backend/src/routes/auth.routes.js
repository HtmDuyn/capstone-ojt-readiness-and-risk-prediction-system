const express = require("express");

const router = express.Router();

const {
    login,
} = require("../controllers/auth.controller");

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login to the OJT system
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - account
 *               - password
 *               - role
 *             properties:
 *               account:
 *                 type: string
 *                 example: SE150000
 *               password:
 *                 type: string
 *                 example: Example@12345
 *               role:
 *                 type: string
 *                 enum:
 *                   - student
 *                   - education
 *                   - qhdn
 *                   - enterprise
 *                   - admin
 *                 example: student
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Missing or invalid login information
 *       401:
 *         description: Invalid account or password
 *       403:
 *         description: Account inactive or role mismatch
 */
router.post("/login", login);

module.exports = router;