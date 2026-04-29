# Task Manager API

A REST API for managing projects, tasks, and tags with JWT authentication, built with Node.js, Express, PostgreSQL, and Prisma.

## Tech Stack
- **Runtime:** Node.js
- **Framework:** Express
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Auth:** bcrypt + JWT
- **Docs:** Swagger UI (OpenAPI 3.0)
- **Deployment:** Render

## Resources
- **Users** — authentication and authorization (signup, login)
- **Projects** — CRUD, owned by a user
- **Tasks** — CRUD, belong to a project; owners manage their tasks
- **Tags** — CRUD, admin-managed; can be applied to tasks

## Local Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
Copy `.env` and fill in your local PostgreSQL URL:
```
DATABASE_URL="postgresql://user:password@localhost:5432/taskmanager"
JWT_SECRET="your-secret-key"
PORT=3000
```

### 3. Create and migrate the database
```bash
npx prisma migrate dev --name init
```

### 4. Seed the database
```bash
npm run seed
```

### 5. Start the server
```bash
npm start
# or for development:
npm run dev
```

### 6. Open Swagger UI
Visit: http://localhost:3000/api-docs

## Seed Credentials
| Role  | Email              | Password  |
|-------|--------------------|-----------|
| Admin | admin@example.com  | Admin123! |
| User  | alice@example.com  | User123!  |
| User  | bob@example.com    | User123!  |

## Deployment to Render

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → **New** → **Blueprint**
3. Connect your GitHub repo — Render detects `render.yaml` automatically
4. Set `JWT_SECRET` if not auto-generated
5. Deploy — the build command runs migrations, start command runs seed + server

## API Endpoints Summary

| Method | Endpoint              | Access           |
|--------|-----------------------|------------------|
| POST   | /api/auth/signup      | Public           |
| POST   | /api/auth/login       | Public           |
| POST   | /api/projects         | Auth             |
| GET    | /api/projects         | Auth (own/all)   |
| GET    | /api/projects/:id     | Owner or Admin   |
| PUT    | /api/projects/:id     | Owner or Admin   |
| DELETE | /api/projects/:id     | Owner or Admin   |
| POST   | /api/tasks            | Project Owner    |
| GET    | /api/tasks            | Auth (own/all)   |
| GET    | /api/tasks/:id        | Project Owner    |
| PUT    | /api/tasks/:id        | Project Owner    |
| DELETE | /api/tasks/:id        | Project Owner    |
| POST   | /api/tags             | Admin only       |
| GET    | /api/tags             | Auth             |
| GET    | /api/tags/:id         | Auth             |
| PUT    | /api/tags/:id         | Admin only       |
| DELETE | /api/tags/:id         | Admin only       |
