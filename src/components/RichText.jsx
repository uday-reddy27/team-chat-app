import React from "react";
import { USER_LIST } from "../data";

const PATTERN = new RegExp(`(https?:\\/\\/[^\\s]+|@(?:${USER_LIST.join("|")})\\b)`, "g");

// Turns plain text into text + clickable links + highlighted @mentions
export default function RichText({ text }) {
  return text.split(PATTERN).map((part, i) => {
    if (!part) return null;
    if (/^https?:\/\//.test(part)) {
      return (
        <a key={i} href={part} target="_blank" rel="noreferrer">
          {part}
        </a>
      );
    }
    if (part.startsWith("@") && USER_LIST.includes(part.slice(1))) {
      return (
        <span key={i} className="mention">
          {part}
        </span>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}