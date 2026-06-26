import upload from '../middleware/upload.middleware.js'
import { Router } from 'express'

import {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcements.controller.js'

import {
  getAnnouncementsValidator,
  idValidator,
  createAnnouncementValidator,
  updateAnnouncementValidator,
} from '../validators/announcements.validator.js'

import { authenticate } from '../middleware/auth.middleware.js'

const router = Router()

/**
 * @swagger
 * /announcements:
 *   get:
 *     summary: Get all announcements
 *     tags:
 *       - Announcements
 */
router.get('/', getAnnouncementsValidator, getAnnouncements)

/**
 * @swagger
 * /announcements/{id}:
 *   get:
 *     summary: Get announcement by id
 *     tags:
 *       - Announcements
 */
router.get('/:id', idValidator, getAnnouncementById)

/**
 * @swagger
 * /announcements:
 *   post:
 *     summary: Create announcement
 *     tags:
 *       - Announcements
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - price
 *               - category
 *               - contactInfo
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               contactInfo:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Announcement created
 */
router.post(
  '/',
  authenticate,
  upload.single('image'),
  createAnnouncementValidator,
  createAnnouncement,
)

/**
 * @swagger
 * /announcements/{id}:
 *   patch:
 *     summary: Update announcement
 *     tags:
 *       - Announcements
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               contactInfo:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Announcement updated
 */
router.patch(
  '/:id',
  authenticate,
  upload.single('image'),
  idValidator,
  updateAnnouncementValidator,
  updateAnnouncement,
)

/**
 * @swagger
 * /announcements/{id}:
 *   delete:
 *     summary: Delete announcement
 *     tags:
 *       - Announcements
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Announcement deleted
 */
router.delete(
  '/:id',
  authenticate,
  idValidator,
  deleteAnnouncement,
)

export default router