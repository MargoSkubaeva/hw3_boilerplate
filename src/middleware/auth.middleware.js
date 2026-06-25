import jwt from 'jsonwebtoken'
import createHttpError from 'http-errors'

export const authenticate = (req, res, next) => {
  try {
    const header = req.headers.authorization

    if (!header) {
      return next(createHttpError(401, 'No token provided'))
    }

    const [type, token] = header.split(' ')

    if (type !== 'Bearer' || !token) {
      return next(createHttpError(401, 'Invalid token format'))
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    req.user = decoded

    next()
  } catch (err) {
    return next(createHttpError(401, 'Invalid or expired token'))
  }
}