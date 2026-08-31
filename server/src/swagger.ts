export const swaggerDocument = {
  "openapi": "3.0.0",
  "info": {
    "title": "MiniPlane REST API",
    "version": "1.0.0",
    "description": "Comprehensive, interactive API documentation for MiniPlane - Day 1 to 30 developer project workspace and issue management."
  },
  "servers": [
    {
      "url": "/api/v1",
      "description": "Relative API Path (Dynamic Host/Port)"
    }
  ],
  "components": {
    "securitySchemes": {
      "BearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
        "description": "JWT-based session authentication token. Provide as `Bearer <your_token>` in headers."
      }
    },
    "schemas": {
      "PublicUser": {
        "type": "object",
        "properties": {
          "id": { "type": "string", "format": "uuid" },
          "email": { "type": "string", "format": "email" },
          "displayName": { "type": "string" },
          "avatarUrl": { "type": "string", "nullable": true },
          "role": { "type": "string", "enum": ["ADMIN", "MEMBER"] },
          "createdAt": { "type": "string", "format": "date-time" },
          "updatedAt": { "type": "string", "format": "date-time" }
        }
      },
      "IssueState": {
        "type": "object",
        "properties": {
          "id": { "type": "string", "format": "uuid" },
          "name": { "type": "string" },
          "group": { "type": "string", "enum": ["backlog", "unstarted", "started", "completed", "cancelled"] },
          "colour": { "type": "string" },
          "position": { "type": "integer" }
        }
      },
      "ErrorShape": {
        "type": "object",
        "properties": {
          "error": {
            "type": "object",
            "properties": {
              "code": { "type": "string" },
              "message": { "type": "string" }
            }
          }
        }
      }
    }
  },
  "paths": {
    "/auth/register": {
      "post": {
        "tags": ["Authentication"],
        "summary": "Register User",
        "description": "Creates a new user account, joins them to default 'acme' workspace, and returns token.",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["email", "password", "displayName"],
                "properties": {
                  "email": { "type": "string", "format": "email" },
                  "password": { "type": "string", "minLength": 8 },
                  "displayName": { "type": "string", "minLength": 1, "maxLength": 100 },
                  "role": { "type": "string", "enum": ["ADMIN", "MEMBER"], "default": "MEMBER", "description": "Optional workspace role (defaults to MEMBER)" }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "User created successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "object",
                      "properties": {
                        "user": { "$ref": "#/components/schemas/PublicUser" },
                        "workspaceRole": { "type": "string" },
                        "token": { "type": "string" }
                      }
                    }
                  }
                }
              }
            }
          },
          "409": {
            "description": "Email already exists",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/ErrorShape" }
              }
            }
          }
        }
      }
    },
    "/auth/login": {
      "post": {
        "tags": ["Authentication"],
        "summary": "Login User",
        "description": "Authenticates credentials and returns a JWT session token.",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["email", "password"],
                "properties": {
                  "email": { "type": "string", "format": "email" },
                  "password": { "type": "string" }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Successful login",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "object",
                      "properties": {
                        "user": { "$ref": "#/components/schemas/PublicUser" },
                        "workspaceRole": { "type": "string" },
                        "token": { "type": "string" }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Invalid credentials",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/ErrorShape" }
              }
            }
          }
        }
      }
    },
    "/auth/me": {
      "get": {
        "tags": ["Authentication"],
        "summary": "Get Profile",
        "security": [{ "BearerAuth": [] }],
        "responses": {
          "200": {
            "description": "Current active user session profile",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "object",
                      "properties": {
                        "user": { "$ref": "#/components/schemas/PublicUser" },
                        "workspaceRole": { "type": "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/auth/forgot-password": {
      "post": {
        "tags": ["Authentication"],
        "summary": "Forgot Password",
        "description": "Generates 1-hour secure password reset token and dispatches reset link via Mailtrap SMTP.",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["email"],
                "properties": {
                  "email": { "type": "string", "format": "email" }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Generic response dispatched successfully to prevent user listing leaks",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "object",
                      "properties": {
                        "message": { "type": "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/auth/reset-password": {
      "post": {
        "tags": ["Authentication"],
        "summary": "Reset Password",
        "description": "Verifies valid signed token and updates user password.",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["token", "password"],
                "properties": {
                  "token": { "type": "string" },
                  "password": { "type": "string", "minLength": 8 }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Password reset successful",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "object",
                      "properties": {
                        "message": { "type": "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/users": {
      "get": {
        "tags": ["Users"],
        "summary": "List Users",
        "security": [{ "BearerAuth": [] }],
        "responses": {
          "200": {
            "description": "List of registered users",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "array",
                      "items": { "$ref": "#/components/schemas/PublicUser" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/users/me": {
      "patch": {
        "tags": ["Users"],
        "summary": "Update Profile Settings",
        "security": [{ "BearerAuth": [] }],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "displayName": { "type": "string", "minLength": 1, "maxLength": 100 },
                  "avatarUrl": { "type": "string", "format": "url", "nullable": true }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Profile updated",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "data": { "$ref": "#/components/schemas/PublicUser" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/projects": {
      "get": {
        "tags": ["Projects"],
        "summary": "List Accessible Projects",
        "security": [{ "BearerAuth": [] }],
        "responses": {
          "200": {
            "description": "Projects listing with metadata and ticket counts",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "id": { "type": "string", "format": "uuid" },
                          "name": { "type": "string" },
                          "key": { "type": "string" },
                          "description": { "type": "string", "nullable": true },
                          "myRole": { "type": "string" },
                          "openIssuesCount": { "type": "integer" },
                          "doneIssuesCount": { "type": "integer" },
                          "archivedAt": { "type": "string", "format": "date-time", "nullable": true }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": ["Projects"],
        "summary": "Create Project",
        "security": [{ "BearerAuth": [] }],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["name", "key"],
                "properties": {
                  "name": { "type": "string", "minLength": 1, "maxLength": 100 },
                  "key": { "type": "string", "minLength": 2, "maxLength": 10, "pattern": "^[A-Za-z0-9]+$" },
                  "description": { "type": "string", "maxLength": 500 }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Project created with default columns",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "object",
                      "properties": {
                        "id": { "type": "string", "format": "uuid" },
                        "name": { "type": "string" },
                        "key": { "type": "string" },
                        "description": { "type": "string", "nullable": true }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/projects/{projectId}": {
      "get": {
        "tags": ["Projects"],
        "summary": "Get Project Details",
        "security": [{ "BearerAuth": [] }],
        "parameters": [
          { "name": "projectId", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }
        ],
        "responses": {
          "200": {
            "description": "Project details and states",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "object",
                      "properties": {
                        "id": { "type": "string", "format": "uuid" },
                        "name": { "type": "string" },
                        "key": { "type": "string" },
                        "states": { "type": "array", "items": { "$ref": "#/components/schemas/IssueState" } }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "patch": {
        "tags": ["Projects"],
        "summary": "Update Project Settings",
        "security": [{ "BearerAuth": [] }],
        "parameters": [
          { "name": "projectId", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "name": { "type": "string", "maxLength": 100 },
                  "description": { "type": "string", "maxLength": 500, "nullable": true },
                  "defaultStateId": { "type": "string", "format": "uuid", "nullable": true }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Project updated",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "object",
                      "properties": {
                        "id": { "type": "string", "format": "uuid" },
                        "name": { "type": "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "delete": {
        "tags": ["Projects"],
        "summary": "Soft Delete Project",
        "security": [{ "BearerAuth": [] }],
        "parameters": [
          { "name": "projectId", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }
        ],
        "responses": {
          "200": {
            "description": "Project deleted successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "object",
                      "properties": {
                        "message": { "type": "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/projects/{projectId}/archive": {
      "post": {
        "tags": ["Projects"],
        "summary": "Archive Project",
        "security": [{ "BearerAuth": [] }],
        "parameters": [
          { "name": "projectId", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }
        ],
        "responses": {
          "200": {
            "description": "Project archived successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "object",
                      "properties": {
                        "archivedAt": { "type": "string", "format": "date-time" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/projects/{projectId}/unarchive": {
      "post": {
        "tags": ["Projects"],
        "summary": "Unarchive Project",
        "security": [{ "BearerAuth": [] }],
        "parameters": [
          { "name": "projectId", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }
        ],
        "responses": {
          "200": {
            "description": "Project unarchived successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "object",
                      "properties": {
                        "archivedAt": { "type": "string", "nullable": true }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/projects/{projectId}/members": {
      "get": {
        "tags": ["Project Members"],
        "summary": "List Project Members",
        "security": [{ "BearerAuth": [] }],
        "parameters": [
          { "name": "projectId", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }
        ],
        "responses": {
          "200": {
            "description": "List of members",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "id": { "type": "string", "format": "uuid" },
                          "role": { "type": "string" },
                          "user": { "$ref": "#/components/schemas/PublicUser" }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": ["Project Members"],
        "summary": "Add Member to Project",
        "security": [{ "BearerAuth": [] }],
        "parameters": [
          { "name": "projectId", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["userId", "role"],
                "properties": {
                  "userId": { "type": "string", "format": "uuid" },
                  "role": { "type": "string", "enum": ["ADMIN", "MEMBER", "VIEWER"] }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Member added successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "object",
                      "properties": {
                        "id": { "type": "string", "format": "uuid" },
                        "role": { "type": "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "patch": {
        "tags": ["Project Members"],
        "summary": "Update Member Role",
        "security": [{ "BearerAuth": [] }],
        "parameters": [
          { "name": "projectId", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["userId", "role"],
                "properties": {
                  "userId": { "type": "string", "format": "uuid" },
                  "role": { "type": "string", "enum": ["ADMIN", "MEMBER", "VIEWER"] }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Member updated",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "object",
                      "properties": {
                        "id": { "type": "string", "format": "uuid" },
                        "role": { "type": "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "delete": {
        "tags": ["Project Members"],
        "summary": "Remove Member",
        "security": [{ "BearerAuth": [] }],
        "parameters": [
          { "name": "projectId", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["userId"],
                "properties": {
                  "userId": { "type": "string", "format": "uuid" }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Member removed successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "object",
                      "properties": {
                        "message": { "type": "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/projects/{projectId}/issues": {
      "get": {
        "tags": ["Tickets/Issues"],
        "summary": "List Project Tickets",
        "security": [{ "BearerAuth": [] }],
        "parameters": [
          { "name": "projectId", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } },
          { "name": "stateId", "in": "query", "required": false, "schema": { "type": "string", "format": "uuid" } },
          { "name": "priority", "in": "query", "required": false, "schema": { "type": "string" } },
          { "name": "assigneeId", "in": "query", "required": false, "schema": { "type": "string", "format": "uuid" } },
          { "name": "groupBy", "in": "query", "required": false, "schema": { "type": "string", "enum": ["state"] } },
          { "name": "orderBy", "in": "query", "required": false, "schema": { "type": "string" } },
          { "name": "order", "in": "query", "required": false, "schema": { "type": "string" } }
        ],
        "responses": {
          "200": {
            "description": "Flat issues list or Kanban grouped dictionary list"
          }
        }
      },
      "post": {
        "tags": ["Tickets/Issues"],
        "summary": "Create Ticket",
        "security": [{ "BearerAuth": [] }],
        "parameters": [
          { "name": "projectId", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["title"],
                "properties": {
                  "title": { "type": "string", "minLength": 1, "maxLength": 255 },
                  "description": { "type": "string", "maxLength": 10000, "nullable": true },
                  "stateId": { "type": "string", "format": "uuid" },
                  "priority": { "type": "string", "enum": ["URGENT", "HIGH", "MEDIUM", "LOW", "NONE"] },
                  "assigneeId": { "type": "string", "format": "uuid", "nullable": true },
                  "dueDate": { "type": "string", "format": "date", "nullable": true }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Ticket created atomically",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "object",
                      "properties": {
                        "id": { "type": "string", "format": "uuid" },
                        "key": { "type": "string" },
                        "sequenceId": { "type": "integer" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/issues/{issueId}": {
      "get": {
        "tags": ["Tickets/Issues"],
        "summary": "Get Ticket Details",
        "security": [{ "BearerAuth": [] }],
        "parameters": [
          { "name": "issueId", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }
        ],
        "responses": {
          "200": {
            "description": "Full ticket properties"
          }
        }
      },
      "patch": {
        "tags": ["Tickets/Issues"],
        "summary": "Update Ticket Properties",
        "security": [{ "BearerAuth": [] }],
        "parameters": [
          { "name": "issueId", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "title": { "type": "string", "minLength": 1, "maxLength": 255 },
                  "description": { "type": "string", "maxLength": 10000, "nullable": true },
                  "stateId": { "type": "string", "format": "uuid" },
                  "priority": { "type": "string", "enum": ["URGENT", "HIGH", "MEDIUM", "LOW", "NONE"] },
                  "assigneeId": { "type": "string", "format": "uuid", "nullable": true },
                  "dueDate": { "type": "string", "format": "date", "nullable": true }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Ticket updated"
          }
        }
      },
      "delete": {
        "tags": ["Tickets/Issues"],
        "summary": "Soft Delete Ticket",
        "security": [{ "BearerAuth": [] }],
        "parameters": [
          { "name": "issueId", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }
        ],
        "responses": {
          "200": {
            "description": "Ticket soft deleted"
          }
        }
      }
    },
    "/issues/{issueId}/comments": {
      "get": {
        "tags": ["Comments"],
        "summary": "List Ticket Comments",
        "security": [{ "BearerAuth": [] }],
        "parameters": [
          { "name": "issueId", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }
        ],
        "responses": {
          "200": {
            "description": "Comments list"
          }
        }
      },
      "post": {
        "tags": ["Comments"],
        "summary": "Add Comment to Ticket",
        "security": [{ "BearerAuth": [] }],
        "parameters": [
          { "name": "issueId", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["body"],
                "properties": {
                  "body": { "type": "string", "minLength": 1, "maxLength": 5000 }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Comment created successfully"
          }
        }
      }
    },
    "/issues/{issueId}/comments/{commentId}": {
      "patch": {
        "tags": ["Comments"],
        "summary": "Update Comment",
        "security": [{ "BearerAuth": [] }],
        "parameters": [
          { "name": "issueId", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } },
          { "name": "commentId", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["body"],
                "properties": {
                  "body": { "type": "string", "minLength": 1, "maxLength": 5000 }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Comment text updated"
          }
        }
      },
      "delete": {
        "tags": ["Comments"],
        "summary": "Delete Comment",
        "security": [{ "BearerAuth": [] }],
        "parameters": [
          { "name": "issueId", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } },
          { "name": "commentId", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }
        ],
        "responses": {
          "200": {
            "description": "Comment deleted"
          }
        }
      }
    },
    "/issues/{issueId}/activities": {
      "get": {
        "tags": ["Audit Logs"],
        "summary": "Fetch Ticket Activities",
        "security": [{ "BearerAuth": [] }],
        "parameters": [
          { "name": "issueId", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }
        ],
        "responses": {
          "200": {
            "description": "Chronological audit logs of state transitions and updates"
          }
        }
      }
    },
    "/me/issues": {
      "get": {
        "tags": ["Tickets/Issues"],
        "summary": "List My Assigned Tickets",
        "security": [{ "BearerAuth": [] }],
        "responses": {
          "200": {
            "description": "List of tickets assigned to you"
          }
        }
      }
    }
  }
};
