/**
 * @swagger
 * {
 *   "paths": {
 *     "/api/companies": {
 *       "get": {
 *         "tags": [
 *           "QHDN core"
 *         ],
 *         "summary": "List companies",
 *         "description": "Roles: ADMIN / OJT_COORD. ENTERPRISE uses the dedicated Enterprise APIs. All writes require reason and are audited.",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "in": "query",
 *             "name": "page",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "limit",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "maximum": 100
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "search",
 *             "required": false,
 *             "schema": {
 *               "type": "string",
 *               "maxLength": 100
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "status",
 *             "required": false,
 *             "schema": {
 *               "type": "string",
 *               "enum": [
 *                 "ACTIVE",
 *                 "INACTIVE"
 *               ]
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "companyId",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             },
 *             "description": "Lọc một hồ sơ; kết quả kèm lịch sử phân trang."
 *           },
 *           {
 *             "in": "query",
 *             "name": "historyPage",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "default": 1
 *             },
 *             "description": "Phân trang lịch sử khi lọc theo ID."
 *           },
 *           {
 *             "in": "query",
 *             "name": "historyLimit",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "maximum": 100,
 *               "default": 20
 *             },
 *             "description": "Phân trang lịch sử khi lọc theo ID."
 *           }
 *         ],
 *         "responses": {
 *           "200": {
 *             "description": "Success: {success:true,data:...}",
 *             "content": {
 *               "application/json": {
 *                 "schema": {
 *                   "type": "object",
 *                   "properties": {
 *                     "success": {
 *                       "type": "boolean"
 *                     },
 *                     "data": {
 *                       "type": "object"
 *                     }
 *                   }
 *                 }
 *               }
 *             }
 *           },
 *           "400": {
 *             "description": "Invalid body/query"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "Role or enterprise scope denied"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Duplicate, invalid workflow transition, full capacity or confirmed result lock"
 *           }
 *         }
 *       },
 *       "post": {
 *         "tags": [
 *           "QHDN core"
 *         ],
 *         "summary": "Create enterprise partner",
 *         "description": "Roles: ADMIN / OJT_COORD. Enterprise scope is derived from EnterpriseUsers, never from client input. All writes require reason and are audited.",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [],
 *         "responses": {
 *           "201": {
 *             "description": "Success: {success:true,data:...}",
 *             "content": {
 *               "application/json": {
 *                 "schema": {
 *                   "type": "object",
 *                   "properties": {
 *                     "success": {
 *                       "type": "boolean"
 *                     },
 *                     "data": {
 *                       "type": "object"
 *                     }
 *                   }
 *                 }
 *               }
 *             }
 *           },
 *           "400": {
 *             "description": "Invalid body/query"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "Role or enterprise scope denied"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Duplicate, invalid workflow transition, full capacity or confirmed result lock"
 *           }
 *         },
 *         "requestBody": {
 *           "required": true,
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "type": "object",
 *                 "additionalProperties": false,
 *                 "properties": {
 *                   "code": {
 *                     "type": "string",
 *                     "maxLength": 20
 *                   },
 *                   "name": {
 *                     "type": "string",
 *                     "maxLength": 200
 *                   },
 *                   "address": {
 *                     "type": "string",
 *                     "maxLength": 300,
 *                     "nullable": true
 *                   },
 *                   "industry": {
 *                     "type": "string",
 *                     "maxLength": 100,
 *                     "nullable": true
 *                   },
 *                   "contactPersonName": {
 *                     "type": "string",
 *                     "maxLength": 100,
 *                     "nullable": true
 *                   },
 *                   "contactPhone": {
 *                     "type": "string",
 *                     "maxLength": 20,
 *                     "nullable": true
 *                   },
 *                   "contactEmail": {
 *                     "type": "string",
 *                     "maxLength": 100,
 *                     "nullable": true,
 *                     "format": "email"
 *                   },
 *                   "status": {
 *                     "type": "string",
 *                     "enum": [
 *                       "ACTIVE",
 *                       "INACTIVE"
 *                     ]
 *                   },
 *                   "reason": {
 *                     "type": "string",
 *                     "maxLength": 2000
 *                   }
 *                 },
 *                 "required": [
 *                   "code",
 *                   "name",
 *                   "reason"
 *                 ]
 *               }
 *             }
 *           }
 *         }
 *       }
 *     },
 *     "/api/companies/{id}": {
 *       "patch": {
 *         "tags": [
 *           "QHDN core"
 *         ],
 *         "summary": "Update enterprise partner",
 *         "description": "Roles: ADMIN / OJT_COORD. Enterprise scope is derived from EnterpriseUsers, never from client input. All writes require reason and are audited.",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "in": "path",
 *             "name": "id",
 *             "required": true,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           }
 *         ],
 *         "responses": {
 *           "200": {
 *             "description": "Success: {success:true,data:...}",
 *             "content": {
 *               "application/json": {
 *                 "schema": {
 *                   "type": "object",
 *                   "properties": {
 *                     "success": {
 *                       "type": "boolean"
 *                     },
 *                     "data": {
 *                       "type": "object"
 *                     }
 *                   }
 *                 }
 *               }
 *             }
 *           },
 *           "400": {
 *             "description": "Invalid body/query"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "Role or enterprise scope denied"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Duplicate, invalid workflow transition, full capacity or confirmed result lock"
 *           }
 *         },
 *         "requestBody": {
 *           "required": true,
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "type": "object",
 *                 "additionalProperties": false,
 *                 "properties": {
 *                   "code": {
 *                     "type": "string",
 *                     "maxLength": 20
 *                   },
 *                   "name": {
 *                     "type": "string",
 *                     "maxLength": 200
 *                   },
 *                   "address": {
 *                     "type": "string",
 *                     "maxLength": 300,
 *                     "nullable": true
 *                   },
 *                   "industry": {
 *                     "type": "string",
 *                     "maxLength": 100,
 *                     "nullable": true
 *                   },
 *                   "contactPersonName": {
 *                     "type": "string",
 *                     "maxLength": 100,
 *                     "nullable": true
 *                   },
 *                   "contactPhone": {
 *                     "type": "string",
 *                     "maxLength": 20,
 *                     "nullable": true
 *                   },
 *                   "contactEmail": {
 *                     "type": "string",
 *                     "maxLength": 100,
 *                     "nullable": true,
 *                     "format": "email"
 *                   },
 *                   "status": {
 *                     "type": "string",
 *                     "enum": [
 *                       "ACTIVE",
 *                       "INACTIVE"
 *                     ]
 *                   },
 *                   "reason": {
 *                     "type": "string",
 *                     "maxLength": 2000
 *                   }
 *                 },
 *                 "required": [
 *                   "reason"
 *                 ]
 *               }
 *             }
 *           }
 *         }
 *       }
 *     },
 *     "/api/positions": {
 *       "get": {
 *         "tags": [
 *           "QHDN core"
 *         ],
 *         "summary": "List positions",
 *         "description": "Roles: ADMIN / OJT_COORD. ENTERPRISE uses the dedicated Enterprise APIs. All writes require reason and are audited.",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "in": "query",
 *             "name": "page",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "limit",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "maximum": 100
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "search",
 *             "required": false,
 *             "schema": {
 *               "type": "string",
 *               "maxLength": 100
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "status",
 *             "required": false,
 *             "schema": {
 *               "type": "string",
 *               "enum": [
 *                 "OPEN",
 *                 "CLOSED"
 *               ]
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "companyId",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "ojtSemesterId",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "positionId",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             },
 *             "description": "Lọc một hồ sơ; kết quả kèm lịch sử phân trang."
 *           },
 *           {
 *             "in": "query",
 *             "name": "historyPage",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "default": 1
 *             },
 *             "description": "Phân trang lịch sử khi lọc theo ID."
 *           },
 *           {
 *             "in": "query",
 *             "name": "historyLimit",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "maximum": 100,
 *               "default": 20
 *             },
 *             "description": "Phân trang lịch sử khi lọc theo ID."
 *           }
 *         ],
 *         "responses": {
 *           "200": {
 *             "description": "Success: {success:true,data:...}",
 *             "content": {
 *               "application/json": {
 *                 "schema": {
 *                   "type": "object",
 *                   "properties": {
 *                     "success": {
 *                       "type": "boolean"
 *                     },
 *                     "data": {
 *                       "type": "object"
 *                     }
 *                   }
 *                 }
 *               }
 *             }
 *           },
 *           "400": {
 *             "description": "Invalid body/query"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "Role or enterprise scope denied"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Duplicate, invalid workflow transition, full capacity or confirmed result lock"
 *           }
 *         }
 *       }
 *     },
 *     "/api/ojt-coordinations": {
 *       "get": {
 *         "tags": [
 *           "QHDN core"
 *         ],
 *         "summary": "List ojt-coordinations",
 *         "description": "Roles: ADMIN / OJT_COORD. ENTERPRISE uses the dedicated Enterprise APIs. All writes require reason and are audited.",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "in": "query",
 *             "name": "page",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "limit",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "maximum": 100
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "search",
 *             "required": false,
 *             "schema": {
 *               "type": "string",
 *               "maxLength": 100
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "status",
 *             "required": false,
 *             "schema": {
 *               "type": "string",
 *               "enum": [
 *                 "PENDING",
 *                 "ACCEPTED",
 *                 "REJECTED"
 *               ]
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "companyId",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "ojtSemesterId",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "studentId",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "positionId",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "registrationId",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "decision",
 *             "required": false,
 *             "schema": {
 *               "type": "string",
 *               "enum": [
 *                 "PENDING",
 *                 "ACCEPTED",
 *                 "REJECTED"
 *               ]
 *             }
 *           }
 *         ],
 *         "responses": {
 *           "200": {
 *             "description": "Success: {success:true,data:...}",
 *             "content": {
 *               "application/json": {
 *                 "schema": {
 *                   "type": "object",
 *                   "properties": {
 *                     "success": {
 *                       "type": "boolean"
 *                     },
 *                     "data": {
 *                       "type": "object"
 *                     }
 *                   }
 *                 }
 *               }
 *             }
 *           },
 *           "400": {
 *             "description": "Invalid body/query"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "Role or enterprise scope denied"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Duplicate, invalid workflow transition, full capacity or confirmed result lock"
 *           }
 *         }
 *       },
 *       "post": {
 *         "tags": [
 *           "QHDN core"
 *         ],
 *         "summary": "Send a handed-off registration to an enterprise",
 *         "description": "Roles: ADMIN / OJT_COORD. Enterprise scope is derived from EnterpriseUsers, never from client input. All writes require reason and are audited.",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [],
 *         "responses": {
 *           "201": {
 *             "description": "Success: {success:true,data:...}",
 *             "content": {
 *               "application/json": {
 *                 "schema": {
 *                   "type": "object",
 *                   "properties": {
 *                     "success": {
 *                       "type": "boolean"
 *                     },
 *                     "data": {
 *                       "type": "object"
 *                     }
 *                   }
 *                 }
 *               }
 *             }
 *           },
 *           "400": {
 *             "description": "Invalid body/query"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "Role or enterprise scope denied"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Duplicate, invalid workflow transition, full capacity or confirmed result lock"
 *           }
 *         },
 *         "requestBody": {
 *           "required": true,
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "type": "object",
 *                 "additionalProperties": false,
 *                 "properties": {
 *                   "registrationId": {
 *                     "type": "integer",
 *                     "minimum": 1
 *                   },
 *                   "positionId": {
 *                     "type": "integer",
 *                     "minimum": 1
 *                   },
 *                   "reason": {
 *                     "type": "string",
 *                     "maxLength": 2000
 *                   },
 *                   "idempotencyKey": {
 *                     "type": "string",
 *                     "maxLength": 100
 *                   }
 *                 },
 *                 "required": [
 *                   "registrationId",
 *                   "positionId",
 *                   "reason",
 *                   "idempotencyKey"
 *                 ]
 *               }
 *             }
 *           }
 *         }
 *       }
 *     },
 *     "/api/ojt-coordinations/{id}": {
 *       "get": {
 *         "tags": [
 *           "QHDN core"
 *         ],
 *         "summary": "Detail ojt-coordinations with audit history",
 *         "description": "Roles: ADMIN / OJT_COORD. ENTERPRISE uses the dedicated Enterprise APIs. All writes require reason and are audited.",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "in": "path",
 *             "name": "id",
 *             "required": true,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           }
 *         ],
 *         "responses": {
 *           "200": {
 *             "description": "Success: {success:true,data:...}",
 *             "content": {
 *               "application/json": {
 *                 "schema": {
 *                   "type": "object",
 *                   "properties": {
 *                     "success": {
 *                       "type": "boolean"
 *                     },
 *                     "data": {
 *                       "type": "object"
 *                     }
 *                   }
 *                 }
 *               }
 *             }
 *           },
 *           "400": {
 *             "description": "Invalid body/query"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "Role or enterprise scope denied"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Duplicate, invalid workflow transition, full capacity or confirmed result lock"
 *           }
 *         }
 *       }
 *     },
 *     "/api/assignments": {
 *       "get": {
 *         "tags": [
 *           "QHDN core"
 *         ],
 *         "summary": "List assignments",
 *         "description": "Roles: ADMIN / OJT_COORD. ENTERPRISE uses the dedicated Enterprise APIs. All writes require reason and are audited.",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "in": "query",
 *             "name": "page",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "limit",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "maximum": 100
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "search",
 *             "required": false,
 *             "schema": {
 *               "type": "string",
 *               "maxLength": 100
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "status",
 *             "required": false,
 *             "schema": {
 *               "type": "string",
 *               "enum": [
 *                 "ASSIGNED",
 *                 "ACTIVE",
 *                 "IN_PROGRESS",
 *                 "COMPLETED",
 *                 "CANCELLED",
 *                 "CANCELED",
 *                 "FAILED"
 *               ]
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "companyId",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "ojtSemesterId",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "studentId",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "positionId",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "assignmentId",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             },
 *             "description": "Lọc một hồ sơ; kết quả kèm lịch sử phân trang."
 *           },
 *           {
 *             "in": "query",
 *             "name": "historyPage",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "default": 1
 *             },
 *             "description": "Phân trang lịch sử khi lọc theo ID."
 *           },
 *           {
 *             "in": "query",
 *             "name": "historyLimit",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "maximum": 100,
 *               "default": 20
 *             },
 *             "description": "Phân trang lịch sử khi lọc theo ID."
 *           }
 *         ],
 *         "responses": {
 *           "200": {
 *             "description": "Success: {success:true,data:...}",
 *             "content": {
 *               "application/json": {
 *                 "schema": {
 *                   "type": "object",
 *                   "properties": {
 *                     "success": {
 *                       "type": "boolean"
 *                     },
 *                     "data": {
 *                       "type": "object"
 *                     }
 *                   }
 *                 }
 *               }
 *             }
 *           },
 *           "400": {
 *             "description": "Invalid body/query"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "Role or enterprise scope denied"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Duplicate, invalid workflow transition, full capacity or confirmed result lock"
 *           }
 *         }
 *       },
 *       "post": {
 *         "tags": [
 *           "QHDN core"
 *         ],
 *         "summary": "Create official assignment from an accepted coordination",
 *         "description": "Roles: ADMIN / OJT_COORD. Enterprise scope is derived from EnterpriseUsers, never from client input. All writes require reason and are audited.",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [],
 *         "responses": {
 *           "201": {
 *             "description": "Success: {success:true,data:...}",
 *             "content": {
 *               "application/json": {
 *                 "schema": {
 *                   "type": "object",
 *                   "properties": {
 *                     "success": {
 *                       "type": "boolean"
 *                     },
 *                     "data": {
 *                       "type": "object"
 *                     }
 *                   }
 *                 }
 *               }
 *             }
 *           },
 *           "400": {
 *             "description": "Invalid body/query"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "Role or enterprise scope denied"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Duplicate, invalid workflow transition, full capacity or confirmed result lock"
 *           }
 *         },
 *         "requestBody": {
 *           "required": true,
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "type": "object",
 *                 "additionalProperties": false,
 *                 "properties": {
 *                   "coordinationId": {
 *                     "type": "integer",
 *                     "minimum": 1
 *                   },
 *                   "enterpriseSupervisorName": {
 *                     "type": "string",
 *                     "maxLength": 100,
 *                     "nullable": true
 *                   },
 *                   "startDate": {
 *                     "type": "string",
 *                     "format": "date"
 *                   },
 *                   "endDate": {
 *                     "type": "string",
 *                     "format": "date"
 *                   },
 *                   "reason": {
 *                     "type": "string",
 *                     "maxLength": 2000
 *                   }
 *                 },
 *                 "required": [
 *                   "coordinationId",
 *                   "startDate",
 *                   "endDate",
 *                   "reason"
 *                 ]
 *               }
 *             }
 *           }
 *         }
 *       }
 *     },
 *     "/api/assignments/{id}": {
 *       "patch": {
 *         "tags": [
 *           "QHDN core"
 *         ],
 *         "summary": "Update supervisor or internship dates",
 *         "description": "Roles: ADMIN / OJT_COORD. Enterprise scope is derived from EnterpriseUsers, never from client input. All writes require reason and are audited.",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "in": "path",
 *             "name": "id",
 *             "required": true,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           }
 *         ],
 *         "responses": {
 *           "200": {
 *             "description": "Success: {success:true,data:...}",
 *             "content": {
 *               "application/json": {
 *                 "schema": {
 *                   "type": "object",
 *                   "properties": {
 *                     "success": {
 *                       "type": "boolean"
 *                     },
 *                     "data": {
 *                       "type": "object"
 *                     }
 *                   }
 *                 }
 *               }
 *             }
 *           },
 *           "400": {
 *             "description": "Invalid body/query"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "Role or enterprise scope denied"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Duplicate, invalid workflow transition, full capacity or confirmed result lock"
 *           }
 *         },
 *         "requestBody": {
 *           "required": true,
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "type": "object",
 *                 "additionalProperties": false,
 *                 "properties": {
 *                   "enterpriseSupervisorName": {
 *                     "type": "string",
 *                     "maxLength": 100,
 *                     "nullable": true
 *                   },
 *                   "startDate": {
 *                     "type": "string",
 *                     "format": "date"
 *                   },
 *                   "endDate": {
 *                     "type": "string",
 *                     "format": "date"
 *                   },
 *                   "reason": {
 *                     "type": "string",
 *                     "maxLength": 2000
 *                   }
 *                 },
 *                 "required": [
 *                   "reason"
 *                 ]
 *               }
 *             }
 *           }
 *         }
 *       }
 *     },
 *     "/api/internship-evaluations": {
 *       "get": {
 *         "tags": [
 *           "QHDN core"
 *         ],
 *         "summary": "List internship-evaluations",
 *         "description": "ADMIN / OJT_COORD: hợp đồng đọc đánh giá thống nhất, giữ templateId, scoreDetails và bộ lọc. Chi tiết có audit.",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "in": "query",
 *             "name": "page",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "limit",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1,
 *               "maximum": 100
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "search",
 *             "required": false,
 *             "schema": {
 *               "type": "string",
 *               "maxLength": 100
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "status",
 *             "required": false,
 *             "schema": {
 *               "type": "string",
 *               "maxLength": 20
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "companyId",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "ojtSemesterId",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "studentId",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "positionId",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "assignmentId",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           },
 *           {
 *             "in": "query",
 *             "name": "templateId",
 *             "required": false,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           }
 *         ],
 *         "responses": {
 *           "200": {
 *             "description": "Success: {success:true,data:...}",
 *             "content": {
 *               "application/json": {
 *                 "schema": {
 *                   "type": "object",
 *                   "properties": {
 *                     "success": {
 *                       "type": "boolean"
 *                     },
 *                     "data": {
 *                       "type": "object"
 *                     }
 *                   }
 *                 }
 *               }
 *             }
 *           },
 *           "400": {
 *             "description": "Invalid body/query"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "Role or enterprise scope denied"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Duplicate, invalid workflow transition, full capacity or confirmed result lock"
 *           }
 *         }
 *       }
 *     },
 *     "/api/internship-evaluations/{id}": {
 *       "get": {
 *         "tags": [
 *           "QHDN core"
 *         ],
 *         "summary": "Detail internship-evaluations with audit history",
 *         "description": "Roles: ADMIN / OJT_COORD. ENTERPRISE uses the dedicated Enterprise APIs. All writes require reason and are audited.",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "in": "path",
 *             "name": "id",
 *             "required": true,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           }
 *         ],
 *         "responses": {
 *           "200": {
 *             "description": "Success: {success:true,data:...}",
 *             "content": {
 *               "application/json": {
 *                 "schema": {
 *                   "type": "object",
 *                   "properties": {
 *                     "success": {
 *                       "type": "boolean"
 *                     },
 *                     "data": {
 *                       "type": "object"
 *                     }
 *                   }
 *                 }
 *               }
 *             }
 *           },
 *           "400": {
 *             "description": "Invalid body/query"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "Role or enterprise scope denied"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Duplicate, invalid workflow transition, full capacity or confirmed result lock"
 *           }
 *         }
 *       }
 *     },
 *     "/api/ojt-coordinations/{id}/decision": {
 *       "post": {
 *         "tags": [
 *           "QHDN core"
 *         ],
 *         "summary": "Enterprise accepts or rejects its latest coordination",
 *         "description": "Roles: ADMIN / OJT_COORD may enter on behalf with audit. ENTERPRISE uses the dedicated Enterprise APIs. All writes require reason and are audited.",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "in": "path",
 *             "name": "id",
 *             "required": true,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           }
 *         ],
 *         "responses": {
 *           "200": {
 *             "description": "Success: {success:true,data:...}",
 *             "content": {
 *               "application/json": {
 *                 "schema": {
 *                   "type": "object",
 *                   "properties": {
 *                     "success": {
 *                       "type": "boolean"
 *                     },
 *                     "data": {
 *                       "type": "object"
 *                     }
 *                   }
 *                 }
 *               }
 *             }
 *           },
 *           "400": {
 *             "description": "Invalid body/query"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "Role or enterprise scope denied"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Duplicate, invalid workflow transition, full capacity or confirmed result lock"
 *           }
 *         },
 *         "requestBody": {
 *           "required": true,
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "type": "object",
 *                 "additionalProperties": false,
 *                 "properties": {
 *                   "decision": {
 *                     "type": "string",
 *                     "enum": [
 *                       "ACCEPTED",
 *                       "REJECTED"
 *                     ]
 *                   },
 *                   "reason": {
 *                     "type": "string",
 *                     "maxLength": 2000
 *                   }
 *                 },
 *                 "required": [
 *                   "decision",
 *                   "reason"
 *                 ]
 *               }
 *             }
 *           }
 *         }
 *       }
 *     },
 *     "/api/ojt-coordinations/{id}/reassign": {
 *       "post": {
 *         "tags": [
 *           "QHDN core"
 *         ],
 *         "summary": "Reassign a rejected latest coordination to another position",
 *         "description": "Roles: ADMIN / OJT_COORD. Enterprise scope is derived from EnterpriseUsers, never from client input. All writes require reason and are audited.",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "in": "path",
 *             "name": "id",
 *             "required": true,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           }
 *         ],
 *         "responses": {
 *           "201": {
 *             "description": "Success: {success:true,data:...}",
 *             "content": {
 *               "application/json": {
 *                 "schema": {
 *                   "type": "object",
 *                   "properties": {
 *                     "success": {
 *                       "type": "boolean"
 *                     },
 *                     "data": {
 *                       "type": "object"
 *                     }
 *                   }
 *                 }
 *               }
 *             }
 *           },
 *           "400": {
 *             "description": "Invalid body/query"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "Role or enterprise scope denied"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Duplicate, invalid workflow transition, full capacity or confirmed result lock"
 *           }
 *         },
 *         "requestBody": {
 *           "required": true,
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "type": "object",
 *                 "additionalProperties": false,
 *                 "properties": {
 *                   "positionId": {
 *                     "type": "integer",
 *                     "minimum": 1
 *                   },
 *                   "reason": {
 *                     "type": "string",
 *                     "maxLength": 2000
 *                   },
 *                   "idempotencyKey": {
 *                     "type": "string",
 *                     "maxLength": 100
 *                   }
 *                 },
 *                 "required": [
 *                   "positionId",
 *                   "reason",
 *                   "idempotencyKey"
 *                 ]
 *               }
 *             }
 *           }
 *         }
 *       }
 *     },
 *     "/api/assignments/{id}/status": {
 *       "patch": {
 *         "tags": [
 *           "QHDN core"
 *         ],
 *         "summary": "Start, complete or cancel assignment",
 *         "description": "Roles: ADMIN / OJT_COORD. Enterprise scope is derived from EnterpriseUsers, never from client input. All writes require reason and are audited.",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "in": "path",
 *             "name": "id",
 *             "required": true,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           }
 *         ],
 *         "responses": {
 *           "200": {
 *             "description": "Success: {success:true,data:...}",
 *             "content": {
 *               "application/json": {
 *                 "schema": {
 *                   "type": "object",
 *                   "properties": {
 *                     "success": {
 *                       "type": "boolean"
 *                     },
 *                     "data": {
 *                       "type": "object"
 *                     }
 *                   }
 *                 }
 *               }
 *             }
 *           },
 *           "400": {
 *             "description": "Invalid body/query"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "Role or enterprise scope denied"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Duplicate, invalid workflow transition, full capacity or confirmed result lock"
 *           }
 *         },
 *         "requestBody": {
 *           "required": true,
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "type": "object",
 *                 "additionalProperties": false,
 *                 "properties": {
 *                   "status": {
 *                     "type": "string",
 *                     "enum": [
 *                       "ACTIVE",
 *                       "COMPLETED",
 *                       "CANCELLED"
 *                     ]
 *                   },
 *                   "reason": {
 *                     "type": "string",
 *                     "maxLength": 2000
 *                   }
 *                 },
 *                 "required": [
 *                   "status",
 *                   "reason"
 *                 ]
 *               }
 *             }
 *           }
 *         }
 *       }
 *     },
 *     "/api/assignments/{id}/internship-evaluation": {
 *       "put": {
 *         "tags": [
 *           "QHDN core"
 *         ],
 *         "summary": "Submit or update the enterprise internship evaluation",
 *         "description": "Roles: ADMIN / OJT_COORD may enter on behalf with audit. ENTERPRISE uses the dedicated Enterprise APIs. All writes require reason and are audited.",
 *         "security": [
 *           {
 *             "bearerAuth": []
 *           }
 *         ],
 *         "parameters": [
 *           {
 *             "in": "path",
 *             "name": "id",
 *             "required": true,
 *             "schema": {
 *               "type": "integer",
 *               "minimum": 1
 *             }
 *           }
 *         ],
 *         "responses": {
 *           "200": {
 *             "description": "Success: {success:true,data:...}",
 *             "content": {
 *               "application/json": {
 *                 "schema": {
 *                   "type": "object",
 *                   "properties": {
 *                     "success": {
 *                       "type": "boolean"
 *                     },
 *                     "data": {
 *                       "type": "object"
 *                     }
 *                   }
 *                 }
 *               }
 *             }
 *           },
 *           "400": {
 *             "description": "Invalid body/query"
 *           },
 *           "401": {
 *             "description": "Authentication required"
 *           },
 *           "403": {
 *             "description": "Role or enterprise scope denied"
 *           },
 *           "404": {
 *             "description": "Record not found"
 *           },
 *           "409": {
 *             "description": "Duplicate, invalid workflow transition, full capacity or confirmed result lock"
 *           }
 *         },
 *         "requestBody": {
 *           "required": true,
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "type": "object",
 *                 "additionalProperties": false,
 *                 "properties": {
 *                   "completionScore": {
 *                     "type": "number",
 *                     "minimum": 0,
 *                     "maximum": 10,
 *                     "multipleOf": 0.01
 *                   },
 *                   "attitudeScore": {
 *                     "type": "number",
 *                     "minimum": 0,
 *                     "maximum": 10,
 *                     "multipleOf": 0.01
 *                   },
 *                   "skillScore": {
 *                     "type": "number",
 *                     "minimum": 0,
 *                     "maximum": 10,
 *                     "multipleOf": 0.01
 *                   },
 *                   "overallScore": {
 *                     "type": "number",
 *                     "minimum": 0,
 *                     "maximum": 10,
 *                     "multipleOf": 0.01
 *                   },
 *                   "comments": {
 *                     "type": "string",
 *                     "maxLength": 5000,
 *                     "nullable": true
 *                   },
 *                   "reason": {
 *                     "type": "string",
 *                     "maxLength": 2000
 *                   }
 *                 },
 *                 "required": [
 *                   "completionScore",
 *                   "attitudeScore",
 *                   "skillScore",
 *                   "overallScore",
 *                   "reason"
 *                 ]
 *               }
 *             }
 *           }
 *         }
 *       }
 *     }
 *   }
 * }
 */
export const qhdnOpenApi = true;
