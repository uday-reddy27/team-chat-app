import React, { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import Message from "./Message";
import { dayKey, dayLabel } from "../utils";

const GROUP_WINDOW = 5 * 60 * 1000;

export default function MessageList({
  messages, clientId, typingNames, resetKey, emptyText,
  onLike, onReply, onStartEdit, onDelete,
}) {
  const scroller = useRef(null);
  const stickToBottom = useRef(true);
  const lastCount = useRef(0);
  const [showJump, setShowJump] = useState(false);
  const [newCount, setNewCount] = useState(0);

  const scrollToBottom = (smooth = false) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    stickToBottom.current = true;
    setNewCount(0);
    setShowJump(false);
  };

  // New room / new search: jump to the bottom
  useEffect(() => {
    lastCount.current = messages.length;
    scrollToBottom();
  }, [resetKey]);

  // New messages: follow if we're at the bottom (or it's our own), otherwise show a badge
  useEffect(() => {
    const added = messages.length - lastCount.current;
    lastCount.current = messages.length;
    if (added <= 0) return;
    const last = messages[messages.length - 1];
    if (stickToBottom.current || last.clientId === clientId) scrollToBottom(true);
    else setNewCount((c) => c + added);
  }, [messages.length]);

  // Keep the typing indicator in view
  useEffect(() => {
    if (stickToBottom.current) scrollToBottom();
  }, [typingNames.length]);

  const onScroll = (e) => {
    const el = e.currentTarget;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    stickToBottom.current = atBottom;
    setShowJump(!atBottom);
    if (atBottom) setNewCount(0);
  };

  const items = [];
  messages.forEach((m, i) => {
    const prev = messages[i - 1];
    const newDay = !prev || dayKey(prev.ts) !== dayKey(m.ts);
    if (newDay) {
      items.push(
        <div className="day-sep" key={`day-${m.id}`}>
          <span>{dayLabel(m.ts)}</span>
        </div>
      );
    }
    const grouped =
      !newDay &&
      prev.user === m.user &&
      prev.clientId === m.clientId &&
      m.ts - prev.ts < GROUP_WINDOW;
    items.push(
      <Message
        key={m.id}
        msg={m}
        mine={m.clientId === clientId}
        grouped={grouped}
        onLike={onLike}
        onReply={onReply}
        onStartEdit={onStartEdit}
        onDelete={onDelete}
      />
    );
  });

  const typingLabel =
    typingNames.length === 1
      ? `${typingNames[0]} is typing…`
      : `${typingNames.join(", ")} are typing…`;

  return (
    <div className="list-wrap">
      <div className="scroller" ref={scroller} onScroll={onScroll}>
        {messages.length === 0 && <div className="empty">{emptyText}</div>}
        {items}
        {typingNames.length > 0 && (
          <div className="typing">
            <span className="dots"><i /><i /><i /></span>
            {typingLabel}
          </div>
        )}
      </div>

      {showJump && (
        <button className="jump" onClick={() => scrollToBottom(true)}>
          <Icon name="down" size={18} />
          {newCount > 0 ? `${newCount} new` : "Latest"}
        </button>
      )}
    </div>
  );
}