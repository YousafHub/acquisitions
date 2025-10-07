import { db } from '#config/database.js';
import logger from '#config/logger.js';
import { users } from '#models/user.model.js';
import { eq } from 'drizzle-orm';
import { hashPassword } from '#services/auth.service.js';

export const getAllUsers = async () => {
  try {
    return await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at,
      })
      .from(users);
  } catch (error) {
    logger.error('Error getting users', error);
    throw error;
  }
};

export const getUserById = async id => {
  try {
    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return rows[0] || null;
  } catch (error) {
    logger.error('Error getting user by id', error);
    throw error;
  }
};

export const updateUser = async (id, updates) => {
  try {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    if (existing.length === 0) {
      throw new Error('User not found');
    }

    const allowed = {};
    if (typeof updates.name === 'string') allowed.name = updates.name;
    if (typeof updates.email === 'string') allowed.email = updates.email;
    if (typeof updates.role === 'string') allowed.role = updates.role;
    if (typeof updates.password === 'string') {
      allowed.password = await hashPassword(updates.password);
    }

    const [updated] = await db
      .update(users)
      .set(allowed)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at,
      });

    logger.info(`User ${updated?.email ?? id} updated successfully`);
    return updated;
  } catch (error) {
    logger.error('Error updating user', error);
    throw error;
  }
};

export const deleteUser = async id => {
  try {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    if (existing.length === 0) {
      throw new Error('User not found');
    }

    const [deleted] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ id: users.id, email: users.email });

    logger.info(`User ${deleted?.email ?? id} deleted successfully`);
    return deleted;
  } catch (error) {
    logger.error('Error deleting user', error);
    throw error;
  }
};
