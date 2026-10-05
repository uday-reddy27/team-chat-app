import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { BOT_REPLIES, ROOMS, SEED } from "../data";
import { randomUser, uid } from "../utils";

// Dev: local server. Production: same host that served the page.
const SOCKET_URL = import.meta.env.DEV ? "http://localhost:4000" : undefined;
const TYPING_TTL = 3500;

const getClientId = () => {
  try {
    let id = sessionStorage.getItem("chat-client-id");
    if (!id) {
      id = uid();
      sessionStorage.setItem("chat-client-id", id);
    }
    return id;
  } catch {
    return uid();
  }
};

export default function useChat() {
  const [clientId] = useState(getClientId);
  const [messages, setMessages] = useState(SEED);
  const [activeRoom, setActiveRoom] = useState(ROOMS[0].id);
  const [unread, setUnread] = useState({});
  const [typing, setTyping] = useState({}); // { [room]: { [key]: { user, ts } } }
  const [connected, setConnected] = useState(false);
  const [nextUser, setNextUser] = useState(() => randomUser()); // sender of the next message

  const socketRef = useRef(null);
  const activeRef = useRef(activeRoom);
  const timers = useRef([]);
  const lastTypingEmit = useRef(0);
  activeRef.current = activeRoom;

  const patch = useCallback((id, changes) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...changes } : m)));
  }, []);

  const setTypingEntry = useCallback((room, key, entry) => {
    setTyping((t) => {
      const entries = { ...(t[room] || {}) };
      if (entry) entries[key] = entry;
      else delete entries[key];
      return { ...t, [room]: entries };
    });
  }, []);

  const addIncoming = useCallback(
    (msg) => {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      setTypingEntry(msg.room, msg.clientId, null);
      if (msg.room !== activeRef.current) {
        setUnread((u) => ({ ...u, [msg.room]: (u[msg.room] || 0) + 1 }));
      }
    },
    [setTypingEntry]
  );

  // ---- socket.io: subscribe to server events ----
  useEffect(() => {
    const socket = io(SOCKET_URL, { reconnectionAttempts: 3, timeout: 3000 });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("history", (history) =>
      setMessages((prev) => {
        const known = new Set(history.map((m) => m.id));
        const local = prev.filter((m) => !m.id.startsWith("seed-") && !known.has(m.id));
        return [...SEED, ...history, ...local].sort((a, b) => a.ts - b.ts);
      })
    );
    socket.on("chat:message", addIncoming);
    socket.on("chat:like", ({ id, likes }) => patch(id, { likes }));
    socket.on("chat:edit", ({ id, text }) => patch(id, { text, edited: true }));
    socket.on("chat:delete", ({ id }) => patch(id, { deleted: true, text: "" }));
    socket.on("chat:typing", ({ room, user, clientId: from }) =>
      setTypingEntry(room, from, { user, ts: Date.now() })
    );

    return () => {
      socket.disconnect();
      timers.current.forEach(clearTimeout);
    };
  }, [addIncoming, patch, setTypingEntry]);

  // Expire stale typing indicators
  useEffect(() => {
    const interval = setInterval(() => {
      setTyping((prev) => {
        const now = Date.now();
        let changed = false;
        const next = {};
        for (const [room, entries] of Object.entries(prev)) {
          const kept = Object.fromEntries(
            Object.entries(entries).filter(([, v]) => now - v.ts < TYPING_TTL)
          );
          if (Object.keys(kept).length !== Object.keys(entries).length) changed = true;
          next[room] = kept;
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ---- offline demo: someone replies after a short "typing" delay ----
  const scheduleBotReply = useCallback(
    (room, sender) => {
      const user = randomUser(sender);
      const key = `bot-${uid()}`;
      const t1 = setTimeout(() => setTypingEntry(room, key, { user, ts: Date.now() }), 900);
      const t2 = setTimeout(
        () =>
          addIncoming({
            id: uid(),
            room,
            user,
            clientId: key,
            text: BOT_REPLIES[Math.floor(Math.random() * BOT_REPLIES.length)],
            ts: Date.now(),
            likes: 0,
          }),
        2400
      );
      timers.current.push(t1, t2);
    },
    [addIncoming, setTypingEntry]
  );

  // ---- actions ----
  const selectRoom = useCallback((room) => {
    setActiveRoom(room);
    setUnread((u) => ({ ...u, [room]: 0 }));
  }, []);

  const sendMessage = useCallback(
    (text, replyTo) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const socket = socketRef.current;
      const online = Boolean(socket?.connected);
      const msg = {
        id: uid(),
        room: activeRef.current,
        user: nextUser, // randomly assigned from the user list
        clientId,
        text: trimmed,
        ts: Date.now(),
        likes: 0,
        replyTo: replyTo || null,
      };
      setMessages((prev) => [...prev, { ...msg, status: online ? "sending" : "sent" }]);
      if (online) {
        socket.emit("chat:message", msg, () => patch(msg.id, { status: "sent" }));
      } else {
        scheduleBotReply(msg.room, msg.user);
      }
      setNextUser(randomUser()); // new random user for the next message
    },
    [nextUser, clientId, patch, scheduleBotReply]
  );

  const likeMessage = useCallback((id) => {
    const socket = socketRef.current;
    if (socket?.connected && !id.startsWith("seed-")) {
      socket.emit("chat:like", id); // server sends back the new count to everyone
    } else {
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, likes: m.likes + 1 } : m)));
    }
  }, []);

  const editMessage = useCallback(
    (id, text) => {
      patch(id, { text, edited: true });
      socketRef.current?.connected && socketRef.current.emit("chat:edit", { id, text, clientId });
    },
    [patch, clientId]
  );

  const deleteMessage = useCallback(
    (id) => {
      patch(id, { deleted: true, text: "" });
      socketRef.current?.connected && socketRef.current.emit("chat:delete", { id, clientId });
    },
    [patch, clientId]
  );

  const notifyTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingEmit.current < 1500) return;
    lastTypingEmit.current = now;
    if (socketRef.current?.connected) {
      socketRef.current.emit("chat:typing", { room: activeRef.current, user: nextUser, clientId });
    }
  }, [nextUser, clientId]);

  return {
    clientId, messages, activeRoom, selectRoom, unread, typing, connected, nextUser,
    sendMessage, likeMessage, editMessage, deleteMessage, notifyTyping,
  };
}