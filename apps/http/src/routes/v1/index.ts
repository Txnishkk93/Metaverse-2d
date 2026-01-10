import { Router } from "express";
import { userRouter } from "./user";
import { spaceRouter } from "./space";
import { adminRouter } from "./admin";
import { SigninSchema, SignupSchema } from "../../types";
import { hash, compare } from "../../scrypt";
import client from "@repo/db/client";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../../config";

export const router = Router();

router.post("/signup", async (req, res) => {
    const parsedData = SignupSchema.safeParse(req.body);
    if (!parsedData.success) {
        return res.status(400).json({ message: "Validation failed" });
    }

    const hashedPassword = await hash(parsedData.data.password);

    // Map input type to Prisma enum Role
    const role =
        parsedData.data.type.toLowerCase() === "admin" ? "Admin" : "User";

    try {
        const user = await client.user.create({
            data: {
                username: parsedData.data.username,
                password: hashedPassword,
                type: parsedData.data.type, // optional, keep if needed
                role: role
            }
        });
        res.json({ userId: user.id });
    } catch (e: any) {
        if (e.code === "P2002") {
            return res.status(400).json({ message: "Username already exists" });
        }
        throw e;
    }
});



router.post("/signin", async (req, res) => {
    const parsedData = SigninSchema.safeParse(req.body);
    if (!parsedData.success) {
        return res.status(403).json({ message: "Validation failed" });
    }

    const user = await client.user.findUnique({
        where: { username: parsedData.data.username },
    });

    if (!user) {
        return res.status(403).json({ message: "User not found" });
    }

    const isValid = await compare(parsedData.data.password, user.password);
    if (!isValid) {
        return res.status(403).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
        {
            userId: user.id,
            type: user.role, // ADMIN or USER
        },
        JWT_SECRET
    );


    return res.json({ token });
});

router.get("/elements", async (req, res) => {
    const elements = await client.element.findMany()

    res.json({
        elements: elements.map(e => ({
            id: e.id,
            imageUrl: e.imageUrl,
            width: e.width,
            height: e.height
        }))
    })
})

router.get("/avatars", async (req, res) => {
    const avatars = await client.avatar.findMany()
    res.json({
        avatars: avatars.map(x => ({
            id: x.id,
            imageUrl: x.imageUrl,
            name: x.name
        }))
    })
})

router.use("/user", userRouter)
router.use("/space", spaceRouter)
router.use("/admin", adminRouter)