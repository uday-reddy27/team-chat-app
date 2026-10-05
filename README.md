# React Chat App

A single-page chat app built with React (Vite) and an optional Socket.IO server.

## Features

- Type a message and click **Send** (or press Enter); it appears in the thread above the input.
- Each message gets a random username from `["Alan", "Bob", "Carol", "Dean", "Elin"]`.
- A 👍 **like** button on the right of every message with a running count.
- **Stretch goals**
  - Emoji picker (😊 button next to the input).
  - `@` mentions: typing `@` opens the user list, filters as you type, click to insert.
  - Socket.IO server (Express) that broadcasts messages and likes to every connected client.

## Run

```bash
npm install
npm start        # starts the socket server (port 4000) and the Vite dev server together
```

Or run separately: `npm run server` and `npm run dev`.

Open the Vite URL (usually http://localhost:5173) in two tabs to see messages sync in real time.
If the server isn't running, the app falls back to local-only mode ("Offline mode" badge), so the
basic task works with just `npm run dev`.

To point at a different socket server, set `VITE_SOCKET_URL`.
