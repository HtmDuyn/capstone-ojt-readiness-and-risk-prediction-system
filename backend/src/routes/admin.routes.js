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

router.get(
    "/users",
    authMiddleware,
    requireAdmin,
    getUsers
);

router.get(
    "/users/:id",
    authMiddleware,
    requireAdmin,
    getUserById
);

router.patch(
    "/users/:id/status",
    authMiddleware,
    requireAdmin,
    updateUserStatus
);

router.patch(
    "/users/:id",
    authMiddleware,
    requireAdmin,
    updateUser
);

module.exports = router;