import { findUserById, verifyToken } from "../services/auth.service.js";
import { httpError } from "../utils/httpError.js";

function readBearerToken(req) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

export async function optionalAuth(req, _res, next) {
  try {
    const token = readBearerToken(req);
    if (!token) return next();

    const payload = verifyToken(token);
    const user = await findUserById(payload.id);

    if (user && user.status !== "blocked") {
      req.user = user;
    }

    return next();
  } catch {
    // Public routes can still continue when an optional token is missing/expired.
    return next();
  }
}

export async function requireAuth(req, _res, next) {
  try {
    const token = readBearerToken(req);

    if (!token) throw httpError(401, "Authentication token is required.");

    const payload = verifyToken(token);
    const user = await findUserById(payload.id);

    if (!user) throw httpError(401, "User account was not found.");
    if (user.status === "blocked") throw httpError(403, "This account has been blocked.");

    req.user = user;
    next();
  } catch (error) {
    if (error.statusCode) return next(error);
    return next(httpError(401, "Invalid or expired authentication token."));
  }
}

export function requireRoles(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(httpError(401, "Login required."));
    if (!roles.includes(req.user.role)) {
      return next(httpError(403, "You do not have permission to access this area."));
    }
    next();
  };
}
