import { Request, Response, NextFunction } from "express";
import { Role } from "../types/user.types";

export function requireRole(role: Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.session.role !== role) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}
