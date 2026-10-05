import React, { useEffect, useMemo, useState } from "react";
import useChat from "./hooks/useChat";
import Sidebar from "./components/Sidebar";
import MessageList from "./components/MessageList";
import Composer from "./components/Composer";
import Icon from "./components/Icon";
import { ROOMS, USER_LIST } from "./data";

const getInitialTheme = () => {
  try {
    const saved = localStorage.getItem("chat-theme");
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
};

export default function App() {
  const chat = useChat();
  const { activeRoom, messages, typing, clientId } = chat;

  const [theme, setTheme] = useState(getInitialTheme);
  const [replyTo, setReplyTo] = useState(null);
  const [editing, setEditing] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("chat-theme", theme); } catch { /* ignore */ }
  }, [theme]);

  const room = ROOMS.find((r) => r.id === activeRoom);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return messages.filter(
      (m) =>
        m.room === activeRoom &&
        (!q || (!m.deleted && m.text.toLowerCase().includes(q)))
    );
  }, [messages, activeRoom, search]);

  const typingNames = useMemo(() => {
    const entries = Object.values(typing[activeRoom] || {});
    return [...new Set(entries.map((e) => e.user))];
  }, [typing, activeRoom]);

  const cancelContext = () => { setReplyTo(null); setEditing(null); };

  const selectRoom = (id) => {
    chat.selectRoom(id);
    cancelContext();
    setSearch("");
    setSearchOpen(false);
    setSidebarOpen(false);
  };

  const toggleSearch = () => {
    setSearchOpen((o) => !o);
    setSearch("");
  };

  const startReply = (msg) => {
    setEditing(null);
    setReplyTo({ id: msg.id, user: msg.user, text: msg.text.slice(0, 120) });
  };

  const startEdit = (msg) => {
    setReplyTo(null);
    setEditing({ id: msg.id, text: msg.text });
  };

  return (
    <div className="app">
      <Sidebar
        messages={messages}
        activeRoom={activeRoom}
        unread={chat.unread}
        onSelect={selectRoom}
        connected={chat.connected}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        open={sidebarOpen}
      />
      {sidebarOpen && <div className="scrim" onClick={() => setSidebarOpen(false)} />}

      <main className="chat">
        <header className="chat-header">
          <button className="icon-btn menu" onClick={() => setSidebarOpen(true)} aria-label="Open channels">
            <Icon name="menu" />
          </button>
          <div className="room-avatar">#</div>
          <div className="room-info">
            <h2>{room.name}</h2>
            <p>{USER_LIST.length} members · {room.topic}</p>
          </div>
          <div className="header-actions">
            {searchOpen && (
              <input
                className="search-inline"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search in this channel"
              />
            )}
            <button className="icon-btn" onClick={toggleSearch} aria-label="Search messages">
              <Icon name={searchOpen ? "close" : "search"} />
            </button>
          </div>
        </header>

        <MessageList
          messages={visible}
          clientId={clientId}
          typingNames={typingNames}
          resetKey={`${activeRoom}|${search}`}
          emptyText={search ? "No messages match your search." : "No messages yet. Say hello!"}
          onLike={chat.likeMessage}
          onReply={startReply}
          onStartEdit={startEdit}
          onDelete={chat.deleteMessage}
        />

        <Composer
          roomName={room.name}
          nextUser={chat.nextUser}
          replyTo={replyTo}
          editing={editing}
          onSend={(text) => { chat.sendMessage(text, replyTo); setReplyTo(null); }}
          onSaveEdit={(text) => { chat.editMessage(editing.id, text.trim()); setEditing(null); }}
          onCancelContext={cancelContext}
          onTyping={chat.notifyTyping}
        />
      </main>
    </div>
  );
}