import express from "express";
import http from "http";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());

// Serve the built React app (after `npm run build`)
app.use(express.static(path.join(__dirname, "../dist")));

// Fallback: send index.html for any other route (works on Express 4 and 5)
app.use((_req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"), (err) => {
    if (err) res.status(200).send("Chat socket server running");
  });
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const messages = []; // in-memory store (resets on restart)
const MAX_MESSAGES = 1000;

io.on("connection", (socket) => {
  // New client gets the full history
  socket.emit("history", messages);

  // A client sends a message: store it and publish to everyone else
  socket.on("chat:message", (msg, ack) => {
    if (!msg || typeof msg.text !== "string" || !msg.text.trim()) return;
    const clean = {
      id: String(msg.id),
      room: String(msg.room || "general"),
      user: String(msg.user),
      clientId: String(msg.clientId),
      text: msg.text.slice(0, 2000),
      ts: Number(msg.ts) || Date.now(),
      likes: 0,
      replyTo: msg.replyTo
        ? {
            id: String(msg.replyTo.id),
            user: String(msg.replyTo.user),
            text: String(msg.replyTo.text).slice(0, 200),
          }
        : null,
    };
    messages.push(clean);
    if (messages.length > MAX_MESSAGES) messages.shift();
    socket.broadcast.emit("chat:message", clean);
    if (typeof ack === "function") ack({ ok: true });
  });

  // Likes: the server owns the count and tells everyone (including the sender)
  socket.on("chat:like", (id) => {
    const msg = messages.find((m) => m.id === id);
    if (!msg || msg.deleted) return;
    msg.likes += 1;
    io.emit("chat:like", { id, likes: msg.likes });
  });

  // Only the author can edit or delete
  socket.on("chat:edit", ({ id, text, clientId } = {}) => {
    const msg = messages.find((m) => m.id === id);
    if (!msg || msg.clientId !== clientId || msg.deleted || !String(text || "").trim()) return;
    msg.text = String(text).slice(0, 2000);
    msg.edited = true;
    socket.broadcast.emit("chat:edit", { id, text: msg.text });
  });

  socket.on("chat:delete", ({ id, clientId } = {}) => {
    const msg = messages.find((m) => m.id === id);
    if (!msg || msg.clientId !== clientId) return;
    msg.deleted = true;
    msg.text = "";
    socket.broadcast.emit("chat:delete", { id });
  });

  // Typing indicator
  socket.on("chat:typing", ({ room, user, clientId } = {}) => {
    socket.broadcast.emit("chat:typing", { room, user, clientId });
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));