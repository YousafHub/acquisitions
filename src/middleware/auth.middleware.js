import { cookies } from '#utils/cookies.js';
import { jwttoken } from '#utils/jwt.js';
import logger from '#config/logger.js';

export const ensureAuth = (req, res, next) => {
  try {
    const token = cookies.get(req, 'token');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const payload = jwttoken.verify(token);
    // Attach only the needed fields
    req.user = { id: payload.id, email: payload.email, role: payload.role };
    next();
  } catch (error) {
    logger.warn('Invalid or missing auth token', {
      path: req.path,
      method: req.method,
    });
    return res
      .status(401)
      .json({ error: 'Unauthorized', error_message: error.message });
  }
};
