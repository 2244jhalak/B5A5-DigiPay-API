import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { IAuth } from "../auth/auth.interface";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: IAuth["role"];
  };
}

/**
 * Authentication Middleware
 */
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: IAuth["role"] };

    req.user = {
      id: decoded.id,
      role: decoded.role
    };

    next();
  } catch (err: unknown) {
  const errorMessage = "Unauthorized: Invalid token";

  if (err instanceof Error) {
    console.error("Auth error:", err.message);
  } else {
    console.error("Auth error:", err);
  }

  return res.status(401).json({ message: errorMessage });
}

};

/**
 * Role-based Authorization Middleware
 */
export const authorize = (roles: IAuth["role"][]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    


    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
    }

    next();
  };
};
