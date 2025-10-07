import {
  fetchAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '#controllers/users.controller.js';
import { ensureAuth } from '#middleware/auth.middleware.js';
import express from 'express';

const router = express.Router();

router.get('/', fetchAllUsers);
router.get('/:id', getUserById);
router.put('/:id', ensureAuth, updateUser);
router.delete('/:id', ensureAuth, deleteUser);

export default router;
