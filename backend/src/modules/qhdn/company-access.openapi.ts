/**
 * @swagger
 * /api/qhdn/companies/{id}/access:
 *   patch:
 *     tags: [QHDN core]
 *     summary: Disable or restore an enterprise's account access
 *     description: ADMIN / OJT_COORD only. INACTIVE disables enterprise login and authenticated access while preserving company data. ACTIVE restores company access subject to each user's own account status. Both changes revoke existing enterprise sessions and write an audit record. Does not restore companies deleted by Admin.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [ACTIVE, INACTIVE] }
 *     responses:
 *       '200': { description: Updated company access and affected enterprise account count. }
 *       '400': { description: Invalid status or unknown field. }
 *       '401': { description: Authentication required. }
 *       '403': { description: QHDN or Admin role required. }
 *       '404': { description: Company not found or already deleted. }
 */
export {};
