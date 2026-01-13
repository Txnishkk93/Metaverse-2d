import express from "express";
import { router } from "./routes/v1";
import cors from "cors"

const app = express();
app.use(express.json())

// Fix: Allow frontend origin (port 8080)
app.use(cors({
    origin: "http://localhost:8080", // Your frontend port
    credentials: true
}));

app.use("/api/v1", router)

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});