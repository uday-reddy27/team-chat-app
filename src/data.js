export const USER_LIST = ["Alan", "Bob", "Carol", "Dean", "Elin"];

export const USER_COLORS = {
  Alan: "#2a7f9e",
  Bob: "#3f8f5b",
  Carol: "#cc7a2e",
  Dean: "#7a5fc4",
  Elin: "#c2547a",
};

export const ROOMS = [
  { id: "general", name: "General", topic: "Company-wide chatter" },
  { id: "design", name: "Design", topic: "UI, UX and brand" },
  { id: "engineering", name: "Engineering", topic: "Code, bugs and releases" },
  { id: "random", name: "Random", topic: "Memes, music and lunch plans" },
];

// Used only in offline/demo mode so the chat feels alive without a server
export const BOT_REPLIES = [
  "Sounds good to me!",
  "Haha, nice one 😄",
  "Can you share a few more details?",
  "On it 👍",
  "Let's sync after lunch.",
  "Great point, thanks for raising it.",
  "I'll take a look and get back to you.",
  "Agreed, let's ship it 🚀",
];

const minutesAgo = (n) => Date.now() - n * 60 * 1000;

export const SEED = [
  { id: "seed-1", room: "general", user: "Carol", clientId: "seed", ts: minutesAgo(42), likes: 2,
    text: "Morning team! Standup in 10 minutes ☕" },
  { id: "seed-2", room: "general", user: "Dean", clientId: "seed", ts: minutesAgo(40), likes: 0,
    text: "I'll be a couple of minutes late, start without me." },
  { id: "seed-3", room: "general", user: "Alan", clientId: "seed", ts: minutesAgo(35), likes: 1,
    text: "No problem. Welcome aboard @Elin, glad to have you here! 🎉" },
  { id: "seed-4", room: "design", user: "Bob", clientId: "seed", ts: minutesAgo(120), likes: 0,
    text: "Uploaded the new onboarding mockups, feedback welcome." },
  { id: "seed-5", room: "engineering", user: "Elin", clientId: "seed", ts: minutesAgo(300), likes: 3,
    text: "Release 2.4 is out. Please report any regressions here." },
];