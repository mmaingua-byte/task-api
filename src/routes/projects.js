const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Project management endpoints
 */

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Website Redesign
 *               description:
 *                 type: string
 *                 example: Redesign the company website.
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, COMPLETED, ARCHIVED]
 *                 example: ACTIVE
 *     responses:
 *       201:
 *         description: Project created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       400:
 *         description: Missing required field (title)
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
 */
router.post("/", authenticate, async (req, res) => {
  const { title, description, status } = req.body;

  if (!title) {
    return res.status(400).json({ error: "title is required" });
  }

  const validStatuses = ["ACTIVE", "COMPLETED", "ARCHIVED"];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  try {
    const project = await prisma.project.create({
      data: { title, description, status: status || "ACTIVE", ownerId: req.user.id },
    });
    return res.status(201).json(project);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects (own projects; admins see all)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of projects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Project'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/", authenticate, async (req, res) => {
  try {
    const where = req.user.role === "ADMIN" ? {} : { ownerId: req.user.id };
    const projects = await prisma.project.findMany({
      where,
      include: { owner: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json(projects);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get a single project by ID
 *     tags: [Projects]
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
 *         description: Project found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
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
 *         description: Forbidden - not the owner
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
router.get("/:id", authenticate, async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id || id <= 0) {
    return res.status(400).json({ error: "ID must be a positive integer" });
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        tasks: { include: { tags: { include: { tag: true } } } },
      },
    });

    if (!project) return res.status(404).json({ error: "Project not found" });

    if (req.user.role !== "ADMIN" && project.ownerId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    return res.status(200).json(project);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: Update a project (owner or admin)
 *     tags: [Projects]
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
 *                 example: Updated Title
 *               description:
 *                 type: string
 *                 example: Updated description
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, COMPLETED, ARCHIVED]
 *                 example: COMPLETED
 *     responses:
 *       200:
 *         description: Project updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       400:
 *         description: Invalid ID or status
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
 *         description: Project not found
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

  const { title, description, status } = req.body;
  const validStatuses = ["ACTIVE", "COMPLETED", "ARCHIVED"];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  try {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return res.status(404).json({ error: "Project not found" });

    if (req.user.role !== "ADMIN" && project.ownerId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
      },
    });

    return res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Delete a project (owner or admin)
 *     tags: [Projects]
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
 *         description: Project deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
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
 *         description: Project not found
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
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return res.status(404).json({ error: "Project not found" });

    if (req.user.role !== "ADMIN" && project.ownerId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const deleted = await prisma.project.delete({ where: { id } });
    return res.status(200).json(deleted);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
