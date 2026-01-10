import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import { NextFunction, Request, Response } from "express";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      type?: "ADMIN" | "USER";
    }
  }
}

export const userMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization;
  const token = header?.split(" ")[1];

  if (!token) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      type: "ADMIN" | "USER",
      userId: string
    };

    req.userId = decoded.userId;
    req.type = decoded.type;   // ✅ important
    next();

  } catch (e) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
