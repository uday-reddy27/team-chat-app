import React, { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import { USER_COLORS, USER_LIST } from "../data";

export default function Composer({
  roomName, nextUser, replyTo, editing,
  onSend, onSaveEdit, onCancelContext, onTyping,
}) {
  const [text, setText] = useState("");
  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const ref = useRef(null);
  const hintTimer = useRef(null);

  const matches =
    mentionQuery === null
      ? []
      : USER_LIST.filter((u) => u.toLowerCase().startsWith(mentionQuery.toLowerCase()));
  const mentionOpen = matches.length > 0;

  // Start editing: load the message text into the box
  useEffect(() => {
    if (editing) setText(editing.text);
    ref.current?.focus();
  }, [editing]);

  useEffect(() => {
    if (replyTo) ref.current?.focus();
  }, [replyTo]);

  // Auto-grow the textarea
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  useEffect(() => () => clearTimeout(hintTimer.current), []);

  const handleChange = (e) => {
    const value = e.target.value;
    setText(value);
    const caret = e.target.selectionStart;
    const m = value.slice(0, caret).match(/(?:^|\s)@(\w*)$/);
    setMentionQuery(m ? m[1] : null);
    setMentionIndex(0);
    if (value.trim() && !editing) onTyping();
  };

  const insertMention = (name) => {
    const el = ref.current;
    const caret = el.selectionStart;
    const before = text.slice(0, caret).replace(/@(\w*)$/, `@${name} `);
    setText(before + text.slice(caret));
    setMentionQuery(null);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(before.length, before.length);
    });
  };

  const submit = () => {
    if (!text.trim()) return;
    if (editing) onSaveEdit(text);
    else onSend(text);
    setText("");
    setMentionQuery(null);
  };

  const handleKeyDown = (e) => {
    if (mentionOpen) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((i) => (i + 1) % matches.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((i) => (i - 1 + matches.length) % matches.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(matches[mentionIndex]);
        return;
      }
      if (e.key === "Escape") {
        setMentionQuery(null);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
    if (e.key === "Escape" && (editing || replyTo)) {
      onCancelContext();
      if (editing) setText("");
    }
  };

  // Browsers can't open the OS emoji panel directly, so focus the box and show the shortcut.
  const showEmojiHint = () => {
    ref.current?.focus();
    setShowHint(true);
    clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setShowHint(false), 6000);
  };

  const cancelContext = () => {
    onCancelContext();
    if (editing) setText("");
  };

  return (
    <div className="composer">
      {mentionOpen && (
        <ul className="popup mention-list">
          {matches.map((u, i) => (
            <li key={u}>
              <button
                className={i === mentionIndex ? "active" : ""}
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertMention(u);
                }}
              >
                <span className="dot" style={{ background: USER_COLORS[u] }} />@{u}
              </button>
            </li>
          ))}
        </ul>
      )}

      {showHint && (
        <div className="hint" role="status">
          Open your emoji keyboard with <kbd>Win</kbd> + <kbd>.</kbd> (Mac: <kbd>Ctrl</kbd> +{" "}
          <kbd>Cmd</kbd> + <kbd>Space</kbd>)
        </div>
      )}

      {(replyTo || editing) && (
        <div className="context">
          <Icon name={editing ? "edit" : "reply"} size={18} />
          <div>
            <b>{editing ? "Editing message" : `Replying to ${replyTo.user}`}</b>
            <span>{editing ? editing.text : replyTo.text}</span>
          </div>
          <button className="icon-btn" onClick={cancelContext} aria-label="Cancel">
            <Icon name="close" size={18} />
          </button>
        </div>
      )}

      {!editing && (
        <div className="sending-as">
          Sending as <b style={{ color: USER_COLORS[nextUser] }}>{nextUser}</b>
        </div>
      )}

      <div className="input-row">
        <button className="icon-btn" onClick={showEmojiHint} aria-label="Emoji keyboard">
          <Icon name="smile" size={24} />
        </button>
        <textarea
          ref={ref}
          rows={1}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={`Message #${roomName}  ·  @ to mention  ·  Shift+Enter for a new line`}
        />
        <button className="send" onClick={submit} disabled={!text.trim()} aria-label="Send">
          <Icon name={editing ? "check" : "send"} size={20} />
        </button>
      </div>
    </div>
  );
}