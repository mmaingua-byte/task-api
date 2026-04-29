const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticate } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task management endpoints
 */

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task inside a project
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, projectId]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Design homepage
 *               description:
 *                 type: string
 *                 example: Create mockups for the homepage.
 *               status:
 *                 type: string
 *                 enum: [TODO, IN_PROGRESS, DONE]
 *                 example: TODO
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH]
 *                 example: HIGH
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-12-31T23:59:59Z"
 *               projectId:
 *                 type: integer
 *                 example: 1
 *               tagIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2]
 *     responses:
 *       201:
 *         description: Task created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Missing required fields or invalid values
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not the project owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Project not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/", authenticate, async (req, res) => {
  const { title, description, status, priority, dueDate, projectId, tagIds } = req.body;

  if (!title || !projectId) {
    return res.status(400).json({ error: "title and projectId are required" });
  }

  const validStatuses = ["TODO", "IN_PROGRESS", "DONE"];
  const validPriorities = ["LOW", "MEDIUM", "HIGH"];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }
  if (priority && !validPriorities.includes(priority)) {
    return res.status(400).json({ error: "Invalid priority value" });
  }

  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: "Project not found" });

    if (req.user.role !== "ADMIN" && project.ownerId !== req.user.id) {
      return res.status(403).json({ error: "Access denied: not the project owner" });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || "TODO",
        priority: priority || "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        tags: tagIds
          ? { create: tagIds.map((tagId) => ({ tagId })) }
          : undefined,
      },
      include: { tags: { include: { tag: true } } },
    });

    return res.status(201).json(task);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks (own project tasks; admins see all)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/", authenticate, async (req, res) => {
  try {
    const where =
      req.user.role === "ADMIN"
        ? {}
        : { project: { ownerId: req.user.id } };

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, title: true } },
        tags: { include: { tag: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json(tasks);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get a single task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Task found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Invalid ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:id", authenticate, async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id || id <= 0) {
    return res.status(400).json({ error: "ID must be a positive integer" });
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, title: true, ownerId: true } },
        tags: { include: { tag: true } },
      },
    });

    if (!task) return res.status(404).json({ error: "Task not found" });

    if (req.user.role !== "ADMIN" && task.project.ownerId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    return res.status(200).json(task);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Update a task (project owner or admin)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Updated Task Title
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [TODO, IN_PROGRESS, DONE]
 *                 example: IN_PROGRESS
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH]
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               tagIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Replaces all current tags
 *                 example: [1]
 *     responses:
 *       200:
 *         description: Task updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Invalid ID or values
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/:id", authenticate, async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id || id <= 0) {
    return res.status(400).json({ error: "ID must be a positive integer" });
  }

  const { title, description, status, priority, dueDate, tagIds } = req.body;
  const validStatuses = ["TODO", "IN_PROGRESS", "DONE"];
  const validPriorities = ["LOW", "MEDIUM", "HIGH"];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }
  if (priority && !validPriorities.includes(priority)) {
    return res.status(400).json({ error: "Invalid priority value" });
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: true },
    });
    if (!task) return res.status(404).json({ error: "Task not found" });

    if (req.user.role !== "ADMIN" && task.project.ownerId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    // If tagIds provided, replace all tags
    if (tagIds !== undefined) {
      await prisma.taskTag.deleteMany({ where: { taskId: id } });
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(tagIds && {
          tags: { create: tagIds.map((tagId) => ({ tagId })) },
        }),
      },
      include: { tags: { include: { tag: true } } },
    });

    return res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete a task (project owner or admin)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Task deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Invalid ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete("/:id", authenticate, async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id || id <= 0) {
    return res.status(400).json({ error: "ID must be a positive integer" });
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: true },
    });
    if (!task) return res.status(404).json({ error: "Task not found" });

    if (req.user.role !== "ADMIN" && task.project.ownerId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const deleted = await prisma.task.delete({ where: { id } });
    return res.status(200).json(deleted);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
