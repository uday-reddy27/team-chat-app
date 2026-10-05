import React, { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import RichText from "./RichText";
import { USER_COLORS } from "../data";
import { formatTime, initials } from "../utils";

export default function Message({ msg, mine, grouped, onLike, onReply, onStartEdit, onDelete }) {
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef(null);
  const color = USER_COLORS[msg.user] || "#888";

  useEffect(() => () => clearTimeout(copyTimer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(msg.text);
      setCopied(true);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className={`row ${mine ? "mine" : ""} ${grouped ? "grouped" : ""}`}>
      {!mine &&
        (grouped ? (
          <div className="avatar-spacer" />
        ) : (
          <div className="avatar" style={{ background: color }}>
            {initials(msg.user)}
          </div>
        ))}

      <div className="stack">
        {!grouped && (
          <div className="name" style={{ color }}>
            {msg.user}
          </div>
        )}

        <div className="bubble-wrap">
          <div className={`bubble ${msg.deleted ? "deleted" : ""}`}>
            <div className="content">
              {msg.replyTo && !msg.deleted && (
                <div className="quote">
                  <b>{msg.replyTo.user}</b>
                  <span>{msg.replyTo.text}</span>
                </div>
              )}

              {msg.deleted ? (
                <p className="text">This message was deleted</p>
              ) : (
                <p className="text">
                  <RichText text={msg.text} />
                </p>
              )}

              <div className="foot">
                <span>{formatTime(msg.ts)}</span>
                {msg.edited && !msg.deleted && <span>· edited</span>}
                {mine && !msg.deleted && (
                  <span className={`tick ${msg.status}`}>
                    {msg.status === "sending" ? "…" : <Icon name="check" size={13} />}
                  </span>
                )}
              </div>
            </div>

            {!msg.deleted && (
              <button
                className={`like ${msg.likes > 0 ? "liked" : ""}`}
                onClick={() => onLike(msg.id)}
                aria-label={`Like message from ${msg.user}`}
              >
                <Icon name="heart" size={16} fill={msg.likes > 0 ? "currentColor" : "none"} />
                <span className="count">{msg.likes}</span>
              </button>
            )}
          </div>

          {!msg.deleted && (
            <div className="actions">
              <button onClick={() => onReply(msg)} aria-label="Reply" title="Reply">
                <Icon name="reply" size={16} />
              </button>
              <button onClick={copy} aria-label="Copy text" title="Copy">
                <Icon name={copied ? "check" : "copy"} size={16} />
              </button>
              {mine && (
                <>
                  <button onClick={() => onStartEdit(msg)} aria-label="Edit" title="Edit">
                    <Icon name="edit" size={16} />
                  </button>
                  <button onClick={() => onDelete(msg.id)} aria-label="Delete" title="Delete">
                    <Icon name="trash" size={16} />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}