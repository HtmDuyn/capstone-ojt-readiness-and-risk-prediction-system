/**
 * @swagger
 * components:
 *   schemas:
 *     AccountImportRequest:
 *       type: object
 *       required: [kind, idempotencyKey, rows]
 *       properties:
 *         kind:
 *           type: string
 *           enum: [STUDENT, ENTERPRISE]
 *         idempotencyKey:
 *           type: string
 *           maxLength: 100
 *         semesterId:
 *           type: integer
 *           description: Required for enterprise imports; configure this and the next semester dates.
 *         rows:
 *           type: array
 *           minItems: 1
 *           maxItems: 500
 *           items:
 *             type: object
 *             required: [code, email, fullName]
 *             properties:
 *               code: { type: string, maxLength: 20 }
 *               email: { type: string, format: email, maxLength: 100 }
 *               fullName: { type: string, maxLength: 150 }
 *               name: { type: string, description: Required enterprise name }
 *               address: { type: string }
 *               positions:
 *                 type: array
 *                 description: Required for enterprise imports
 *                 minItems: 1
 *                 maxItems: 50
 *                 items:
 *                   type: object
 *                   required: [code, title, description, requirements, capacity]
 *                   properties:
 *                     code: { type: string, maxLength: 60 }
 *                     title: { type: string, maxLength: 150 }
 *                     description: { type: string }
 *                     requirements: { type: string }
 *                     capacity: { type: integer, minimum: 1 }
 *       example:
 *         kind: STUDENT
 *         idempotencyKey: students-2026-k1-001
 *         rows:
 *           - code: SV001
 *             email: student@example.com
 *             fullName: Nguyễn Văn A
 *   requestBodies:
 *     AccountImport:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AccountImportRequest'
 * /api/imports/preview:
 *   post:
 *     tags: [Imports]
 *     summary: Validate identities and preview an import without writes
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       $ref: '#/components/requestBodies/AccountImport'
 *     responses:
 *       200: { description: Created and updated counts with row actions }
 *       400: { description: Invalid row or missing semester dates }
 *       403: { description: Actor cannot import this account type }
 *       409: { description: Identity conflict or semester already imported }
 * /api/imports/commit:
 *   post:
 *     tags: [Imports]
 *     summary: Import accounts and queue encrypted welcome emails atomically
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       $ref: '#/components/requestBodies/AccountImport'
 *     responses:
 *       200: { description: Batch ID and counts, or idempotent replay }
 *       400: { description: Invalid request }
 *       403: { description: Actor cannot import this account type }
 *       409: { description: Duplicate identity or completed semester }
 * /api/imports/emails:
 *   get:
 *     tags: [Imports]
 *     summary: ADMIN views latest 100 delivery statuses without credentials
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Email status list }
 *       403: { description: ADMIN required }
 * /api/imports/emails/{emailId}/retry:
 *   post:
 *     tags: [Imports]
 *     summary: ADMIN retries an unexpired failed email
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: emailId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Email queued again }
 *       409: { description: Email cannot be retried }
 * /api/imports/archive:
 *   post:
 *     tags: [Imports]
 *     summary: ADMIN or OJT_COORD archives recruitment after two semesters
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Number of newly archived posts }
 *       403: { description: ADMIN or OJT_COORD required }
 * /api/auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change password and revoke old tokens; login again after success
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string, format: password }
 *               newPassword: { type: string, format: password, minLength: 12, description: Maximum 72 UTF-8 bytes }
 *     responses:
 *       200: { description: Password changed; login again }
 *       400: { description: Password invalid or unchanged }
 *       401: { description: Current password incorrect or token revoked }
 *       403: { description: Temporary password expired }
 */
export const provisioningOpenApi = true;
