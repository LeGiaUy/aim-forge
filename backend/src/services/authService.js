import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../config/db.js";

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const signToken = (user, roles) => {
  return jwt.sign(
    { user_id: user.user_id, email: user.email, roles },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

export const register = async (body) => {
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const err = new Error(parsed.error.issues.map((e) => e.message).join(", "));
    err.status = 400;
    throw err;
  }

  const { username, email, password } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    const err = new Error("Email or username already in use");
    err.status = 409;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { username, email, password: hashedPassword },
  });

  const token = signToken(user, []);
  return { user: { user_id: user.user_id, username, email }, token };
};

export const login = async (body) => {
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    const err = new Error(parsed.error.issues.map((e) => e.message).join(", "));
    err.status = 400;
    throw err;
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      roles: {
        include: { role: true },
      },
    },
  });

  if (!user) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }

  const roles = user.roles.map((ur) => ur.role.role_name);
  const token = signToken(user, roles);

  return {
    user: { user_id: user.user_id, username: user.username, email, roles },
    token,
  };
};

export const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    select: {
      user_id: true,
      username: true,
      email: true,
      created_at: true,
      roles: {
        include: {
          role: {
            include: {
              permissions: { include: { permission: true } },
            },
          },
        },
      },
    },
  });
  return user;
};
