import logger from '#config/logger.js';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { db } from '#config/database.js';
import { users } from '#models/user.model.js';

export const hashPassword = async (password) => {
  try {
    return await bcrypt.hash(password, 10);
  } catch (error) {
    logger.error('Hash password error: ', error);
    throw new Error('Hash password failed');
  }
};

export const comparePassword = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    logger.error('Compare password error: ', error);
    throw new Error('Password comparison failed');
  }
};

export const authenticateUser = async ({ email, password }) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      throw new Error('User not found');
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    logger.info(`User ${user.email} authenticated successfully`);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at
    };
  } catch (error) {
    logger.error('Error authenticating user: ', error);
    throw error;
  }
};

export const createUser = async ({ name, email, password, role = 'user' }) => {
  try {
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if(existingUser.length > 0) {
      throw new Error('User already exists with this email');
    }

    const password_hash = await hashPassword(password);

    const [newUser] = await db.insert(users).values({ name, email, password: password_hash, role }).returning({ id: users.id, name: users.name, email: users.email, role: users.role, created_at: users.created_at});

    logger.info(`User ${newUser.email} created successfully`);
    return newUser;
  } catch (error) {
    logger.error('Error creating the user: ', error);
    throw error;
  }
};
