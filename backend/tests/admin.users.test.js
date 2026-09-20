require("dotenv").config();

const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = require("../src/app");
const db = require("../src/config/database");

const JWT_SECRET = process.env.JWT_SECRET || "ojt-dev-secret";

test("GET /api/admin/users returns 401 without token", async () => {
    const response = await request(app)
        .get("/api/admin/users");

    assert.equal(response.status, 401);
    assert.equal(response.body.success, false);
    assert.equal(response.body.errorCode, "AUTH_REQUIRED");
});

test("GET /api/admin/users returns 403 for non-admin user", async () => {
    const token = jwt.sign(
        {
            sub: 1,
            userId: 1,
            username: "student.test",
            roleCode: "STUDENT"
        },
        JWT_SECRET,
        { expiresIn: "5m" }
    );

    const response = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${token}`);

    assert.equal(response.status, 403);
    assert.equal(response.body.success, false);
    assert.equal(response.body.errorCode, "ADMIN_ACCESS_REQUIRED");
});

test("GET /api/admin/users returns 200 for admin user", async () => {
    const token = jwt.sign(
        {
            sub: 5,
            userId: 5,
            username: "admin.test",
            roleCode: "ADMIN"
        },
        JWT_SECRET,
        { expiresIn: "5m" }
    );

    const response = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${token}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.message, "Users retrieved successfully");

    assert.ok(Array.isArray(response.body.users));
    assert.ok(response.body.users.length > 0);

    const admin = response.body.users.find(
        (user) => user.roleCode === "ADMIN"
    );

    assert.ok(admin);
    assert.equal(admin.username, "admin.test");

    for (const user of response.body.users) {
        assert.equal(
            Object.prototype.hasOwnProperty.call(
                user,
                "PasswordHash"
            ),
            false
        );

        assert.equal(
            Object.prototype.hasOwnProperty.call(
                user,
                "passwordHash"
            ),
            false
        );
    }
});

test("GET /api/admin/users/:id returns 200 for existing user", async () => {
    const token = jwt.sign(
        {
            sub: 5,
            userId: 5,
            username: "admin.test",
            roleCode: "ADMIN"
        },
        JWT_SECRET,
        { expiresIn: "5m" }
    );

    const response = await request(app)
        .get("/api/admin/users/1")
        .set("Authorization", `Bearer ${token}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.message, "User retrieved successfully");

    assert.equal(response.body.user.id, 1);
    assert.equal(response.body.user.username, "student.test");
    assert.equal(response.body.user.studentCode, "SE150000");

    assert.equal(
        Object.prototype.hasOwnProperty.call(
            response.body.user,
            "PasswordHash"
        ),
        false
    );

    assert.equal(
        Object.prototype.hasOwnProperty.call(
            response.body.user,
            "passwordHash"
        ),
        false
    );
});

test("GET /api/admin/users/:id returns 404 for missing user", async () => {
    const token = jwt.sign(
        {
            sub: 5,
            userId: 5,
            username: "admin.test",
            roleCode: "ADMIN"
        },
        JWT_SECRET,
        { expiresIn: "5m" }
    );

    const response = await request(app)
        .get("/api/admin/users/999999")
        .set("Authorization", `Bearer ${token}`);

    assert.equal(response.status, 404);
    assert.equal(response.body.success, false);
    assert.equal(response.body.errorCode, "USER_NOT_FOUND");
});

test("GET /api/admin/users/:id returns 400 for invalid user id", async () => {
    const token = jwt.sign(
        {
            sub: 5,
            userId: 5,
            username: "admin.test",
            roleCode: "ADMIN"
        },
        JWT_SECRET,
        { expiresIn: "5m" }
    );

    const response = await request(app)
        .get("/api/admin/users/abc")
        .set("Authorization", `Bearer ${token}`);

    assert.equal(response.status, 400);
    assert.equal(response.body.success, false);
    assert.equal(response.body.errorCode, "INVALID_USER_ID");
});

test("GET /api/admin/users searches by student code", async () => {
    const token = jwt.sign(
        {
            sub: 5,
            userId: 5,
            username: "admin.test",
            roleCode: "ADMIN"
        },
        JWT_SECRET,
        { expiresIn: "5m" }
    );

    const response = await request(app)
        .get("/api/admin/users")
        .query({
            search: "SE150000"
        })
        .set("Authorization", `Bearer ${token}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.users.length, 1);
    assert.equal(response.body.users[0].username, "student.test");
    assert.equal(response.body.users[0].studentCode, "SE150000");
});

test("GET /api/admin/users filters by role", async () => {
    const token = jwt.sign(
        {
            sub: 5,
            userId: 5,
            username: "admin.test",
            roleCode: "ADMIN"
        },
        JWT_SECRET,
        { expiresIn: "5m" }
    );

    const response = await request(app)
        .get("/api/admin/users")
        .query({
            role: "ENTERPRISE"
        })
        .set("Authorization", `Bearer ${token}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.users.length, 1);
    assert.equal(response.body.users[0].username, "enterprise.test");
    assert.equal(response.body.users[0].roleCode, "ENTERPRISE");
});

test("GET /api/admin/users supports search and role together", async () => {
    const token = jwt.sign(
        {
            sub: 5,
            userId: 5,
            username: "admin.test",
            roleCode: "ADMIN"
        },
        JWT_SECRET,
        { expiresIn: "5m" }
    );

    const response = await request(app)
        .get("/api/admin/users")
        .query({
            search: "test",
            role: "ADMIN"
        })
        .set("Authorization", `Bearer ${token}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.users.length, 1);
    assert.equal(response.body.users[0].username, "admin.test");
    assert.equal(response.body.users[0].roleCode, "ADMIN");
});

test("PATCH /api/admin/users/:id/status returns 401 without token", async () => {
    const response = await request(app)
        .patch("/api/admin/users/1/status")
        .send({
            status: "LOCKED"
        });

    assert.equal(response.status, 401);
    assert.equal(response.body.success, false);
    assert.equal(response.body.errorCode, "AUTH_REQUIRED");
});

test("PATCH /api/admin/users/:id/status returns 403 for non-admin user", async () => {
    const token = jwt.sign(
        {
            sub: 1,
            userId: 1,
            username: "student.test",
            roleCode: "STUDENT"
        },
        JWT_SECRET,
        { expiresIn: "5m" }
    );

    const response = await request(app)
        .patch("/api/admin/users/2/status")
        .set("Authorization", `Bearer ${token}`)
        .send({
            status: "LOCKED"
        });

    assert.equal(response.status, 403);
    assert.equal(response.body.success, false);
    assert.equal(response.body.errorCode, "ADMIN_ACCESS_REQUIRED");
});

test("PATCH /api/admin/users/:id/status returns 400 for invalid user id", async () => {
    const token = jwt.sign(
        {
            sub: 5,
            userId: 5,
            username: "admin.test",
            roleCode: "ADMIN"
        },
        JWT_SECRET,
        { expiresIn: "5m" }
    );

    const response = await request(app)
        .patch("/api/admin/users/abc/status")
        .set("Authorization", `Bearer ${token}`)
        .send({
            status: "LOCKED"
        });

    assert.equal(response.status, 400);
    assert.equal(response.body.success, false);
    assert.equal(response.body.errorCode, "INVALID_USER_ID");
});

test("PATCH /api/admin/users/:id/status returns 400 for invalid status", async () => {
    const token = jwt.sign(
        {
            sub: 5,
            userId: 5,
            username: "admin.test",
            roleCode: "ADMIN"
        },
        JWT_SECRET,
        { expiresIn: "5m" }
    );

    const response = await request(app)
        .patch("/api/admin/users/1/status")
        .set("Authorization", `Bearer ${token}`)
        .send({
            status: "DELETED"
        });

    assert.equal(response.status, 400);
    assert.equal(response.body.success, false);
    assert.equal(response.body.errorCode, "INVALID_USER_STATUS");
});

test("PATCH /api/admin/users/:id/status returns 404 for missing user", async () => {
    const token = jwt.sign(
        {
            sub: 5,
            userId: 5,
            username: "admin.test",
            roleCode: "ADMIN"
        },
        JWT_SECRET,
        { expiresIn: "5m" }
    );

    const response = await request(app)
        .patch("/api/admin/users/999999/status")
        .set("Authorization", `Bearer ${token}`)
        .send({
            status: "LOCKED"
        });

    assert.equal(response.status, 404);
    assert.equal(response.body.success, false);
    assert.equal(response.body.errorCode, "USER_NOT_FOUND");
});

test("PATCH /api/admin/users/:id/status locks and unlocks account correctly", async () => {
    const username = "__admin_lock_test__";
    const email = "__admin_lock_test__@ojt.local";
    const password = "TempLock#12345";

    const adminToken = jwt.sign(
        {
            sub: 5,
            userId: 5,
            username: "admin.test",
            roleCode: "ADMIN"
        },
        JWT_SECRET,
        { expiresIn: "5m" }
    );

    let userId = null;

    try {
        await db.query(
            `
            DELETE FROM "Users"
            WHERE "Username" = $1;
            `,
            [username]
        );

        const passwordHash = await bcrypt.hash(
            password,
            10
        );

        const insertResult = await db.query(
            `
            INSERT INTO "Users"
                (
                    "Username",
                    "PasswordHash",
                    "Email",
                    "FullName",
                    "RoleID",
                    "Status"
                )
            SELECT
                $1,
                $2,
                $3,
                $4,
                r."RoleID",
                'ACTIVE'
            FROM "Roles" r
            WHERE r."RoleCode" = 'STUDENT'
            RETURNING "UserID";
            `,
            [
                username,
                passwordHash,
                email,
                "Temporary Lock Test User"
            ]
        );

        assert.ok(insertResult.rows[0]);

        userId = insertResult.rows[0].UserID;

        const oldStudentToken = jwt.sign(
            {
                sub: userId,
                userId,
                username,
                roleCode: "STUDENT"
            },
            JWT_SECRET,
            { expiresIn: "5m" }
        );

        const lockResponse = await request(app)
            .patch(`/api/admin/users/${userId}/status`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                status: "LOCKED"
            });

        assert.equal(lockResponse.status, 200);
        assert.equal(lockResponse.body.success, true);
        assert.equal(lockResponse.body.user.id, userId);
        assert.equal(lockResponse.body.user.status, "LOCKED");

        const oldTokenResponse = await request(app)
            .get("/api/admin/users")
            .set(
                "Authorization",
                `Bearer ${oldStudentToken}`
            );

        assert.equal(oldTokenResponse.status, 403);
        assert.equal(
            oldTokenResponse.body.errorCode,
            "ACCOUNT_LOCKED"
        );

        const loginWhileLocked = await request(app)
            .post("/api/auth/login")
            .send({
                username,
                password
            });

        assert.equal(loginWhileLocked.status, 403);
        assert.equal(
            loginWhileLocked.body.errorCode,
            "ACCOUNT_LOCKED"
        );

        const unlockResponse = await request(app)
            .patch(`/api/admin/users/${userId}/status`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                status: "ACTIVE"
            });

        assert.equal(unlockResponse.status, 200);
        assert.equal(unlockResponse.body.success, true);
        assert.equal(unlockResponse.body.user.id, userId);
        assert.equal(unlockResponse.body.user.status, "ACTIVE");

        const oldTokenAfterUnlock = await request(app)
            .get("/api/admin/users")
            .set(
                "Authorization",
                `Bearer ${oldStudentToken}`
            );

        assert.equal(oldTokenAfterUnlock.status, 403);
        assert.equal(
            oldTokenAfterUnlock.body.errorCode,
            "ADMIN_ACCESS_REQUIRED"
        );

        const loginAfterUnlock = await request(app)
            .post("/api/auth/login")
            .send({
                username,
                password
            });

        assert.equal(loginAfterUnlock.status, 200);
        assert.equal(loginAfterUnlock.body.success, true);
        assert.ok(loginAfterUnlock.body.token);
        assert.equal(
            loginAfterUnlock.body.user.status,
            "ACTIVE"
        );

    } finally {
        await db.query(
            `
            DELETE FROM "Users"
            WHERE "Username" = $1;
            `,
            [username]
        );
    }
});

test("PATCH /api/admin/users/:id returns 401 without token", async () => {
    const response = await request(app)
        .patch("/api/admin/users/1")
        .send({
            fullName: "Unauthorized Update"
        });

    assert.equal(response.status, 401);
    assert.equal(response.body.success, false);
    assert.equal(response.body.errorCode, "AUTH_REQUIRED");
});

test("PATCH /api/admin/users/:id returns 403 for non-admin user", async () => {
    const token = jwt.sign(
        {
            sub: 1,
            userId: 1,
            username: "student.test",
            roleCode: "STUDENT"
        },
        JWT_SECRET,
        { expiresIn: "5m" }
    );

    const response = await request(app)
        .patch("/api/admin/users/2")
        .set("Authorization", `Bearer ${token}`)
        .send({
            fullName: "Unauthorized Update"
        });

    assert.equal(response.status, 403);
    assert.equal(response.body.success, false);
    assert.equal(
        response.body.errorCode,
        "ADMIN_ACCESS_REQUIRED"
    );
});

test("PATCH /api/admin/users/:id returns 400 for invalid user id", async () => {
    const token = jwt.sign(
        {
            sub: 5,
            userId: 5,
            username: "admin.test",
            roleCode: "ADMIN"
        },
        JWT_SECRET,
        { expiresIn: "5m" }
    );

    const response = await request(app)
        .patch("/api/admin/users/abc")
        .set("Authorization", `Bearer ${token}`)
        .send({
            fullName: "Updated Name"
        });

    assert.equal(response.status, 400);
    assert.equal(response.body.success, false);
    assert.equal(response.body.errorCode, "INVALID_USER_ID");
});

test("PATCH /api/admin/users/:id returns 404 for missing user", async () => {
    const token = jwt.sign(
        {
            sub: 5,
            userId: 5,
            username: "admin.test",
            roleCode: "ADMIN"
        },
        JWT_SECRET,
        { expiresIn: "5m" }
    );

    const response = await request(app)
        .patch("/api/admin/users/999999")
        .set("Authorization", `Bearer ${token}`)
        .send({
            fullName: "Missing User"
        });

    assert.equal(response.status, 404);
    assert.equal(response.body.success, false);
    assert.equal(response.body.errorCode, "USER_NOT_FOUND");
});

test("PATCH /api/admin/users/:id returns 400 when no update fields are provided", async () => {
    const token = jwt.sign(
        {
            sub: 5,
            userId: 5,
            username: "admin.test",
            roleCode: "ADMIN"
        },
        JWT_SECRET,
        { expiresIn: "5m" }
    );

    const response = await request(app)
        .patch("/api/admin/users/1")
        .set("Authorization", `Bearer ${token}`)
        .send({});

    assert.equal(response.status, 400);
    assert.equal(response.body.success, false);
    assert.equal(response.body.errorCode, "NO_UPDATE_FIELDS");
});

test("PATCH /api/admin/users/:id rejects duplicate username case-insensitively", async () => {
    const token = jwt.sign(
        {
            sub: 5,
            userId: 5,
            username: "admin.test",
            roleCode: "ADMIN"
        },
        JWT_SECRET,
        { expiresIn: "5m" }
    );

    const response = await request(app)
        .patch("/api/admin/users/1")
        .set("Authorization", `Bearer ${token}`)
        .send({
            username: "ADMIN.TEST"
        });

    assert.equal(response.status, 409);
    assert.equal(response.body.success, false);
    assert.equal(
        response.body.errorCode,
        "USERNAME_ALREADY_EXISTS"
    );
});

test("PATCH /api/admin/users/:id rejects duplicate email case-insensitively", async () => {
    const token = jwt.sign(
        {
            sub: 5,
            userId: 5,
            username: "admin.test",
            roleCode: "ADMIN"
        },
        JWT_SECRET,
        { expiresIn: "5m" }
    );

    const response = await request(app)
        .patch("/api/admin/users/1")
        .set("Authorization", `Bearer ${token}`)
        .send({
            email: "ADMIN.TEST@OJT.LOCAL"
        });

    assert.equal(response.status, 409);
    assert.equal(response.body.success, false);
    assert.equal(
        response.body.errorCode,
        "EMAIL_ALREADY_EXISTS"
    );
});

test("PATCH /api/admin/users/:id rejects role that does not exist", async () => {
    const token = jwt.sign(
        {
            sub: 5,
            userId: 5,
            username: "admin.test",
            roleCode: "ADMIN"
        },
        JWT_SECRET,
        { expiresIn: "5m" }
    );

    const response = await request(app)
        .patch("/api/admin/users/1")
        .set("Authorization", `Bearer ${token}`)
        .send({
            roleCode: "ROLE_DOES_NOT_EXIST"
        });

    assert.equal(response.status, 400);
    assert.equal(response.body.success, false);
    assert.equal(response.body.errorCode, "INVALID_ROLE");
});

test("PATCH /api/admin/users/:id supports partial and full account updates", async () => {
    const originalUsername = "__admin_update_auto_test__";
    const updatedUsername = "__admin_update_auto_changed__";

    const originalEmail =
        "__admin_update_auto_test__@ojt.local";

    const updatedEmail =
        "__admin_update_auto_changed__@ojt.local";

    const adminToken = jwt.sign(
        {
            sub: 5,
            userId: 5,
            username: "admin.test",
            roleCode: "ADMIN"
        },
        JWT_SECRET,
        { expiresIn: "5m" }
    );

    try {
        await db.query(
            `
            DELETE FROM "Users"
            WHERE "Username" IN ($1, $2);
            `,
            [
                originalUsername,
                updatedUsername
            ]
        );

        const passwordHash = await bcrypt.hash(
            "AutoUpdate#12345",
            10
        );

        const insertResult = await db.query(
            `
            INSERT INTO "Users"
                (
                    "Username",
                    "PasswordHash",
                    "Email",
                    "Phone",
                    "FullName",
                    "RoleID",
                    "Status"
                )
            SELECT
                $1,
                $2,
                $3,
                $4,
                $5,
                r."RoleID",
                'ACTIVE'
            FROM "Roles" r
            WHERE r."RoleCode" = 'STUDENT'
            RETURNING "UserID";
            `,
            [
                originalUsername,
                passwordHash,
                originalEmail,
                "0900000000",
                "Original Automated User"
            ]
        );

        assert.ok(insertResult.rows[0]);

        const userId = insertResult.rows[0].UserID;

        const partialResponse = await request(app)
            .patch(`/api/admin/users/${userId}`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                fullName: "Partial Automated Update"
            });

        assert.equal(partialResponse.status, 200);
        assert.equal(partialResponse.body.success, true);

        assert.equal(
            partialResponse.body.user.username,
            originalUsername
        );

        assert.equal(
            partialResponse.body.user.email,
            originalEmail
        );

        assert.equal(
            partialResponse.body.user.phone,
            "0900000000"
        );

        assert.equal(
            partialResponse.body.user.fullName,
            "Partial Automated Update"
        );

        assert.equal(
            partialResponse.body.user.roleCode,
            "STUDENT"
        );

        assert.equal(
            partialResponse.body.user.status,
            "ACTIVE"
        );

        const fullResponse = await request(app)
            .patch(`/api/admin/users/${userId}`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                username: updatedUsername,
                email: updatedEmail,
                phone: "0911111111",
                fullName: "Fully Updated Automated User",
                roleCode: "ENTERPRISE"
            });

        assert.equal(fullResponse.status, 200);
        assert.equal(fullResponse.body.success, true);

        assert.equal(
            fullResponse.body.user.username,
            updatedUsername
        );

        assert.equal(
            fullResponse.body.user.email,
            updatedEmail
        );

        assert.equal(
            fullResponse.body.user.phone,
            "0911111111"
        );

        assert.equal(
            fullResponse.body.user.fullName,
            "Fully Updated Automated User"
        );

        assert.equal(
            fullResponse.body.user.roleCode,
            "ENTERPRISE"
        );

        assert.equal(
            fullResponse.body.user.status,
            "ACTIVE"
        );

        const getResponse = await request(app)
            .get(`/api/admin/users/${userId}`)
            .set("Authorization", `Bearer ${adminToken}`);

        assert.equal(getResponse.status, 200);

        assert.equal(
            getResponse.body.user.username,
            updatedUsername
        );

        assert.equal(
            getResponse.body.user.email,
            updatedEmail
        );

        assert.equal(
            getResponse.body.user.phone,
            "0911111111"
        );

        assert.equal(
            getResponse.body.user.fullName,
            "Fully Updated Automated User"
        );

        assert.equal(
            getResponse.body.user.roleCode,
            "ENTERPRISE"
        );

    } finally {
        await db.query(
            `
            DELETE FROM "Users"
            WHERE "Username" IN ($1, $2);
            `,
            [
                originalUsername,
                updatedUsername
            ]
        );
    }
});

test("changing an admin role immediately removes admin access from an old JWT", async () => {
    const username = "__stale_admin_role_test__";
    const email = "__stale_admin_role_test__@ojt.local";

    const stableAdminToken = jwt.sign(
        {
            sub: 5,
            userId: 5,
            username: "admin.test",
            roleCode: "ADMIN"
        },
        JWT_SECRET,
        { expiresIn: "5m" }
    );

    try {
        await db.query(
            `
            DELETE FROM "Users"
            WHERE "Username" = $1;
            `,
            [username]
        );

        const passwordHash = await bcrypt.hash(
            "StaleRole#12345",
            10
        );

        const insertResult = await db.query(
            `
            INSERT INTO "Users"
                (
                    "Username",
                    "PasswordHash",
                    "Email",
                    "FullName",
                    "RoleID",
                    "Status"
                )
            SELECT
                $1,
                $2,
                $3,
                $4,
                r."RoleID",
                'ACTIVE'
            FROM "Roles" r
            WHERE r."RoleCode" = 'ADMIN'
            RETURNING "UserID";
            `,
            [
                username,
                passwordHash,
                email,
                "Temporary Stale Role Admin"
            ]
        );

        assert.ok(insertResult.rows[0]);

        const userId = insertResult.rows[0].UserID;

        const oldAdminToken = jwt.sign(
            {
                sub: userId,
                userId,
                username,
                roleCode: "ADMIN"
            },
            JWT_SECRET,
            { expiresIn: "5m" }
        );

        const updateResponse = await request(app)
            .patch(`/api/admin/users/${userId}`)
            .set(
                "Authorization",
                `Bearer ${stableAdminToken}`
            )
            .send({
                roleCode: "STUDENT"
            });

        assert.equal(updateResponse.status, 200);
        assert.equal(updateResponse.body.success, true);
        assert.equal(
            updateResponse.body.user.roleCode,
            "STUDENT"
        );

        const staleTokenResponse = await request(app)
            .get("/api/admin/users")
            .set(
                "Authorization",
                `Bearer ${oldAdminToken}`
            );

        assert.equal(staleTokenResponse.status, 403);
        assert.equal(
            staleTokenResponse.body.errorCode,
            "ADMIN_ACCESS_REQUIRED"
        );

    } finally {
        await db.query(
            `
            DELETE FROM "Users"
            WHERE "Username" = $1;
            `,
            [username]
        );
    }
});