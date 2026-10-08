/**
 * @swagger
 * {
 *   "components": {
 *     "schemas": {
 *       "ComboWindowCreate": {
 *         "type": "object",
 *         "additionalProperties": false,
 *         "properties": {
 *           "name": {
 *             "type": "string",
 *             "maxLength": 150
 *           },
 *           "phase": {
 *             "type": "string",
 *             "enum": [
 *               "INITIAL",
 *               "CONFIRMATION"
 *             ]
 *           },
 *           "academicPeriodId": {
 *             "type": "integer",
 *             "minimum": 1
 *           },
 *           "ojtSemesterId": {
 *             "type": "integer",
 *             "minimum": 1
 *           },
 *           "initialWindowId": {
 *             "type": "integer",
 *             "minimum": 1,
 *             "nullable": true
 *           },
 *           "scope": {
 *             "type": "object",
 *             "additionalProperties": false,
 *             "properties": {
 *               "cohortIds": {
 *                 "type": "array",
 *                 "items": {
 *                   "type": "integer",
 *                   "minimum": 1
 *                 },
 *                 "maxItems": 1000,
 *                 "uniqueItems": true
 *               },
 *               "groupCodes": {
 *                 "type": "array",
 *                 "items": {
 *                   "type": "string",
 *                   "enum": [
 *                     "A",
 *                     "B",
 *                     "C",
 *                     "D"
 *                   ]
 *                 },
 *                 "minItems": 1,
 *                 "maxItems": 4,
 *                 "uniqueItems": true
 *               },
 *               "majorIds": {
 *                 "type": "array",
 *                 "items": {
 *                   "type": "integer",
 *                   "minimum": 1
 *                 },
 *                 "maxItems": 1000,
 *                 "uniqueItems": true
 *               },
 *               "studentIds": {
 *                 "type": "array",
 *                 "items": {
 *                   "type": "integer",
 *                   "minimum": 1
 *                 },
 *                 "maxItems": 1000,
 *                 "uniqueItems": true
 *               }
 *             },
 *             "required": [
 *               "cohortIds",
 *               "groupCodes",
 *               "majorIds"
 *             ]
 *           },
 *           "startsAt": {
 *             "type": "string",
 *             "format": "date-time",
 *             "example": "2026-10-09T08:00:00+07:00"
 *           },
 *           "endsAt": {
 *             "type": "string",
 *             "format": "date-time",
 *             "example": "2026-10-09T08:00:00+07:00"
 *           }
 *         },
 *         "required": [
 *           "name",
 *           "phase",
 *           "academicPeriodId",
 *           "ojtSemesterId",
 *           "scope",
 *           "startsAt",
 *           "endsAt"
 *         ]
 *       },
 *       "ComboWindowPatch": {
 *         "type": "object",
 *         "additionalProperties": false,
 *         "properties": {
 *           "name": {
 *             "type": "string",
 *             "maxLength": 150
 *           },
 *           "phase": {
 *             "type": "string",
 *             "enum": [
 *               "INITIAL",
 *               "CONFIRMATION"
 *             ]
 *           },
 *           "academicPeriodId": {
 *             "type": "integer",
 *             "minimum": 1
 *           },
 *           "ojtSemesterId": {
 *             "type": "integer",
 *             "minimum": 1
 *           },
 *           "initialWindowId": {
 *             "type": "integer",
 *             "minimum": 1,
 *             "nullable": true
 *           },
 *           "scope": {
 *             "type": "object",
 *             "additionalProperties": false,
 *             "properties": {
 *               "cohortIds": {
 *                 "type": "array",
 *                 "items": {
 *                   "type": "integer",
 *                   "minimum": 1
 *                 },
 *                 "maxItems": 1000,
 *                 "uniqueItems": true
 *               },
 *               "groupCodes": {
 *                 "type": "array",
 *                 "items": {
 *                   "type": "string",
 *                   "enum": [
 *                     "A",
 *                     "B",
 *                     "C",
 *                     "D"
 *                   ]
 *                 },
 *                 "minItems": 1,
 *                 "maxItems": 4,
 *                 "uniqueItems": true
 *               },
 *               "majorIds": {
 *                 "type": "array",
 *                 "items": {
 *                   "type": "integer",
 *                   "minimum": 1
 *                 },
 *                 "maxItems": 1000,
 *                 "uniqueItems": true
 *               },
 *               "studentIds": {
 *                 "type": "array",
 *                 "items": {
 *                   "type": "integer",
 *                   "minimum": 1
 *                 },
 *                 "maxItems": 1000,
 *                 "uniqueItems": true
 *               }
 *             },
 *             "required": [
 *               "cohortIds",
 *               "groupCodes",
 *               "majorIds"
 *             ]
 *           },
 *           "startsAt": {
 *             "type": "string",
 *             "format": "date-time",
 *             "example": "2026-10-09T08:00:00+07:00"
 *           },
 *           "endsAt": {
 *             "type": "string",
 *             "format": "date-time",
 *             "example": "2026-10-09T08:00:00+07:00"
 *           }
 *         },
 *         "required": []
 *       },
 *       "ComboWindowAction": {
 *         "type": "object",
 *         "additionalProperties": false,
 *         "properties": {
 *           "reason": {
 *             "type": "string",
 *             "maxLength": 2000
 *           }
 *         },
 *         "required": [
 *           "reason"
 *         ]
 *       },
 *       "ComboWindowExtension": {
 *         "type": "object",
 *         "additionalProperties": false,
 *         "properties": {
 *           "studentIds": {
 *             "type": "array",
 *             "items": {
 *               "type": "integer",
 *               "minimum": 1
 *             },
 *             "maxItems": 1000,
 *             "uniqueItems": true,
 *             "minItems": 1
 *           },
 *           "endsAt": {
 *             "type": "string",
 *             "format": "date-time",
 *             "example": "2026-10-09T08:00:00+07:00"
 *           },
 *           "reason": {
 *             "type": "string",
 *             "maxLength": 2000
 *           }
 *         },
 *         "required": [
 *           "studentIds",
 *           "endsAt",
 *           "reason"
 *         ]
 *       },
 *       "ComboWindowReminder": {
 *         "type": "object",
 *         "additionalProperties": false,
 *         "properties": {
 *           "idempotencyKey": {
 *             "type": "string",
 *             "maxLength": 100
 *           },
 *           "studentIds": {
 *             "type": "array",
 *             "items": {
 *               "type": "integer",
 *               "minimum": 1
 *             },
 *             "maxItems": 1000,
 *             "uniqueItems": true
 *           },
 *           "target": {
 *             "type": "string",
 *             "enum": [
 *               "MISSING",
 *               "ALL"
 *             ],
 *             "default": "MISSING"
 *           },
 *           "reason": {
 *             "type": "string",
 *             "maxLength": 2000
 *           }
 *         },
 *         "required": [
 *           "idempotencyKey",
 *           "reason"
 *         ]
 *       },
 *       "ComboWindowFinalize": {
 *         "type": "object",
 *         "additionalProperties": false,
 *         "properties": {
 *           "idempotencyKey": {
 *             "type": "string",
 *             "maxLength": 100
 *           },
 *           "reason": {
 *             "type": "string",
 *             "maxLength": 2000
 *           },
 *           "allowUnselected": {
 *             "type": "boolean",
 *             "default": false
 *           },
 *           "excludeStudentIds": {
 *             "type": "array",
 *             "items": {
 *               "type": "integer",
 *               "minimum": 1
 *             },
 *             "maxItems": 1000,
 *             "uniqueItems": true
 *           }
 *         },
 *         "required": [
 *           "idempotencyKey",
 *           "reason"
 *         ]
 *       },
 *       "ComboWindowSelection": {
 *         "type": "object",
 *         "additionalProperties": false,
 *         "properties": {
 *           "studentId": {
 *             "type": "integer",
 *             "minimum": 1
 *           },
 *           "comboId": {
 *             "type": "integer",
 *             "minimum": 1
 *           },
 *           "courseIds": {
 *             "type": "array",
 *             "items": {
 *               "type": "integer",
 *               "minimum": 1
 *             },
 *             "maxItems": 500,
 *             "uniqueItems": true
 *           },
 *           "reason": {
 *             "type": "string",
 *             "maxLength": 2000
 *           }
 *         },
 *         "required": [
 *           "comboId",
 *           "courseIds"
 *         ]
 *       }
 *     }
 *   },
 *   "paths": {
 *     "/api/combo-registration-windows": {
 *       "get": {
 *         "tags": [
 *           "Combo registration"
 *         ],
 *         "summary": "List managed combo registration windows",
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
 *             "name": "phase",
 *             "in": "query",
 *             "schema": {
 *               "type": "string",
 *               "enum": [
 *                 "INITIAL",
 *                 "CONFIRMATION"
 *               ]
 *             }
 *           },
 *           {
 *             "name": "status",
 *             "in": "query",
 *             "schema": {
 *               "type": "string",
 *               "enum": [
 *                 "DRAFT",
 *                 "OPEN",
 *                 "CLOSED",
 *                 "FINALIZED"
 *               ]
 *             }
 *           },
 *           {
 *             "name": "academicPeriodId",
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
 *           "201": {
 *             "description": "Created"
 *           },
 *           "400": {
 *             "description": "Invalid scope, deadline or choice group"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "Role, ownership or frozen scope denied"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Window state, expired deadline, overlap, missing choices or changed placement conflict"
 *           }
 *         }
 *       },
 *       "post": {
 *         "tags": [
 *           "Combo registration"
 *         ],
 *         "summary": "Create initial semester-4 or final confirmation window",
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
 *           "201": {
 *             "description": "Created"
 *           },
 *           "400": {
 *             "description": "Invalid scope, deadline or choice group"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "Role, ownership or frozen scope denied"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Window state, expired deadline, overlap, missing choices or changed placement conflict"
 *           }
 *         },
 *         "requestBody": {
 *           "required": true,
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "$ref": "#/components/schemas/ComboWindowCreate"
 *               }
 *             }
 *           }
 *         }
 *       }
 *     },
 *     "/api/combo-registration-windows/{id}": {
 *       "patch": {
 *         "tags": [
 *           "Combo registration"
 *         ],
 *         "summary": "Edit draft scope and base deadlines",
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
 *           "201": {
 *             "description": "Created"
 *           },
 *           "400": {
 *             "description": "Invalid scope, deadline or choice group"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "Role, ownership or frozen scope denied"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Window state, expired deadline, overlap, missing choices or changed placement conflict"
 *           }
 *         },
 *         "requestBody": {
 *           "required": true,
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "$ref": "#/components/schemas/ComboWindowPatch"
 *               }
 *             }
 *           }
 *         }
 *       }
 *     },
 *     "/api/combo-registration-windows/{id}/open": {
 *       "post": {
 *         "tags": [
 *           "Combo registration"
 *         ],
 *         "summary": "Freeze/reuse actual semester-4 roster and open",
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
 *           "201": {
 *             "description": "Created"
 *           },
 *           "400": {
 *             "description": "Invalid scope, deadline or choice group"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "Role, ownership or frozen scope denied"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Window state, expired deadline, overlap, missing choices or changed placement conflict"
 *           }
 *         },
 *         "requestBody": {
 *           "required": true,
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "$ref": "#/components/schemas/ComboWindowAction"
 *               }
 *             }
 *           }
 *         }
 *       }
 *     },
 *     "/api/combo-registration-windows/{id}/close": {
 *       "post": {
 *         "tags": [
 *           "Combo registration"
 *         ],
 *         "summary": "Close window and cancel queued reminders",
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
 *           "201": {
 *             "description": "Created"
 *           },
 *           "400": {
 *             "description": "Invalid scope, deadline or choice group"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "Role, ownership or frozen scope denied"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Window state, expired deadline, overlap, missing choices or changed placement conflict"
 *           }
 *         },
 *         "requestBody": {
 *           "required": true,
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "$ref": "#/components/schemas/ComboWindowAction"
 *               }
 *             }
 *           }
 *         }
 *       }
 *     },
 *     "/api/combo-registration-windows/{id}/extensions": {
 *       "post": {
 *         "tags": [
 *           "Combo registration"
 *         ],
 *         "summary": "Extend only explicitly listed roster students with reason",
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
 *           "201": {
 *             "description": "Created"
 *           },
 *           "400": {
 *             "description": "Invalid scope, deadline or choice group"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "Role, ownership or frozen scope denied"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Window state, expired deadline, overlap, missing choices or changed placement conflict"
 *           }
 *         },
 *         "requestBody": {
 *           "required": true,
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "$ref": "#/components/schemas/ComboWindowExtension"
 *               }
 *             }
 *           }
 *         }
 *       }
 *     },
 *     "/api/combo-registration-windows/{id}/selections": {
 *       "get": {
 *         "tags": [
 *           "Combo registration"
 *         ],
 *         "summary": "Track submitted/missing/applied/unselected students",
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
 *             "name": "status",
 *             "in": "query",
 *             "schema": {
 *               "type": "string",
 *               "enum": [
 *                 "SUBMITTED",
 *                 "MISSING",
 *                 "APPLIED",
 *                 "UNSELECTED"
 *               ]
 *             }
 *           }
 *         ],
 *         "responses": {
 *           "200": {
 *             "description": "Success"
 *           },
 *           "201": {
 *             "description": "Created"
 *           },
 *           "400": {
 *             "description": "Invalid scope, deadline or choice group"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "Role, ownership or frozen scope denied"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Window state, expired deadline, overlap, missing choices or changed placement conflict"
 *           }
 *         }
 *       },
 *       "post": {
 *         "tags": [
 *           "Combo registration"
 *         ],
 *         "summary": "Student submits own choice; staff may submit on behalf with reason",
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
 *           "201": {
 *             "description": "Created",
 *             "content": {
 *               "application/json": {
 *                 "schema": {
 *                   "type": "object",
 *                   "properties": {
 *                     "success": {
 *                       "type": "boolean"
 *                     },
 *                     "data": {
 *                       "type": "object",
 *                       "properties": {
 *                         "eventId": {
 *                           "type": "integer"
 *                         },
 *                         "choice": {
 *                           "type": "object"
 *                         },
 *                         "preview": {
 *                           "type": "object",
 *                           "properties": {
 *                             "isPreview": {
 *                               "type": "boolean",
 *                               "enum": [
 *                                 true
 *                               ]
 *                             },
 *                             "current": {
 *                               "type": "object"
 *                             },
 *                             "proposed": {
 *                               "type": "object"
 *                             },
 *                             "eligibility": {
 *                               "type": "object"
 *                             },
 *                             "missingRequiredCourses": {
 *                               "type": "array",
 *                               "items": {
 *                                 "type": "object"
 *                               }
 *                             },
 *                             "earnedCreditDelta": {
 *                               "type": "number"
 *                             }
 *                           }
 *                         }
 *                       }
 *                     }
 *                   }
 *                 }
 *               }
 *             }
 *           },
 *           "400": {
 *             "description": "Invalid scope, deadline or choice group"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "Role, ownership or frozen scope denied"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Window state, expired deadline, overlap, missing choices or changed placement conflict"
 *           }
 *         },
 *         "requestBody": {
 *           "required": true,
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "$ref": "#/components/schemas/ComboWindowSelection"
 *               }
 *             }
 *           }
 *         },
 *         "description": "Includes preview of proposed progress and eligibility. Official choice remains unchanged until finalize."
 *       }
 *     },
 *     "/api/combo-registration-windows/{id}/reminders": {
 *       "post": {
 *         "tags": [
 *           "Combo registration"
 *         ],
 *         "summary": "Queue encrypted reminder email and in-app notification idempotently",
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
 *           "201": {
 *             "description": "Created"
 *           },
 *           "400": {
 *             "description": "Invalid scope, deadline or choice group"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "Role, ownership or frozen scope denied"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Window state, expired deadline, overlap, missing choices or changed placement conflict"
 *           }
 *         },
 *         "requestBody": {
 *           "required": true,
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "$ref": "#/components/schemas/ComboWindowReminder"
 *               }
 *             }
 *           }
 *         }
 *       }
 *     },
 *     "/api/students/{id}/combo-selections": {
 *       "get": {
 *         "tags": [
 *           "Combo registration"
 *         ],
 *         "summary": "Read initial/final/revision history and progress/OJT recalculation snapshots (staff or own student)",
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
 *           }
 *         ],
 *         "responses": {
 *           "200": {
 *             "description": "Success"
 *           },
 *           "201": {
 *             "description": "Created"
 *           },
 *           "400": {
 *             "description": "Invalid scope, deadline or choice group"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "Role, ownership or frozen scope denied"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Window state, expired deadline, overlap, missing choices or changed placement conflict"
 *           }
 *         }
 *       }
 *     },
 *     "/api/combo-registration-windows/{id}/finalize": {
 *       "post": {
 *         "tags": [
 *           "Combo registration"
 *         ],
 *         "summary": "Apply confirmed choices atomically, preserve history, recalculate credits/GPA/OJT",
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
 *           "201": {
 *             "description": "Created"
 *           },
 *           "400": {
 *             "description": "Invalid scope, deadline or choice group"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "Role, ownership or frozen scope denied"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Window state, expired deadline, overlap, missing choices or changed placement conflict"
 *           }
 *         },
 *         "requestBody": {
 *           "required": true,
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "$ref": "#/components/schemas/ComboWindowFinalize"
 *               }
 *             }
 *           }
 *         }
 *       }
 *     }
 *   }
 * }
 */
export const comboRegistrationApiDocumentation=true;
