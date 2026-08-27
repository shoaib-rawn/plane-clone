# MiniPlane REST API Reference Documentation 📡

This document provides a comprehensive, production-grade guide to all endpoints, request payloads, query parameters, schemas, authentication tiers, and response structures in the MiniPlane server application.

---

## 🌐 Global Specifications

### Base URL
All API requests must be directed to:
```text
http://localhost:5000/api/v1
```

### Authentication
Protected routes require a JSON Web Token (JWT) sent in the HTTP `Authorization` request header:
```http
Authorization: Bearer <your_jwt_token>
```
*Tokens are generated during user registration or login, and are valid for `7d` by default.*

### Rate Limiting
To prevent brute-force attacks and bot spam, IP-based rate limiting is enforced on critical auth paths:
- **Scope**: `POST /auth/login` and `POST /auth/register`
- **Limit**: Max **10 requests** per **15-minute** window per IP.
- **Excess Response**: HTTP `429 Too Many Requests`.

### Consistent Error Shape
MiniPlane returns standardized error payloads matching the specification (Appendix C).
```json
{
  "error": {
    "code": "ERROR_CODE_STRING",
    "message": "Human readable description of the error."
  }
}
```

#### Standard Error Codes:
- `VALIDATION_ERROR` (HTTP 422): Payload failed Zod validation filters.
- `UNAUTHORIZED` (HTTP 401): Missing, invalid, or expired JWT credentials.
- `FORBIDDEN` (HTTP 403): User lacks sufficient project/workspace privileges.
- `NOT_FOUND` (HTTP 404): Resource does not exist, or private project is hidden (404 Hide Override).
- `CONFLICT` (HTTP 409): Unique constraint violation (e.g. email already registered).
- `RATE_LIMITED` (HTTP 429): Request volume cap exceeded.
- `INTERNAL_ERROR` (HTTP 500): Unexpected server failure.

---

## 🔑 1. Authentication Endpoints

### 1.1 Register User
Creates a new user account, assigns the user to the default workspace (`acme`) as a standard `MEMBER`, and returns a signed JWT token.
- **Method & Path**: `POST /auth/register`
- **Authentication Required**: No (subject to Rate Limiting)
- **Request Body (JSON)**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!",
    "displayName": "User Name"
  }
  ```
  *Validation: `email` must be a valid format, `password` must be $\ge 8$ characters, `displayName` must be $1 \text{ to } 100$ characters.*
- **Success Response (HTTP 201 Created)**:
  ```json
  {
    "data": {
      "user": {
        "id": "4a450e4e-99de-45ca-b361-b10cdaeabac6",
        "email": "user@example.com",
        "displayName": "User Name",
        "avatarUrl": null,
        "role": "MEMBER",
        "createdAt": "2026-08-27T01:48:59.000Z",
        "updatedAt": "2026-08-27T01:48:59.000Z"
      },
      "workspaceRole": "MEMBER",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
- **Error Response (HTTP 409 Conflict)**:
  ```json
  {
    "error": {
      "code": "EMAIL_TAKEN",
      "message": "An account with this email already exists"
    }
  }
  ```

---

### 1.2 Login User
Authenticates credentials and returns a signed JWT token along with the user's active workspace role.
- **Method & Path**: `POST /auth/login`
- **Authentication Required**: No (subject to Rate Limiting)
- **Request Body (JSON)**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```
- **Success Response (HTTP 200 OK)**:
  ```json
  {
    "data": {
      "user": {
        "id": "4a450e4e-99de-45ca-b361-b10cdaeabac6",
        "email": "user@example.com",
        "displayName": "User Name",
        "avatarUrl": null,
        "role": "MEMBER",
        "createdAt": "2026-08-27T01:48:59.000Z",
        "updatedAt": "2026-08-27T01:48:59.000Z"
      },
      "workspaceRole": "MEMBER",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
- **Error Response (HTTP 401 Unauthorized)**:
  ```json
  {
    "error": {
      "code": "INVALID_CREDENTIALS",
      "message": "Invalid email or password"
    }
  }
  ```

---

### 1.3 Get Current User Session
Returns details of the currently authenticated session user.
- **Method & Path**: `GET /auth/me`
- **Authentication Required**: Yes
- **Success Response (HTTP 200 OK)**:
  ```json
  {
    "data": {
      "user": {
        "id": "4a450e4e-99de-45ca-b361-b10cdaeabac6",
        "email": "user@example.com",
        "displayName": "User Name",
        "avatarUrl": null,
        "role": "MEMBER",
        "createdAt": "2026-08-27T01:48:59.000Z",
        "updatedAt": "2026-08-27T01:48:59.000Z"
      },
      "workspaceRole": "MEMBER"
    }
  }
  ```

---

### 1.4 Request Password Reset Link
Generates a signed, 1-hour secure password reset token and dispatches it via Mailtrap SMTP.
- **Method & Path**: `POST /auth/forgot-password`
- **Authentication Required**: No
- **Request Body (JSON)**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Success Response (HTTP 200 OK - Identical for valid/invalid emails to prevent User Enumeration)**:
  ```json
  {
    "data": {
      "message": "If an account with that email exists, a password reset link has been sent to your inbox."
    }
  }
  ```

---

### 1.5 Reset Password
Verifies the token sent in the Mailtrap email link and updates the user's password.
- **Method & Path**: `POST /auth/reset-password`
- **Authentication Required**: No
- **Request Body (JSON)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "password": "NewSecurePassword123!"
  }
  ```
- **Success Response (HTTP 200 OK)**:
  ```json
  {
    "data": {
      "message": "Password reset successfully. You may now log in with your new password."
    }
  }
  ```
- **Error Response (HTTP 400 Bad Request)**:
  ```json
  {
    "error": {
      "code": "INVALID_RESET_TOKEN",
      "message": "Invalid or expired password reset token"
    }
  }
  ```

---

## 👥 2. User Management Endpoints

### 2.1 Update My Profile
Updates the display name or avatar URL of the currently logged-in user.
- **Method & Path**: `PATCH /users/me`
- **Authentication Required**: Yes
- **Request Body (JSON)**:
  ```json
  {
    "displayName": "Updated Name",
    "avatarUrl": "https://example.com/avatar.png"
  }
  ```
  *Validation: `displayName` cannot be empty, `avatarUrl` must be a valid URL format.*
- **Success Response (HTTP 200 OK)**:
  ```json
  {
    "data": {
      "id": "4a450e4e-99de-45ca-b361-b10cdaeabac6",
      "email": "user@example.com",
      "displayName": "Updated Name",
      "avatarUrl": "https://example.com/avatar.png",
      "role": "MEMBER",
      "createdAt": "2026-08-27T01:48:59.000Z",
      "updatedAt": "2026-08-27T02:05:00.000Z"
    }
  }
  ```

---

### 2.2 List All Registered Users
Returns a complete directory list of all users in the system (useful for assignees).
- **Method & Path**: `GET /users`
- **Authentication Required**: Yes
- **Success Response (HTTP 200 OK)**:
  ```json
  {
    "data": [
      {
        "id": "4a450e4e-99de-45ca-b361-b10cdaeabac6",
        "email": "user@example.com",
        "displayName": "Updated Name",
        "avatarUrl": "https://example.com/avatar.png",
        "role": "MEMBER"
      }
    ]
  }
  ```

---

## 🏢 3. Project Management Endpoints

### 3.1 List Accessible Projects
Lists all projects accessible to the logged-in user, including their membership role and counts of open/done issues.
- **Method & Path**: `GET /projects`
- **Authentication Required**: Yes
- **Success Response (HTTP 200 OK)**:
  ```json
  {
    "data": [
      {
        "id": "1b5ca249-e526-454b-8322-2625ac115ab9",
        "name": "Website Redesign",
        "key": "WEB",
        "description": "Marketing site rebuild for Q2",
        "myRole": "ADMIN",
        "openIssuesCount": 3,
        "doneIssuesCount": 12,
        "archivedAt": null
      }
    ]
  }
  ```

---

### 3.2 Create Project
Creates a new project, initializes its 5 default issue states, and sets the creator as project `ADMIN`.
- **Method & Path**: `POST /projects`
- **Authentication Required**: Yes (Workspace ADMIN or Member)
- **Request Body (JSON)**:
  ```json
  {
    "name": "Mobile Client",
    "key": "MOB",
    "description": "React Native project"
  }
  ```
  *Validation: `key` must contain only alphanumeric characters, min 2, max 10, converted to uppercase.*
- **Success Response (HTTP 201 Created)**:
  ```json
  {
    "data": {
      "id": "2b6da35a-f637-567c-9433-3736bd226ac0",
      "name": "Mobile Client",
      "key": "MOB",
      "description": "React Native project",
      "workspaceId": "0d7f5249-e526-454b-8322-2625ac115ab9",
      "defaultStateId": "3c7fa46b-873c-4dbc-8743-d0fd6d8ea312",
      "archivedAt": null,
      "deletedAt": null
    }
  }
  ```

---

### 3.3 Get Project Details
Fetches metadata, active states, and status of a single project.
- **Method & Path**: `GET /projects/:projectId`
- **Authentication Required**: Yes (requires Project `VIEWER` or above)
- **Success Response (HTTP 200 OK)**:
  ```json
  {
    "data": {
      "id": "2b6da35a-f637-567c-9433-3736bd226ac0",
      "name": "Mobile Client",
      "key": "MOB",
      "description": "React Native project",
      "defaultStateId": "3c7fa46b-873c-4dbc-8743-d0fd6d8ea312",
      "states": [
        {
          "id": "3c7fa46b-873c-4dbc-8743-d0fd6d8ea312",
          "name": "Backlog",
          "group": "backlog",
          "colour": "#64748b",
          "position": 10
        }
      ]
    }
  }
  ```

---

### 3.4 Update Project Settings
Modifies the name, description, or default state of an existing project.
- **Method & Path**: `PATCH /projects/:projectId`
- **Authentication Required**: Yes (requires Project `ADMIN`)
- **Request Body (JSON)**:
  ```json
  {
    "name": "Updated Mobile App Name",
    "description": "Updated project scope description",
    "defaultStateId": "4d8fa57c-974d-5ecd-9854-e1fd7e9fa423"
  }
  ```
- **Success Response (HTTP 200 OK)**:
  ```json
  {
    "data": {
      "id": "2b6da35a-f637-567c-9433-3736bd226ac0",
      "name": "Updated Mobile App Name",
      "description": "Updated project scope description",
      "defaultStateId": "4d8fa57c-974d-5ecd-9854-e1fd7e9fa423"
    }
  }
  ```

---

### 3.5 Archive Project
Marks a project as archived (read-only mode).
- **Method & Path**: `POST /projects/:projectId/archive`
- **Authentication Required**: Yes (requires Project `ADMIN`)
- **Success Response (HTTP 200 OK)**:
  ```json
  {
    "data": {
      "id": "2b6da35a-f637-567c-9433-3736bd226ac0",
      "name": "Updated Mobile App Name",
      "archivedAt": "2026-08-27T02:10:00.000Z"
    }
  }
  ```

---

### 3.6 Unarchive Project
Restores an archived project to active, modifiable state.
- **Method & Path**: `POST /projects/:projectId/unarchive`
- **Authentication Required**: Yes (requires Project `ADMIN`)
- **Success Response (HTTP 200 OK)**:
  ```json
  {
    "data": {
      "id": "2b6da35a-f637-567c-9433-3736bd226ac0",
      "name": "Updated Mobile App Name",
      "archivedAt": null
    }
  }
  ```

---

### 3.7 Soft-Delete Project
Soft-deletes a project by setting its `deletedAt` timestamp. All nested issues and states remain in database but are excluded from list/read operations.
- **Method & Path**: `DELETE /projects/:projectId`
- **Authentication Required**: Yes (requires Project `ADMIN`)
- **Success Response (HTTP 200 OK)**:
  ```json
  {
    "data": {
      "message": "Project was successfully deleted."
    }
  }
  ```

---

## 👥 4. Project Member Management Endpoints

### 4.1 List Project Members
Lists all members assigned to the project along with their roles.
- **Method & Path**: `GET /projects/:projectId/members`
- **Authentication Required**: Yes (requires Project `VIEWER` or above)
- **Success Response (HTTP 200 OK)**:
  ```json
  {
    "data": [
      {
        "id": "5e9fa68d-a85e-6fde-9965-f2fd8fa9b434",
        "role": "ADMIN",
        "joinedAt": "2026-08-27T01:48:59.000Z",
        "user": {
          "id": "4a450e4e-99de-45ca-b361-b10cdaeabac6",
          "email": "admin@miniplane.test",
          "displayName": "Admin User",
          "avatarUrl": null
        }
      }
    ]
  }
  ```

---

### 4.2 Add Member to Project
Adds a workspace user to the project, or restores them with a new role if previously soft-deleted.
- **Method & Path**: `POST /projects/:projectId/members`
- **Authentication Required**: Yes (requires Project `ADMIN`)
- **Request Body (JSON)**:
  ```json
  {
    "userId": "cbc4ce9b-bd28-49ad-be7d-2cb3e74099d7",
    "role": "MEMBER"
  }
  ```
  *Validation: `role` must be either `ADMIN`, `MEMBER`, or `VIEWER`.*
- **Success Response (HTTP 201 Created)**:
  ```json
  {
    "data": {
      "id": "6f0fa79e-b96f-7fef-0a76-a3fe9faac545",
      "projectId": "2b6da35a-f637-567c-9433-3736bd226ac0",
      "userId": "cbc4ce9b-bd28-49ad-be7d-2cb3e74099d7",
      "role": "MEMBER",
      "joinedAt": "2026-08-27T02:12:00.000Z",
      "deletedAt": null
    }
  }
  ```

---

### 4.3 Update Member Role
Modifies the project role of an active member.
- **Method & Path**: `PATCH /projects/:projectId/members`
- **Authentication Required**: Yes (requires Project `ADMIN`)
- **Request Body (JSON)**:
  ```json
  {
    "userId": "cbc4ce9b-bd28-49ad-be7d-2cb3e74099d7",
    "role": "VIEWER"
  }
  ```
- **Success Response (HTTP 200 OK)**:
  ```json
  {
    "data": {
      "id": "6f0fa79e-b96f-7fef-0a76-a3fe9faac545",
      "role": "VIEWER"
    }
  }
  ```

---

### 4.4 Remove Member from Project
Soft-deletes a member from the project by setting `deletedAt`.
- **Method & Path**: `DELETE /projects/:projectId/members`
- **Authentication Required**: Yes (requires Project `ADMIN`)
- **Request Body (JSON)**:
  ```json
  {
    "userId": "cbc4ce9b-bd28-49ad-be7d-2cb3e74099d7"
  }
  ```
- **Success Response (HTTP 200 OK)**:
  ```json
  {
    "data": {
      "message": "Member was successfully removed from project."
    }
  }
  ```

---

## 🎫 5. Issues & Tickets Endpoints

### 5.1 List Project Tickets
Lists tickets in a project. Supports filtering, sorting, and Kanban state grouping.
- **Method & Path**: `GET /projects/:projectId/issues`
- **Authentication Required**: Yes (requires Project `VIEWER` or above)
- **Request Query Parameters**:
  - `stateId` (UUID) — Filter by specific issue state.
  - `priority` (`URGENT`/`HIGH`/`MEDIUM`/`LOW`/`NONE`) — Filter by priority.
  - `assigneeId` (UUID) — Filter by assignee.
  - `groupBy` (`state`) — Groups tickets into columns for Kanban board rendering.
  - `orderBy` (`createdAt`/`sequenceId`/`priority`/`dueDate`) — Default is `sequenceId`.
  - `order` (`asc`/`desc`) — Default is `desc`.
- **Success Response (HTTP 200 OK - Flat View)**:
  ```json
  {
    "data": [
      {
        "id": "7g1fa80f-c07a-8fef-1b87-b4feafaad656",
        "key": "MOB-1",
        "sequenceId": 1,
        "title": "Setup dynamic push assets",
        "description": "Integrate SQLite native background sync",
        "priority": "HIGH",
        "dueDate": "2026-09-01T00:00:00.000Z",
        "completedAt": null,
        "assignee": {
          "id": "cbc4ce9b-bd28-49ad-be7d-2cb3e74099d7",
          "displayName": "saeed",
          "email": "saeed206@gmail.com",
          "avatarUrl": null
        },
        "state": {
          "id": "3c7fa46b-873c-4dbc-8743-d0fd6d8ea312",
          "name": "Backlog",
          "group": "backlog"
        }
      }
    ]
  }
  ```
- **Success Response (HTTP 200 OK - Grouped Kanban View `groupBy=state`)**:
  ```json
  {
    "data": {
      "Backlog": [
        {
          "id": "7g1fa80f-c07a-8fef-1b87-b4feafaad656",
          "key": "MOB-1",
          "title": "Setup dynamic push assets",
          "state": { "name": "Backlog", "group": "backlog" }
        }
      ],
      "Todo": []
    }
  }
  ```

---

### 5.2 Create Ticket
Creates a new ticket under the project and atomically increments the project's sequence counter.
- **Method & Path**: `POST /projects/:projectId/issues`
- **Authentication Required**: Yes (requires Project `MEMBER` or above)
- **Request Body (JSON)**:
  ```json
  {
    "title": "Configure splash screen assets",
    "description": "Upload high-res splash mockups to assets directory",
    "stateId": "3c7fa46b-873c-4dbc-8743-d0fd6d8ea312",
    "priority": "MEDIUM",
    "assigneeId": "cbc4ce9b-bd28-49ad-be7d-2cb3e74099d7",
    "dueDate": "2026-08-30"
  }
  ```
- **Success Response (HTTP 201 Created)**:
  ```json
  {
    "data": {
      "id": "8h2fa91f-d18a-9fef-2c98-c5febfaae767",
      "key": "MOB-2",
      "sequenceId": 2,
      "title": "Configure splash screen assets",
      "description": "Upload high-res splash mockups to assets directory",
      "priority": "MEDIUM",
      "assigneeId": "cbc4ce9b-bd28-49ad-be7d-2cb3e74099d7",
      "createdById": "4a450e4e-99de-45ca-b361-b10cdaeabac6",
      "dueDate": "2026-08-30T00:00:00.000Z",
      "completedAt": null
    }
  }
  ```

---

### 5.3 Get Single Ticket Details
Fetches comprehensive data of a single ticket, including discussion comments, activity logs, and assignee relations.
- **Method & Path**: `GET /issues/:issueId`
- **Authentication Required**: Yes (requires Project `VIEWER` or above)
- **Success Response (HTTP 200 OK)**:
  ```json
  {
    "data": {
      "id": "8h2fa91f-d18a-9fef-2c98-c5febfaae767",
      "key": "MOB-2",
      "sequenceId": 2,
      "title": "Configure splash screen assets",
      "description": "Upload high-res splash mockups to assets directory",
      "priority": "MEDIUM",
      "dueDate": "2026-08-30T00:00:00.000Z",
      "completedAt": null,
      "assignee": {
        "id": "cbc4ce9b-bd28-49ad-be7d-2cb3e74099d7",
        "displayName": "saeed",
        "email": "saeed206@gmail.com"
      },
      "state": {
        "id": "3c7fa46b-873c-4dbc-8743-d0fd6d8ea312",
        "name": "Backlog",
        "group": "backlog"
      },
      "project": {
        "id": "2b6da35a-f637-567c-9433-3736bd226ac0",
        "name": "Mobile Client",
        "key": "MOB"
      }
    }
  }
  ```

---

### 5.4 Update Ticket Properties
Modifies ticket details and automatically records differences (old vs new) in the timeline activity logs.
- **Method & Path**: `PATCH /issues/:issueId`
- **Authentication Required**: Yes (requires Project `MEMBER` or above)
- **Request Body (JSON)**:
  ```json
  {
    "title": "Updated Splash Asset Task Title",
    "priority": "HIGH",
    "stateId": "4d8fa57c-974d-5ecd-9854-e1fd7e9fa423"
  }
  ```
  *Note: Moving an issue's state to a `completed` group automatically stamps `completedAt = new Date()`. Moving it out of completed group resets it to `null`.*
- **Success Response (HTTP 200 OK)**:
  ```json
  {
    "data": {
      "id": "8h2fa91f-d18a-9fef-2c98-c5febfaae767",
      "key": "MOB-2",
      "title": "Updated Splash Asset Task Title",
      "priority": "HIGH",
      "stateId": "4d8fa57c-974d-5ecd-9854-e1fd7e9fa423",
      "completedAt": "2026-08-27T02:18:00.000Z"
    }
  }
  ```

---

### 5.5 Soft-Delete Ticket
Enforces soft-deletions by setting `deletedAt` timestamp.
- **Method & Path**: `DELETE /issues/:issueId`
- **Authentication Required**: Yes (requires Project `MEMBER` or above)
- **Success Response (HTTP 200 OK)**:
  ```json
  {
    "data": {
      "message": "Issue was successfully deleted."
    }
  }
  ```

---

### 5.6 List My Assigned Tickets
Lists all open tickets assigned to the logged-in user across all active projects in the workspace.
- **Method & Path**: `GET /me/issues`
- **Authentication Required**: Yes
- **Success Response (HTTP 200 OK)**:
  ```json
  {
    "data": [
      {
        "id": "8h2fa91f-d18a-9fef-2c98-c5febfaae767",
        "key": "MOB-2",
        "title": "Updated Splash Asset Task Title",
        "priority": "HIGH",
        "dueDate": "2026-08-30T00:00:00.000Z",
        "state": {
          "id": "4d8fa57c-974d-5ecd-9854-e1fd7e9fa423",
          "name": "Done",
          "group": "completed"
        },
        "project": {
          "id": "2b6da35a-f637-567c-9433-3736bd226ac0",
          "name": "Mobile Client"
        }
      }
    ]
  }
  ```

---

## 💬 6. Discussion Comments Endpoints

### 6.1 List Issue Comments
Retrieves all active discussion comments posted under a ticket.
- **Method & Path**: `GET /issues/:issueId/comments`
- **Authentication Required**: Yes (requires Project `VIEWER` or above)
- **Success Response (HTTP 200 OK)**:
  ```json
  {
    "data": [
      {
        "id": "9i3fa02f-e18b-8fef-3d87-d6feafaad767",
        "body": "This is a threaded development comment.",
        "createdAt": "2026-08-27T02:20:00.000Z",
        "editedAt": null,
        "author": {
          "id": "4a450e4e-99de-45ca-b361-b10cdaeabac6",
          "displayName": "Admin User",
          "avatarUrl": null
        }
      }
    ]
  }
  ```

---

### 6.2 Add Comment to Ticket
Appends a new discussion comment to a ticket.
- **Method & Path**: `POST /issues/:issueId/comments`
- **Authentication Required**: Yes (requires Project `MEMBER` or above)
- **Request Body (JSON)**:
  ```json
  {
    "body": "Double check the webhook signature matching before deploy."
  }
  ```
  *Validation: `body` must be between $1 \text{ and } 5000$ characters.*
- **Success Response (HTTP 201 Created)**:
  ```json
  {
    "data": {
      "id": "0j4fa13f-f29c-9fef-4e98-e7febfaae878",
      "body": "Double check the webhook signature matching before deploy.",
      "createdAt": "2026-08-27T02:21:00.000Z",
      "authorId": "4a450e4e-99de-45ca-b361-b10cdaeabac6"
    }
  }
  ```

---

### 6.3 Update Comment
Modifies the text of an existing comment.
- **Method & Path**: `PATCH /issues/:issueId/comments/:commentId`
- **Authentication Required**: Yes (Only allowed for the comment author)
- **Request Body (JSON)**:
  ```json
  {
    "body": "Updated comment details with corrected deploy link."
  }
  ```
- **Success Response (HTTP 200 OK)**:
  ```json
  {
    "data": {
      "id": "0j4fa13f-f29c-9fef-4e98-e7febfaae878",
      "body": "Updated comment details with corrected deploy link.",
      "editedAt": "2026-08-27T02:22:00.000Z"
    }
  }
  ```

---

### 6.4 Delete Comment
Deletes a comment.
- **Method & Path**: `DELETE /issues/:issueId/comments/:commentId`
- **Authentication Required**: Yes (Allowed for the comment author OR project `ADMIN`)
- **Success Response (HTTP 200 OK)**:
  ```json
  {
    "data": {
      "message": "Comment was successfully deleted."
    }
  }
  ```

---

## 📈 7. Audit Logging & Activities Endpoints

### 7.1 Fetch Ticket Activity History
Returns a chronological timeline of all updates, state transitions, and properties changed on the ticket.
- **Method & Path**: `GET /issues/:issueId/activities`
- **Authentication Required**: Yes (requires Project `VIEWER` or above)
- **Success Response (HTTP 200 OK)**:
  ```json
  {
    "data": [
      {
        "id": "1k5fa24f-039c-afef-5f87-f8febaade989",
        "verb": "updated",
        "field": "stateId",
        "oldValue": "Backlog",
        "newValue": "Done",
        "createdAt": "2026-08-27T02:18:00.000Z",
        "actor": {
          "id": "4a450e4e-99de-45ca-b361-b10cdaeabac6",
          "displayName": "Admin User"
        }
      },
      {
        "id": "2l6fa35f-14ac-bfef-6g98-g9febfaae090",
        "verb": "created",
        "field": null,
        "oldValue": null,
        "newValue": null,
        "createdAt": "2026-08-27T02:12:00.000Z",
        "actor": {
          "id": "4a450e4e-99de-45ca-b361-b10cdaeabac6",
          "displayName": "Admin User"
        }
      }
    ]
  }
  ```
