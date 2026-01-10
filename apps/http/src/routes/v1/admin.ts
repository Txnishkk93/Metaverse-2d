import { Router } from "express";
import client from "@repo/db/client";
import { adminMiddleware } from "../../middleware/admin";
import { 
  CreateElementSchema,
  UpdateElementSchema,
  CreateAvatarSchema,
  CreateMapSchema
} from "../../types";

export const adminRouter = Router();

adminRouter.post("/element", adminMiddleware, async (req, res) => {
  const parsed = CreateElementSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed" });
  }

  const element = await client.element.create({
    data: parsed.data
  });

  res.json({ id: element.id });
});

adminRouter.put("/element/:id", adminMiddleware, async (req, res) => {
  const parsed = UpdateElementSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed" });
  }

  await client.element.update({
    where: { id: req.params.id },
    data: parsed.data
  });

  res.json({ message: "Updated" });
});

adminRouter.post("/avatar", adminMiddleware, async (req, res) => {
  const parsed = CreateAvatarSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed" });
  }

  const avatar = await client.avatar.create({
    data: parsed.data
  });

  res.json({ id: avatar.id });
});

adminRouter.post("/map", adminMiddleware, async (req, res) => {
  const parsed = CreateMapSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Validation failed" });
  }

  const map = await client.map.create({
    data: {
      thumbnail: parsed.data.thumbnail,
      name: parsed.data.name,
      width: parseInt(parsed.data.dimensions.split("x")[0]),
      height: parseInt(parsed.data.dimensions.split("x")[1]),
      mapElements: {
        create: parsed.data.defaultElements
      }
    }
  });

  res.json({ id: map.id });
});
