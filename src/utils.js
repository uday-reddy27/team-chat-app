import { USER_LIST } from "./data";

export const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

// Random user from the list (optionally excluding one name)
export const randomUser = (exclude) => {
  const pool = exclude ? USER_LIST.filter((u) => u !== exclude) : USER_LIST;
  return pool[Math.floor(Math.random() * pool.length)];
};

export const initials = (name) => name.slice(0, 2).toUpperCase();

export const formatTime = (ts) =>
  new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export const dayKey = (ts) => new Date(ts).toDateString();

export const dayLabel = (ts) => {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
};