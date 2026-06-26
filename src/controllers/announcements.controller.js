import cloudinary from '../cloudinary.js'
import fs from 'fs/promises'
import logger from '../logger.js'
import prisma from '../../prisma/client.js'

// GET ALL
export const getAnnouncements = async (req, res) => {
  const { search = '', sort = 'newest', page = 1 } = req.query

  const perPage = 10
  const skip = (Number(page) - 1) * perPage

  const where = search
    ? {
        title: {
          contains: search,
          mode: 'insensitive',
        },
      }
    : {}

  const orderBy = {
    createdAt: sort === 'oldest' ? 'asc' : 'desc',
  }

  const [data, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      orderBy,
      skip,
      take: perPage,
    }),
    prisma.announcement.count({ where }),
  ])

  return res.json({
    data,
    pagination: {
      total,
      page: Number(page),
      totalPages: Math.ceil(total / perPage),
      perPage,
    },
  })
}

// GET BY ID
export const getAnnouncementById = async (req, res) => {
  const { id } = req.params

  const announcement = await prisma.announcement.findUniqueOrThrow({
    where: { id: Number(id) },
  })

  return res.json(announcement)
}

// CREATE (🔐 protected + ownership)
export const createAnnouncement = async (req, res) => {
  const userId = req.user.id

  let imageUrl = null

  if (req.file) {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'announcements',
    })

    imageUrl = result.secure_url

    await fs.unlink(req.file.path)

    logger.info(`Photo uploaded: ${imageUrl}`)
  }

  const announcement = await prisma.announcement.create({
    data: {
      ...req.body,
      imageUrl,
      userId,
    },
  })

  logger.info(`Announcement created: ${announcement.id}`)

  return res.status(201).json(announcement)
}

// UPDATE (🔐 protected + ownership)
// UPDATE (🔐 protected + ownership)
export const updateAnnouncement = async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  const announcement = await prisma.announcement.findUnique({
    where: { id: Number(id) },
  })

  if (!announcement) {
    return res.status(404).json({ error: 'Not found' })
  }

  if (announcement.userId !== userId) {
    return res.status(403).json({ error: 'Access denied' })
  }

  let imageUrl

  if (req.file) {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'announcements',
    })

    imageUrl = result.secure_url

    await fs.unlink(req.file.path)

    logger.info(`Photo updated: ${imageUrl}`)
  }

  const updated = await prisma.announcement.update({
    where: { id: Number(id) },
    data: {
      ...req.body,
      ...(imageUrl && { imageUrl }),
    },
  })

  return res.json(updated)
}

// DELETE (🔐 protected + ownership)
export const deleteAnnouncement = async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  const announcement = await prisma.announcement.findUnique({
    where: { id: Number(id) },
  })

  if (!announcement) {
    return res.status(404).json({ error: 'Not found' })
  }

  if (announcement.userId !== userId) {
    return res.status(403).json({ error: 'Access denied' })
  }

  await prisma.announcement.delete({
    where: { id: Number(id) },
  })

  return res.status(204).end()
}