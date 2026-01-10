import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import { NextFunction, Request, Response } from "express";

export function adminMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(403).json({ message: "Unauthorized" });

  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, JWT_SECRET) as any;

  if (decoded.type !== "ADMIN") {
    return res.status(403).json({ message: "Unauthorized" });
  }

  req.userId = decoded.userId;
  next();
}

