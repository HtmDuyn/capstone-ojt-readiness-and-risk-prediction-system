/**
 * @openapi
 * /api/academic-years/{id}/calendar:
 *   parameters:
 *     - { in: path, name: id, required: true, schema: { type: integer, minimum: 1 } }
 *   get:
 *     tags: [Academic]
 *     summary: Read a year calendar and its current revision
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       '200': { description: 'data contains year, semesters and revision.' }
 *       '404': { description: 'Academic year not found.' }
 *   put:
 *     tags: [Academic]
 *     summary: Save Spring, Summer and Fall dates together
 *     description: "ACADEMIC/ADMIN. Send all three semesters in SPRING, SUMMER, FALL order with the revision from GET. Dates must fall inside the first year, be ordered and not overlap. IDs and linked history are preserved. Other dependent calendar constraints still apply."
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             required: [semesters, revision]
 *             properties:
 *               revision: { type: string }
 *               semesters:
 *                 type: array
 *                 minItems: 3
 *                 maxItems: 3
 *                 items:
 *                   type: object
 *                   additionalProperties: false
 *                   required: [term, startDate, endDate]
 *                   properties:
 *                     term: { type: string, enum: [SPRING, SUMMER, FALL] }
 *                     startDate: { type: string, format: date }
 *                     endDate: { type: string, format: date }
 *     responses:
 *       '200': { description: 'All three semesters saved; data contains the new calendar and revision.' }
 *       '400': { description: 'Missing semesters, invalid order or dates.' }
 *       '401': { description: 'Authentication required.' }
 *       '403': { description: 'Role not permitted.' }
 *       '404': { description: 'Academic year not found.' }
 *       '409': { description: 'Overlap, stale revision, dependent data conflict or legacy calendar. Nothing is changed.' }
 */
export const academicCalendarOpenApi = true;
