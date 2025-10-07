import logger from '#config/logger.js';
import { formatValidationError } from '#utils/format.js';
import {
  userIdSchema,
  updateUserSchema,
} from '#validations/users.validation.js';
import {
  getAllUsers,
  getUserById as getUserByIdService,
  updateUser as updateUserService,
  deleteUser as deleteUserService,
} from '#services/users.services.js';

export const fetchAllUsers = async (req, res, next) => {
  try {
    logger.info('Getting users...');

    const allUsers = await getAllUsers();

    res
      .status(200)
      .json({
        message: 'Successfully retrieved users',
        users: allUsers,
        count: allUsers.length,
      });
  } catch (error) {
    logger.error('Error in getAllUsers controller', error);
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const validation = userIdSchema.safeParse({ id: req.params.id });
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validation.error),
      });
    }

    const id = validation.data.id;
    logger.info(`Getting user by id: ${id}`);

    const user = await getUserByIdService(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'Successfully retrieved user', user });
  } catch (error) {
    logger.error('Error in getUserById controller', error);
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const idValidation = userIdSchema.safeParse({ id: req.params.id });
    if (!idValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(idValidation.error),
      });
    }
    const id = idValidation.data.id;

    const bodyValidation = updateUserSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(bodyValidation.error),
      });
    }

    const requester = req.user;
    if (!requester) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const isAdmin = requester.role === 'admin';
    const isSelf = String(requester.id) === String(id);

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updates = { ...bodyValidation.data };
    if (!isAdmin && typeof updates.role !== 'undefined') {
      return res
        .status(403)
        .json({ error: 'Forbidden: only admin can change role' });
    }

    // Avoid logging sensitive fields like password
    logger.info(`Updating user ${id}${isAdmin ? ' by admin' : ''}`);

    const updated = await updateUserService(id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }

    res
      .status(200)
      .json({ message: 'User updated successfully', user: updated });
  } catch (error) {
    logger.error('Error in updateUser controller', error);
    if (error.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const validation = userIdSchema.safeParse({ id: req.params.id });
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validation.error),
      });
    }
    const id = validation.data.id;

    const requester = req.user;
    if (!requester) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const isAdmin = requester.role === 'admin';
    const isSelf = String(requester.id) === String(id);
    if (!isAdmin && !isSelf) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    logger.info(`Deleting user ${id}${isAdmin ? ' by admin' : ''}`);
    await deleteUserService(id);

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Error in deleteUser controller', error);
    if (error.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }
    next(error);
  }
};
