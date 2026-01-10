import { WebSocketServer } from "ws";
import { User } from "./User"; // your fixed User class

const PORT = 3001;

// Create a WebSocket server
const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (ws) => {
    console.log("New client connected");

    // Create a User instance for this connection
    const user = new User(ws);

    ws.on("close", () => {
        console.log("Client disconnected");
        user.destroy();
    });
});

console.log(`WebSocket server running on ws://localhost:${PORT}`);
