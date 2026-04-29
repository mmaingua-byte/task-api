const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * tags:
 *   name: Tags
 *   description: Tag management endpoints (admin creates/deletes; all authenticated users can read)
 */

/**
 * @swagger
 * /api/tags:
 *   post:
 *     summary: Create a new tag (admin only)
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: bug
 *               color:
 *                 type: string
 *                 example: "#ef4444"
 *     responses:
 *       201:
 *         description: Tag created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tag'
 *       400:
 *         description: Missing name
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
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Tag name already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/", authenticate, requireAdmin, async (req, res) => {
  const { name, color } = req.body;

  if (!name) {
    return res.status(400).json({ error: "name is required" });
  }

  try {
    const existing = await prisma.tag.findUnique({ where: { name } });
    if (existing) {
      return res.status(409).json({ error: "Tag name already exists" });
    }

    const tag = await prisma.tag.create({
      data: { name, color: color || "#6366f1" },
    });
    return res.status(201).json(tag);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/tags:
 *   get:
 *     summary: Get all tags (any authenticated user)
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tags
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Tag'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/", authenticate, async (req, res) => {
  try {
    const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
    return res.status(200).json(tags);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/tags/{id}:
 *   get:
 *     summary: Get a single tag by ID
 *     tags: [Tags]
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
 *         description: Tag found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tag'
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
 *       404:
 *         description: Tag not found
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
    const tag = await prisma.tag.findUnique({ where: { id } });
    if (!tag) return res.status(404).json({ error: "Tag not found" });
    return res.status(200).json(tag);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/tags/{id}:
 *   put:
 *     summary: Update a tag (admin only)
 *     tags: [Tags]
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
 *               name:
 *                 type: string
 *                 example: critical-bug
 *               color:
 *                 type: string
 *                 example: "#dc2626"
 *     responses:
 *       200:
 *         description: Tag updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tag'
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
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Tag not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Tag name already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/:id", authenticate, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id || id <= 0) {
    return res.status(400).json({ error: "ID must be a positive integer" });
  }

  const { name, color } = req.body;

  try {
    const tag = await prisma.tag.findUnique({ where: { id } });
    if (!tag) return res.status(404).json({ error: "Tag not found" });

    if (name && name !== tag.name) {
      const existing = await prisma.tag.findUnique({ where: { name } });
      if (existing) return res.status(409).json({ error: "Tag name already exists" });
    }

    const updated = await prisma.tag.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(color && { color }),
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
 * /api/tags/{id}:
 *   delete:
 *     summary: Delete a tag (admin only)
 *     tags: [Tags]
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
 *         description: Tag deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Tag'
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
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Tag not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id || id <= 0) {
    return res.status(400).json({ error: "ID must be a positive integer" });
  }

  try {
    const tag = await prisma.tag.findUnique({ where: { id } });
    if (!tag) return res.status(404).json({ error: "Tag not found" });

    const deleted = await prisma.tag.delete({ where: { id } });
    return res.status(200).json(deleted);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
