import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";
import { sendError } from "../utils/response.js";

/**
 * Verify JWT and attach user to req.user
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(res, "Unauthorized – no token provided", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach full user with roles
    const user = await prisma.user.findUnique({
      where: { user_id: decoded.user_id },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) return sendError(res, "Unauthorized – user not found", 401);

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return sendError(res, "Unauthorized – invalid or expired token", 401);
    }
    next(err);
  }
};

/**
 * Require a specific role (e.g. "admin")
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return sendError(res, "Unauthorized", 401);

    const userRoles = req.user.roles.map((ur) => ur.role.role_name);
    const hasRole = roles.some((r) => userRoles.includes(r));

    if (!hasRole) {
      return sendError(res, `Forbidden – requires role: ${roles.join(" or ")}`, 403);
    }
    next();
  };
};

/**
 * Require a specific permission (e.g. "product:write")
 */
export const requirePermission = (permissionName) => {
  return (req, res, next) => {
    if (!req.user) return sendError(res, "Unauthorized", 401);

    const permissions = req.user.roles.flatMap((ur) =>
      ur.role.permissions.map((rp) => rp.permission.permission_name)
    );

    if (!permissions.includes(permissionName)) {
      return sendError(res, `Forbidden – requires permission: ${permissionName}`, 403);
    }
    next();
  };
};
