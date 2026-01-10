import express from "express";
import { router } from "./routes/v1";
import cors from "cors"


const app = express();
app.use(express.json())

app.use(cors({
    origin: "http://localhost:3002",
    credentials: true
}));
app.use("/api/v1", router)

app.listen(process.env.PORT || 3000)