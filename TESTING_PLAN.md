# Task Manager API — Testing Plan
## Phase 2 Final Project

**Base URL:** `https://taskmanager-api.onrender.com` (update after deployment)  
**Swagger UI:** `https://taskmanager-api.onrender.com/api-docs`

---

## Seed Credentials

| Role  | Email                 | Password   |
|-------|-----------------------|------------|
| Admin | admin@example.com     | Admin123!  |
| User  | alice@example.com     | User123!   |
| User  | bob@example.com       | User123!   |

**Seeded IDs (after running seed):**
- Alice's projects: ID **1** (Website Redesign), ID **2** (Mobile App MVP)
- Bob's project: ID **3** (API Integration)
- Tasks: ID **1** (Design new homepage), ID **2** (Fix broken nav links), ID **3** (Set up auth), ID **4** (Integrate Stripe)
- Tags: ID **1** (bug), ID **2** (feature), ID **3** (urgent)

---

## How to Authorize in Swagger UI

1. Call `POST /api/auth/login` with any credentials below → copy the `token` value from the response.
2. Click the **Authorize 🔒** button at the top of the Swagger page.
3. In the **bearerAuth** field, paste the token (do **not** add "Bearer ").
4. Click **Authorize**, then **Close**.

---

## 1. Authentication Endpoints

### POST /api/auth/signup

**Access Control:** Public

**Success Case (201 Created)**
- Click **Try it out**
- Body:
  ```json
  { "email": "newuser@example.com", "password": "Password123!", "name": "New User" }
  ```
- Click **Execute**
- Expected: `201` with a `token` and `user` object (no password field)

**400 Bad Request — Missing fields**
- Remove the `name` field from the body
- Expected: `400` — `"email, password, and name are required"`

**409 Conflict — Duplicate email**
- Use an already-registered email: `alice@example.com`
- Expected: `409` — `"Email already registered"`

---

### POST /api/auth/login

**Access Control:** Public

**Success Case (200 OK)**
- Click **Try it out**
- Body:
  ```json
  { "email": "alice@example.com", "password": "User123!" }
  ```
- Expected: `200` with a valid `token` and `user` object

**400 Bad Request — Missing fields**
- Send body with only `email`, omit `password`
- Expected: `400` — `"email and password are required"`

**401 Unauthorized — Wrong password**
- Body:
  ```json
  { "email": "alice@example.com", "password": "wrongpassword" }
  ```
- Expected: `401` — `"Invalid credentials"`

**401 Unauthorized — Non-existent user**
- Body:
  ```json
  { "email": "nobody@example.com", "password": "User123!" }
  ```
- Expected: `401` — `"Invalid credentials"`

---

## 2. Projects Resource

### POST /api/projects

**Access Control:** Any authenticated user (owner set to logged-in user)

**Setup:** Log in as Alice → copy JWT → Authorize

**Success Case (201 Created)**
- Click **Try it out**
- Body:
  ```json
  { "title": "New Project", "description": "Testing creation", "status": "ACTIVE" }
  ```
- Expected: `201` with the new project object (ownerId = Alice's user ID)

**400 Bad Request — Missing title**
- Body: `{ "description": "No title here" }`
- Expected: `400` — `"title is required"`

**400 Bad Request — Invalid status**
- Body: `{ "title": "Bad Status", "status": "INVALID" }`
- Expected: `400` — `"Invalid status value"`

**401 Unauthorized — No token**
- Remove JWT from Authorize
- Expected: `401` — `"No token provided"`

---

### GET /api/projects

**Access Control:** Authenticated users see only their own projects; admins see all

**Success Case — Regular user (Alice)**
- Log in as Alice → Authorize
- Click **Try it out** → **Execute**
- Expected: `200` — array containing only Alice's projects (IDs 1 and 2)

**Success Case — Admin sees all**
- Log in as admin@example.com → Authorize
- Expected: `200` — array containing all projects (IDs 1, 2, and 3)

**401 Unauthorized — No token**
- Remove JWT → Expected: `401`

---

### GET /api/projects/{id}

**Access Control:** Owner or admin

**Success Case (200 OK)**
- Log in as Alice → Authorize
- Set `id` = **1**
- Expected: `200` — full project object with nested tasks

**400 Bad Request — Invalid ID**
- Set `id` = **-10**
- Expected: `400` — `"ID must be a positive integer"`

**401 Unauthorized**
- Remove JWT, use `id` = **1**
- Expected: `401`

**403 Forbidden — Not the owner**
- Log in as Bob → Authorize
- Set `id` = **1** (Alice's project)
- Expected: `403` — `"Access denied"`

**404 Not Found**
- Set `id` = **9999**
- Expected: `404` — `"Project not found"`

---

### PUT /api/projects/{id}

**Access Control:** Owner or admin

**Setup:** Log in as Alice → Authorize

**Success Case (200 OK)**
- Set `id` = **1**
- Body:
  ```json
  { "title": "Updated Website Redesign", "status": "COMPLETED" }
  ```
- Expected: `200` — updated project object

**400 Bad Request — Invalid ID**
- Set `id` = **0**
- Expected: `400`

**400 Bad Request — Invalid status**
- Body: `{ "status": "NOTVALID" }`
- Expected: `400`

**401 Unauthorized**
- Remove JWT
- Expected: `401`

**403 Forbidden — Not the owner**
- Log in as Bob → Authorize
- Set `id` = **1**
- Expected: `403`

**404 Not Found**
- Set `id` = **9999**
- Expected: `404`

---

### DELETE /api/projects/{id}

**Access Control:** Owner or admin

**Setup:** Log in as Alice → Authorize

**Success Case (200 OK)**
- First create a throwaway project via POST /api/projects, note its ID (e.g., **5**)
- Set `id` = **5**
- Expected: `200` — deleted project object

**401 Unauthorized**
- Remove JWT
- Expected: `401`

**403 Forbidden — Not the owner**
- Log in as Bob → Authorize
- Set `id` = **1** (Alice's project)
- Expected: `403`

**404 Not Found**
- Set `id` = **9999**
- Expected: `404`

---

## 3. Tasks Resource

### POST /api/tasks

**Access Control:** Authenticated user who owns the project

**Setup:** Log in as Alice → Authorize

**Success Case (201 Created)**
- Body:
  ```json
  {
    "title": "New Task",
    "description": "Testing task creation",
    "status": "TODO",
    "priority": "HIGH",
    "projectId": 1,
    "tagIds": [1, 2]
  }
  ```
- Expected: `201` — task object with `tags` array

**400 Bad Request — Missing required fields**
- Body: `{ "description": "No title or project" }`
- Expected: `400` — `"title and projectId are required"`

**400 Bad Request — Invalid status**
- Body: `{ "title": "Bad", "projectId": 1, "status": "INVALID" }`
- Expected: `400`

**401 Unauthorized**
- Remove JWT
- Expected: `401`

**403 Forbidden — Not the project owner**
- Log in as Bob → Authorize
- Body: `{ "title": "Hacker task", "projectId": 1 }` (Alice's project)
- Expected: `403`

**404 Not Found — Project doesn't exist**
- Body: `{ "title": "Orphan", "projectId": 9999 }`
- Expected: `404`

---

### GET /api/tasks

**Access Control:** Authenticated users see tasks from their own projects; admins see all

**Success Case — Alice**
- Log in as Alice → Authorize
- Expected: `200` — tasks from Alice's projects only (IDs 1, 2, 3)

**Success Case — Admin sees all**
- Log in as admin → Authorize
- Expected: `200` — all 4 tasks

**401 Unauthorized**
- Remove JWT → Expected: `401`

---

### GET /api/tasks/{id}

**Access Control:** Owner of the task's project or admin

**Success Case (200 OK)**
- Log in as Alice → Authorize
- Set `id` = **1**
- Expected: `200` — task with `tags` array and nested project info

**400 Bad Request — Invalid ID**
- Set `id` = **-5**
- Expected: `400`

**401 Unauthorized**
- Remove JWT → Expected: `401`

**403 Forbidden — Not the project owner**
- Log in as Bob → Authorize
- Set `id` = **1** (Alice's task)
- Expected: `403`

**404 Not Found**
- Set `id` = **9999**
- Expected: `404`

---

### PUT /api/tasks/{id}

**Access Control:** Owner of the task's project or admin

**Setup:** Log in as Alice → Authorize

**Success Case (200 OK)**
- Set `id` = **1**
- Body:
  ```json
  { "title": "Updated Homepage Design", "status": "DONE", "priority": "LOW", "tagIds": [3] }
  ```
- Expected: `200` — updated task with new tags (only `urgent` tag now)

**400 Bad Request — Invalid priority**
- Body: `{ "priority": "EXTREME" }`
- Expected: `400`

**401 Unauthorized**
- Remove JWT → Expected: `401`

**403 Forbidden**
- Log in as Bob → Authorize, set `id` = **1**
- Expected: `403`

**404 Not Found**
- Set `id` = **9999**
- Expected: `404`

---

### DELETE /api/tasks/{id}

**Access Control:** Owner of the task's project or admin

**Setup:** Log in as Alice → Authorize

**Success Case (200 OK)**
- First create a throwaway task via POST /api/tasks with `projectId: 1`, note its ID
- Set `id` to that new task ID
- Expected: `200` — deleted task object

**401 Unauthorized**
- Remove JWT → Expected: `401`

**403 Forbidden**
- Log in as Bob → Authorize
- Set `id` = **1**
- Expected: `403`

**404 Not Found**
- Set `id` = **9999**
- Expected: `404`

---

## 4. Tags Resource

### POST /api/tags

**Access Control:** Admin only

**Setup:** Log in as admin@example.com → Authorize

**Success Case (201 Created)**
- Body: `{ "name": "enhancement", "color": "#3b82f6" }`
- Expected: `201` — tag object

**400 Bad Request — Missing name**
- Body: `{ "color": "#aabbcc" }`
- Expected: `400`

**401 Unauthorized**
- Remove JWT → Expected: `401`

**403 Forbidden — Regular user**
- Log in as Alice → Authorize
- Body: `{ "name": "test-tag" }`
- Expected: `403` — `"Admin access required"`

**409 Conflict — Duplicate name**
- Log in as admin → Authorize
- Body: `{ "name": "bug" }` (already exists)
- Expected: `409` — `"Tag name already exists"`

---

### GET /api/tags

**Access Control:** Any authenticated user

**Success Case (200 OK)**
- Log in as Alice → Authorize
- Expected: `200` — array of all 3 tags (bug, feature, urgent)

**401 Unauthorized**
- Remove JWT → Expected: `401`

---

### GET /api/tags/{id}

**Access Control:** Any authenticated user

**Success Case (200 OK)**
- Log in as Alice → Authorize
- Set `id` = **1**
- Expected: `200` — `{ "id": 1, "name": "bug", "color": "#ef4444", ... }`

**400 Bad Request**
- Set `id` = **-1**
- Expected: `400`

**401 Unauthorized**
- Remove JWT → Expected: `401`

**404 Not Found**
- Set `id` = **9999**
- Expected: `404`

---

### PUT /api/tags/{id}

**Access Control:** Admin only

**Setup:** Log in as admin → Authorize

**Success Case (200 OK)**
- Set `id` = **1**
- Body: `{ "name": "critical-bug", "color": "#dc2626" }`
- Expected: `200` — updated tag

**401 Unauthorized**
- Remove JWT → Expected: `401`

**403 Forbidden — Regular user**
- Log in as Alice → Authorize, set `id` = **1**
- Expected: `403`

**404 Not Found**
- Set `id` = **9999**
- Expected: `404`

**409 Conflict — Name taken**
- Admin authorized, set `id` = **1**
- Body: `{ "name": "feature" }` (already exists on tag ID 2)
- Expected: `409`

---

### DELETE /api/tags/{id}

**Access Control:** Admin only

**Setup:** Log in as admin → Authorize

**Success Case (200 OK)**
- First create a throwaway tag via POST /api/tags (e.g., `{ "name": "temp-tag" }`), note its ID
- Set `id` to that new tag ID
- Expected: `200` — deleted tag object

**401 Unauthorized**
- Remove JWT → Expected: `401`

**403 Forbidden — Regular user**
- Log in as Alice → Authorize, set `id` = **3**
- Expected: `403`

**404 Not Found**
- Set `id` = **9999**
- Expected: `404`
