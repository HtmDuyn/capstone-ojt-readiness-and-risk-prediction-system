/**
 * @swagger
 * /api/qhdn/students/{id}:
 *   get:
 *     tags: [QHDN core]
 *     summary: Read a handed-off student's profile, study program and CV metadata
 *     description: ADMIN / OJT_COORD only. The student must be handed off in the requested OJT semester. Returns current CV and the CV attached to the latest coordinated application separately. CV contents use GET /api/students/{id}/cv with cvFileId.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: ojtSemesterId
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       '200':
 *         description: Student contact details, program, major, cohort, current application and CV metadata.
 *       '400':
 *         description: Invalid identifiers or unsupported query parameters.
 *       '401':
 *         description: Authentication required.
 *       '403':
 *         description: QHDN or Admin role required.
 *       '404':
 *         description: Student not found in the semester's handoff list.
 */
export const studentProfileOpenApi = true;
