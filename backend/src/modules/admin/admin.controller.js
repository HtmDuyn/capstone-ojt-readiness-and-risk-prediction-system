const {
    getUsers: getUsersService,
    getUserById: getUserByIdService,
    getSystemConfig: getSystemConfigService,
    validateCurrentPeriod: validateCurrentPeriodService,
    updateSystemConfig: updateSystemConfigService,
    updateUserStatus: updateUserStatusService,
    validateUserUpdate: validateUserUpdateService,
    updateUser: updateUserService
} = require("./admin.service");

const getUsers = async (req, res) => {
    try {
        const { search = "", role = "" } = req.query;

        const users = await getUsersService({
            search,
            role
        });

        return res.status(200).json({
            success: true,
            message: "Users retrieved successfully",
            users
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            errorCode: "ADMIN_USERS_ERROR",
            message: "Unable to retrieve users.",
            details: error && error.message
                ? error.message
                : "Unknown error"
        });
    }
};

const getUserById = async (req, res) => {
    try {
        const userId = Number(req.params.id);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                success: false,
                errorCode: "INVALID_USER_ID",
                message: "User ID must be a positive integer."
            });
        }

        const user = await getUserByIdService(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                errorCode: "USER_NOT_FOUND",
                message: "User not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "User retrieved successfully",
            user
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            errorCode: "ADMIN_USER_ERROR",
            message: "Unable to retrieve user.",
            details: error && error.message
                ? error.message
                : "Unknown error"
        });
    }
};

const updateUserStatus = async (req, res) => {
    try {
        const userId = Number(req.params.id);

        const status =
            typeof req.body?.status === "string"
                ? req.body.status.trim().toUpperCase()
                : "";

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                success: false,
                errorCode: "INVALID_USER_ID",
                message: "User ID must be a positive integer."
            });
        }

        if (!["ACTIVE", "LOCKED"].includes(status)) {
            return res.status(400).json({
                success: false,
                errorCode: "INVALID_USER_STATUS",
                message: "Status must be ACTIVE or LOCKED."
            });
        }

        const user = await updateUserStatusService(
            userId,
            status
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                errorCode: "USER_NOT_FOUND",
                message: "User not found."
            });
        }

        return res.status(200).json({
            success: true,
            message:
                status === "LOCKED"
                    ? "User account locked successfully."
                    : "User account unlocked successfully.",
            user
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            errorCode: "ADMIN_USER_STATUS_ERROR",
            message: "Unable to update user status.",
            details: error && error.message
                ? error.message
                : "Unknown error"
        });
    }
};

const updateUser = async (req, res) => {
    try {
        const userId = Number(req.params.id);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                success: false,
                errorCode: "INVALID_USER_ID",
                message: "User ID must be a positive integer."
            });
        }

        const currentUser = await getUserByIdService(userId);

        if (!currentUser) {
            return res.status(404).json({
                success: false,
                errorCode: "USER_NOT_FOUND",
                message: "User not found."
            });
        }

        const body = req.body || {};

        const allowedFields = [
            "username",
            "email",
            "phone",
            "fullName",
            "roleCode"
        ];

        const hasUpdateField = allowedFields.some((field) =>
            Object.prototype.hasOwnProperty.call(body, field)
        );

        if (!hasUpdateField) {
            return res.status(400).json({
                success: false,
                errorCode: "NO_UPDATE_FIELDS",
                message: "No valid user fields were provided for update."
            });
        }

        const username =
            Object.prototype.hasOwnProperty.call(body, "username")
                ? typeof body.username === "string"
                    ? body.username.trim()
                    : ""
                : currentUser.username;

        const email =
            Object.prototype.hasOwnProperty.call(body, "email")
                ? typeof body.email === "string"
                    ? body.email.trim()
                    : ""
                : currentUser.email;

        const fullName =
            Object.prototype.hasOwnProperty.call(body, "fullName")
                ? typeof body.fullName === "string"
                    ? body.fullName.trim()
                    : ""
                : currentUser.fullName;

        let phone = currentUser.phone;

        if (Object.prototype.hasOwnProperty.call(body, "phone")) {
            if (body.phone === null || body.phone === "") {
                phone = null;
            } else if (typeof body.phone === "string") {
                phone = body.phone.trim() || null;
            } else {
                return res.status(400).json({
                    success: false,
                    errorCode: "INVALID_PHONE",
                    message: "Phone must be a string or null."
                });
            }
        }

        const roleCode =
            Object.prototype.hasOwnProperty.call(body, "roleCode")
                ? typeof body.roleCode === "string"
                    ? body.roleCode.trim().toUpperCase()
                    : ""
                : currentUser.roleCode;

        if (!username) {
            return res.status(400).json({
                success: false,
                errorCode: "INVALID_USERNAME",
                message: "Username is required."
            });
        }

        if (username.length > 50) {
            return res.status(400).json({
                success: false,
                errorCode: "USERNAME_TOO_LONG",
                message: "Username must not exceed 50 characters."
            });
        }

        if (!email) {
            return res.status(400).json({
                success: false,
                errorCode: "INVALID_EMAIL",
                message: "Email is required."
            });
        }

        if (email.length > 100) {
            return res.status(400).json({
                success: false,
                errorCode: "EMAIL_TOO_LONG",
                message: "Email must not exceed 100 characters."
            });
        }

        if (!fullName) {
            return res.status(400).json({
                success: false,
                errorCode: "INVALID_FULL_NAME",
                message: "Full name is required."
            });
        }

        if (fullName.length > 150) {
            return res.status(400).json({
                success: false,
                errorCode: "FULL_NAME_TOO_LONG",
                message: "Full name must not exceed 150 characters."
            });
        }

        if (phone && phone.length > 20) {
            return res.status(400).json({
                success: false,
                errorCode: "PHONE_TOO_LONG",
                message: "Phone must not exceed 20 characters."
            });
        }

        if (!roleCode) {
            return res.status(400).json({
                success: false,
                errorCode: "INVALID_ROLE",
                message: "Role code is required."
            });
        }

        const validation = await validateUserUpdateService({
            userId,
            username,
            email,
            roleCode
        });

        if (validation.usernameExists) {
            return res.status(409).json({
                success: false,
                errorCode: "USERNAME_ALREADY_EXISTS",
                message: "Username is already in use."
            });
        }

        if (validation.emailExists) {
            return res.status(409).json({
                success: false,
                errorCode: "EMAIL_ALREADY_EXISTS",
                message: "Email is already in use."
            });
        }

        if (!validation.roleExists) {
            return res.status(400).json({
                success: false,
                errorCode: "INVALID_ROLE",
                message: "Role does not exist."
            });
        }

        const user = await updateUserService({
            userId,
            username,
            email,
            phone,
            fullName,
            roleCode
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                errorCode: "USER_NOT_FOUND",
                message: "User not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "User updated successfully.",
            user
        });
    } catch (error) {
        if (error && error.code === "23505") {
            return res.status(409).json({
                success: false,
                errorCode: "USER_CONFLICT",
                message: "Username or email is already in use."
            });
        }

        return res.status(500).json({
            success: false,
            errorCode: "ADMIN_USER_UPDATE_ERROR",
            message: "Unable to update user.",
            details:
                error && error.message
                    ? error.message
                    : "Unknown error"
        });
    }
};

const getSystemConfig = async (req, res) => {
    try {
        const config = await getSystemConfigService();

        return res.status(200).json({
            success: true,
            message: "System configuration retrieved successfully.",
            config
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            errorCode: "ADMIN_SYSTEM_CONFIG_ERROR",
            message: "Unable to retrieve system configuration.",
            details:
                error && error.message
                    ? error.message
                    : "Unknown error"
        });
    }
};

const updateSystemConfig = async (req, res) => {
    try {
        const academicYearId =
            Number(req.body?.academicYearId);

        const ojtSemesterId =
            Number(req.body?.ojtSemesterId);

        if (
            !Number.isInteger(academicYearId) ||
            academicYearId <= 0
        ) {
            return res.status(400).json({
                success: false,
                errorCode: "INVALID_ACADEMIC_YEAR_ID",
                message:
                    "Academic year ID must be a positive integer."
            });
        }

        if (
            !Number.isInteger(ojtSemesterId) ||
            ojtSemesterId <= 0
        ) {
            return res.status(400).json({
                success: false,
                errorCode: "INVALID_OJT_SEMESTER_ID",
                message:
                    "OJT semester ID must be a positive integer."
            });
        }

        const validation =
            await validateCurrentPeriodService({
                academicYearId,
                ojtSemesterId
            });

        if (!validation.academicYearExists) {
            return res.status(404).json({
                success: false,
                errorCode: "ACADEMIC_YEAR_NOT_FOUND",
                message: "Academic year not found."
            });
        }

        if (!validation.ojtSemesterExists) {
            return res.status(404).json({
                success: false,
                errorCode: "OJT_SEMESTER_NOT_FOUND",
                message: "OJT semester not found."
            });
        }

        if (!validation.semesterBelongsToAcademicYear) {
            return res.status(400).json({
                success: false,
                errorCode: "OJT_SEMESTER_YEAR_MISMATCH",
                message:
                    "OJT semester does not belong to the selected academic year."
            });
        }

        const currentPeriod =
            await updateSystemConfigService({
                academicYearId,
                ojtSemesterId,
                updatedBy: req.user.userId
            });

        if (!currentPeriod) {
            return res.status(409).json({
                success: false,
                errorCode: "SYSTEM_CONFIG_UPDATE_CONFLICT",
                message:
                    "System configuration could not be updated because the selected period is no longer valid."
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "System configuration updated successfully.",
            currentPeriod
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            errorCode: "ADMIN_SYSTEM_CONFIG_UPDATE_ERROR",
            message:
                "Unable to update system configuration.",
            details:
                error && error.message
                    ? error.message
                    : "Unknown error"
        });
    }
};

module.exports = {
    getSystemConfig,
    updateSystemConfig,
    getUsers,
    getUserById,
    updateUserStatus,
    updateUser
};