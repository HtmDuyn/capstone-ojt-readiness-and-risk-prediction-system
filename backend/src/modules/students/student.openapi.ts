/**
 * @swagger
 * {
 *   "components": {
 *     "schemas": {
 *       "CourseResultImport": {
 *         "type": "object",
 *         "additionalProperties": false,
 *         "properties": {
 *           "idempotencyKey": {
 *             "type": "string",
 *             "maxLength": 100
 *           },
 *           "sourceName": {
 *             "type": "string",
 *             "maxLength": 150,
 *             "nullable": true
 *           },
 *           "rows": {
 *             "type": "array",
 *             "minItems": 1,
 *             "maxItems": 1000,
 *             "items": {
 *               "type": "object",
 *               "additionalProperties": false,
 *               "properties": {
 *                 "studentCode": {
 *                   "type": "string",
 *                   "maxLength": 20
 *                 },
 *                 "courseCode": {
 *                   "type": "string",
 *                   "maxLength": 20
 *                 },
 *                 "academicPeriodId": {
 *                   "type": "integer",
 *                   "minimum": 1
 *                 },
 *                 "attemptNumber": {
 *                   "type": "integer",
 *                   "minimum": 1,
 *                   "maximum": 100,
 *                   "default": 1
 *                 },
 *                 "status": {
 *                   "type": "string",
 *                   "enum": [
 *                     "PASSED",
 *                     "FAILED",
 *                     "IN_PROGRESS",
 *                     "WITHDRAWN",
 *                     "RECOGNIZED"
 *                   ]
 *                 },
 *                 "score": {
 *                   "type": "number",
 *                   "minimum": 0,
 *                   "maximum": 10,
 *                   "nullable": true
 *                 },
 *                 "gradePoints": {
 *                   "type": "number",
 *                   "minimum": 0,
 *                   "maximum": 4,
 *                   "nullable": true
 *                 },
 *                 "grade": {
 *                   "type": "string",
 *                   "maxLength": 2,
 *                   "nullable": true
 *                 },
 *                 "sourceReference": {
 *                   "type": "string",
 *                   "maxLength": 200,
 *                   "nullable": true
 *                 }
 *               },
 *               "required": [
 *                 "studentCode",
 *                 "courseCode",
 *                 "academicPeriodId",
 *                 "status"
 *               ]
 *             }
 *           }
 *         },
 *         "required": [
 *           "idempotencyKey",
 *           "rows"
 *         ]
 *       },
 *       "StudentProfilePatch": {
 *         "type": "object",
 *         "additionalProperties": false,
 *         "properties": {
 *           "fullName": {
 *             "type": "string",
 *             "maxLength": 100
 *           },
 *           "phone": {
 *             "type": "string",
 *             "maxLength": 20,
 *             "nullable": true
 *           },
 *           "className": {
 *             "type": "string",
 *             "maxLength": 20,
 *             "nullable": true
 *           },
 *           "status": {
 *             "type": "string",
 *             "enum": [
 *               "ACTIVE",
 *               "INACTIVE",
 *               "SUSPENDED",
 *               "GRADUATED",
 *               "DROPPED_OUT"
 *             ]
 *           },
 *           "programId": {
 *             "type": "integer",
 *             "minimum": 1,
 *             "nullable": true
 *           },
 *           "reason": {
 *             "type": "string",
 *             "maxLength": 2000
 *           }
 *         },
 *         "required": [
 *           "reason"
 *         ]
 *       },
 *       "CourseResultPatch": {
 *         "type": "object",
 *         "additionalProperties": false,
 *         "properties": {
 *           "academicPeriodId": {
 *             "type": "integer",
 *             "minimum": 1
 *           },
 *           "attemptNumber": {
 *             "type": "integer",
 *             "minimum": 1,
 *             "maximum": 100,
 *             "default": 1
 *           },
 *           "status": {
 *             "type": "string",
 *             "enum": [
 *               "PASSED",
 *               "FAILED",
 *               "IN_PROGRESS",
 *               "WITHDRAWN",
 *               "RECOGNIZED"
 *             ]
 *           },
 *           "score": {
 *             "type": "number",
 *             "minimum": 0,
 *             "maximum": 10,
 *             "nullable": true
 *           },
 *           "gradePoints": {
 *             "type": "number",
 *             "minimum": 0,
 *             "maximum": 4,
 *             "nullable": true
 *           },
 *           "grade": {
 *             "type": "string",
 *             "maxLength": 2,
 *             "nullable": true
 *           },
 *           "sourceReference": {
 *             "type": "string",
 *             "maxLength": 200,
 *             "nullable": true
 *           },
 *           "courseId": {
 *             "type": "integer",
 *             "minimum": 1
 *           },
 *           "reason": {
 *             "type": "string",
 *             "maxLength": 2000
 *           }
 *         },
 *         "required": [
 *           "reason"
 *         ]
 *       }
 *     }
 *   },
 *   "paths": {
 *     "/api/students": {
 *       "get": {
 *         "tags": [
 *           "Student academic records"
 *         ],
 *         "summary": "Search and filter students (ADMIN / ACADEMIC)",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "name": "page",
 *             "in": "query",
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "default": 1
 *             }
 *           },
 *           {
 *             "name": "limit",
 *             "in": "query",
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "maximum": 100,
 *               "default": 20
 *             }
 *           },
 *           {
 *             "name": "search",
 *             "in": "query",
 *             "schema": {
 *               "type": "string"
 *             }
 *           },
 *           {
 *             "name": "status",
 *             "in": "query",
 *             "schema": {
 *               "type": "string"
 *             }
 *           },
 *           {
 *             "name": "programId",
 *             "in": "query",
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           },
 *           {
 *             "name": "cohortId",
 *             "in": "query",
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           },
 *           {
 *             "name": "groupCode",
 *             "in": "query",
 *             "schema": {
 *               "type": "string"
 *             }
 *           },
 *           {
 *             "name": "enrollmentYear",
 *             "in": "query",
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           },
 *           {
 *             "name": "currentSemester",
 *             "in": "query",
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           }
 *         ],
 *         "responses": {
 *           "200": {
 *             "description": "Success"
 *           },
 *           "400": {
 *             "description": "Invalid input"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "Role or ownership denied"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Duplicate result or idempotency conflict"
 *           },
 *           "422": {
 *             "description": "Import rejected atomically; inspect data.batchId and row errors"
 *           }
 *         }
 *       }
 *     },
 *     "/api/students/{id}": {
 *       "get": {
 *         "tags": [
 *           "Student academic records"
 *         ],
 *         "summary": "Student profile (staff or own student)",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "name": "id",
 *             "in": "path",
 *             "required": true,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           }
 *         ],
 *         "responses": {
 *           "200": {
 *             "description": "Success"
 *           },
 *           "400": {
 *             "description": "Invalid input"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "Role or ownership denied"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Duplicate result or idempotency conflict"
 *           },
 *           "422": {
 *             "description": "Import rejected atomically; inspect data.batchId and row errors"
 *           }
 *         }
 *       },
 *       "patch": {
 *         "tags": [
 *           "Student academic records"
 *         ],
 *         "summary": "Update academic profile with reason",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "name": "id",
 *             "in": "path",
 *             "required": true,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           }
 *         ],
 *         "responses": {
 *           "200": {
 *             "description": "Success"
 *           },
 *           "400": {
 *             "description": "Invalid input"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "Role or ownership denied"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Duplicate result or idempotency conflict"
 *           },
 *           "422": {
 *             "description": "Import rejected atomically; inspect data.batchId and row errors"
 *           }
 *         },
 *         "requestBody": {
 *           "required": true,
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "$ref": "#/components/schemas/StudentProfilePatch"
 *               }
 *             }
 *           }
 *         }
 *       }
 *     },
 *     "/api/students/{id}/course-results": {
 *       "get": {
 *         "tags": [
 *           "Student academic records"
 *         ],
 *         "summary": "All actual attempts, including Block 3",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "name": "id",
 *             "in": "path",
 *             "required": true,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           },
 *           {
 *             "name": "page",
 *             "in": "query",
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "default": 1
 *             }
 *           },
 *           {
 *             "name": "limit",
 *             "in": "query",
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "maximum": 100,
 *               "default": 20
 *             }
 *           },
 *           {
 *             "name": "courseId",
 *             "in": "query",
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           },
 *           {
 *             "name": "academicPeriodId",
 *             "in": "query",
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           },
 *           {
 *             "name": "status",
 *             "in": "query",
 *             "schema": {
 *               "type": "string",
 *               "enum": [
 *                 "PASSED",
 *                 "FAILED",
 *                 "IN_PROGRESS",
 *                 "WITHDRAWN",
 *                 "RECOGNIZED"
 *               ]
 *             }
 *           }
 *         ],
 *         "responses": {
 *           "200": {
 *             "description": "Success"
 *           },
 *           "400": {
 *             "description": "Invalid input"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "Role or ownership denied"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Duplicate result or idempotency conflict"
 *           },
 *           "422": {
 *             "description": "Import rejected atomically; inspect data.batchId and row errors"
 *           }
 *         }
 *       }
 *     },
 *     "/api/students/{id}/academic-progress": {
 *       "get": {
 *         "tags": [
 *           "Student academic records"
 *         ],
 *         "summary": "Live deduplicated credits and latest-attempt GPA",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "name": "id",
 *             "in": "path",
 *             "required": true,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           }
 *         ],
 *         "responses": {
 *           "200": {
 *             "description": "Success"
 *           },
 *           "400": {
 *             "description": "Invalid input"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "Role or ownership denied"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Duplicate result or idempotency conflict"
 *           },
 *           "422": {
 *             "description": "Import rejected atomically; inspect data.batchId and row errors"
 *           }
 *         }
 *       }
 *     },
 *     "/api/course-results/{id}": {
 *       "patch": {
 *         "tags": [
 *           "Student academic records"
 *         ],
 *         "summary": "Correct result and retain reason in AuditLogs",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "name": "id",
 *             "in": "path",
 *             "required": true,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           }
 *         ],
 *         "responses": {
 *           "200": {
 *             "description": "Success"
 *           },
 *           "400": {
 *             "description": "Invalid input"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "Role or ownership denied"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Duplicate result or idempotency conflict"
 *           },
 *           "422": {
 *             "description": "Import rejected atomically; inspect data.batchId and row errors"
 *           }
 *         },
 *         "requestBody": {
 *           "required": true,
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "$ref": "#/components/schemas/CourseResultPatch"
 *               }
 *             }
 *           }
 *         }
 *       }
 *     },
 *     "/api/course-result-imports/preview": {
 *       "post": {
 *         "tags": [
 *           "Student academic records"
 *         ],
 *         "summary": "Validate rows without writing",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [],
 *         "responses": {
 *           "200": {
 *             "description": "Success"
 *           },
 *           "400": {
 *             "description": "Invalid input"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "Role or ownership denied"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Duplicate result or idempotency conflict"
 *           },
 *           "422": {
 *             "description": "Import rejected atomically; inspect data.batchId and row errors"
 *           }
 *         },
 *         "requestBody": {
 *           "required": true,
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "$ref": "#/components/schemas/CourseResultImport"
 *               }
 *             }
 *           }
 *         }
 *       }
 *     },
 *     "/api/course-result-imports/commit": {
 *       "post": {
 *         "tags": [
 *           "Student academic records"
 *         ],
 *         "summary": "Atomically import results and persist history",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [],
 *         "responses": {
 *           "200": {
 *             "description": "Success"
 *           },
 *           "400": {
 *             "description": "Invalid input"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "Role or ownership denied"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Duplicate result or idempotency conflict"
 *           },
 *           "422": {
 *             "description": "Import rejected atomically; inspect data.batchId and row errors"
 *           }
 *         },
 *         "requestBody": {
 *           "required": true,
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "$ref": "#/components/schemas/CourseResultImport"
 *               }
 *             }
 *           }
 *         }
 *       }
 *     },
 *     "/api/academic-imports": {
 *       "get": {
 *         "tags": [
 *           "Student academic records"
 *         ],
 *         "summary": "Student / result import history",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "name": "page",
 *             "in": "query",
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "default": 1
 *             }
 *           },
 *           {
 *             "name": "limit",
 *             "in": "query",
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "maximum": 100,
 *               "default": 20
 *             }
 *           },
 *           {
 *             "name": "kind",
 *             "in": "query",
 *             "schema": {
 *               "type": "string",
 *               "enum": [
 *                 "STUDENT",
 *                 "COURSE_RESULT",
 *                 "CURRICULUM"
 *               ]
 *             }
 *           },
 *           {
 *             "name": "status",
 *             "in": "query",
 *             "schema": {
 *               "type": "string",
 *               "enum": [
 *                 "COMPLETED",
 *                 "REJECTED",
 *                 "FAILED"
 *               ]
 *             }
 *           }
 *         ],
 *         "responses": {
 *           "200": {
 *             "description": "Success"
 *           },
 *           "400": {
 *             "description": "Invalid input"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "Role or ownership denied"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Duplicate result or idempotency conflict"
 *           },
 *           "422": {
 *             "description": "Import rejected atomically; inspect data.batchId and row errors"
 *           }
 *         }
 *       }
 *     },
 *     "/api/academic-imports/{id}": {
 *       "get": {
 *         "tags": [
 *           "Student academic records"
 *         ],
 *         "summary": "Import row history and errors",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "name": "id",
 *             "in": "path",
 *             "required": true,
 *             "schema": {
 *               "type": "string",
 *               "pattern": "^[1-9][0-9]*$"
 *             }
 *           },
 *           {
 *             "name": "page",
 *             "in": "query",
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "default": 1
 *             }
 *           },
 *           {
 *             "name": "limit",
 *             "in": "query",
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "maximum": 100,
 *               "default": 20
 *             }
 *           }
 *         ],
 *         "responses": {
 *           "200": {
 *             "description": "Success"
 *           },
 *           "400": {
 *             "description": "Invalid input"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "Role or ownership denied"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Duplicate result or idempotency conflict"
 *           },
 *           "422": {
 *             "description": "Import rejected atomically; inspect data.batchId and row errors"
 *           }
 *         }
 *       }
 *     }
 *   }
 * }
 */
export const studentApiDocumentation = true;
