import React, { useState } from "react";
import Icon from "./Icon";
import { ROOMS } from "../data";
import { formatTime } from "../utils";

export default function Sidebar({
  messages, activeRoom, unread, onSelect, connected, theme, onToggleTheme, open,
}) {
  const [query, setQuery] = useState("");
  const rooms = ROOMS.filter((r) => r.name.toLowerCase().includes(query.trim().toLowerCase()));

  const lastOf = (roomId) => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].room === roomId) return messages[i];
    }
    return null;
  };

  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="brand">
        <div className="brand-logo">T</div>
        <div>
          <h1>Teamspace</h1>
          <span className={`status ${connected ? "on" : ""}`}>
            {connected ? "Connected" : "Offline · demo mode"}
          </span>
        </div>
        <button className="icon-btn" onClick={onToggleTheme} aria-label="Toggle dark mode">
          <Icon name={theme === "dark" ? "sun" : "moon"} />
        </button>
      </div>

      <label className="search">
        <Icon name="search" size={16} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search channels"
        />
      </label>

      <div className="section-label">Channels</div>
      <ul className="rooms">
        {rooms.map((r) => {
          const last = lastOf(r.id);
          const count = unread[r.id] || 0;
          return (
            <li key={r.id}>
              <button
                className={`room ${r.id === activeRoom ? "active" : ""}`}
                onClick={() => onSelect(r.id)}
              >
                <span className="room-tile">#</span>
                <span className="room-main">
                  <span className="room-top">
                    <span className="room-name">{r.name}</span>
                    {last && <span className="room-time">{formatTime(last.ts)}</span>}
                  </span>
                  <span className="room-bottom">
                    <span className="room-preview">
                      {last
                        ? last.deleted
                          ? "Message deleted"
                          : `${last.user}: ${last.text}`
                        : "No messages yet"}
                    </span>
                    {count > 0 && <span className="badge">{count}</span>}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
        {rooms.length === 0 && <li className="no-rooms">No channels found</li>}
      </ul>

      <div className="side-foot">Each message is sent as a randomly picked teammate.</div>
    </aside>
  );
}