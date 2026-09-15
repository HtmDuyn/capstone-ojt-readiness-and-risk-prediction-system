const express = require("express");
const router = express.Router();

const {
    getHealth
} = require("../controllers/health.controller");

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Check backend status
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Backend is running
 */
router.get("/", getHealth);

module.exports = router;
