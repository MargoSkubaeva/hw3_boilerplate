import prisma from '../../prisma/client.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const generateTokens = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
  }

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '15m',
  })

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  })

  return { accessToken, refreshToken }
}

// REGISTER
export const register = async (req, res) => {
  const { username, password, name } = req.body

  const exists = await prisma.user.findUnique({
    where: { username },
  })

  if (exists) {
    return res.status(409).json({
      message: 'User with this username already exists',
    })
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      name,
    },
  })

  const tokens = generateTokens(user)

  await prisma.refreshToken.create({
    data: {
      token: tokens.refreshToken,
      userId: user.id,
    },
  })

  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
  })

  return res.status(201).json({
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
    },
    ...tokens,
  })
}

// LOGIN
export const login = async (req, res) => {
  const { username, password } = req.body

  const user = await prisma.user.findUnique({
    where: { username },
  })

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  const isValid = await bcrypt.compare(password, user.password)

  if (!isValid) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  const tokens = generateTokens(user)

  await prisma.refreshToken.create({
    data: {
      token: tokens.refreshToken,
      userId: user.id,
    },
  })

  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
  })

  return res.json({
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
    },
    ...tokens,
  })
}

export const refresh = async (req, res) => {
    const token =
      req.cookies?.refreshToken || req.body?.refreshToken
  
    if (!token) {
      return res.status(401).json({ message: 'No refresh token' })
    }
  
    try {
      const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET)
  
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token },
      })
  
      if (!storedToken) {
        return res.status(401).json({ message: 'Invalid refresh token' })
      }
  
      await prisma.refreshToken.delete({
        where: { token },
      })
  
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
      })
  
      const newTokens = generateTokens(user)
  
      await prisma.refreshToken.create({
        data: {
          token: newTokens.refreshToken,
          userId: user.id,
        },
      })
  
      res.cookie('refreshToken', newTokens.refreshToken, {
        httpOnly: true,
      })
  
      return res.json(newTokens)
    } catch (err) {
      return res.status(401).json({ message: 'Invalid refresh token' })
    }
  }

  export const logout = async (req, res) => {
    const token =
      req.cookies?.refreshToken || req.body?.refreshToken
  
    if (token) {
      await prisma.refreshToken.deleteMany({
        where: { token },
      })
    }
  
    res.clearCookie('refreshToken')
  
    return res.json({
      message: 'Logged out successfully',
    })
  }

  export const me = async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        name: true,
        createdAt: true,
      },
    })
  
    return res.json(user)
  }