const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Task Manager API",
      version: "1.0.0",
      description:
        "A REST API for managing projects, tasks, and tags with JWT authentication.",
    },
   servers: [
  {
    url: "https://task-api-04ue.onrender.com",
    description: "Render API Server",
  },
],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            email: { type: "string", example: "alice@example.com" },
            name: { type: "string", example: "Alice Johnson" },
            role: { type: "string", enum: ["USER", "ADMIN"], example: "USER" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Project: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            title: { type: "string", example: "Website Redesign" },
            description: { type: "string", example: "Redesign the company website." },
            status: {
              type: "string",
              enum: ["ACTIVE", "COMPLETED", "ARCHIVED"],
              example: "ACTIVE",
            },
            ownerId: { type: "integer", example: 1 },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Task: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            title: { type: "string", example: "Design homepage" },
            description: { type: "string", example: "Create mockups." },
            status: {
              type: "string",
              enum: ["TODO", "IN_PROGRESS", "DONE"],
              example: "TODO",
            },
            priority: {
              type: "string",
              enum: ["LOW", "MEDIUM", "HIGH"],
              example: "HIGH",
            },
            dueDate: { type: "string", format: "date-time", nullable: true },
            projectId: { type: "integer", example: 1 },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Tag: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            name: { type: "string", example: "bug" },
            color: { type: "string", example: "#ef4444" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string", example: "Error message" },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

module.exports = swaggerJsdoc(options);
