# Wordle Multiplayer Setup

## Quick Start

1. **Start the server:**
   ```bash
   cd server
   npm run dev
   ```

2. **Open your browser to:**
   ```
   http://localhost:3000
   ```
this is a wordle clone from a youtube video (https://www.youtube.com/watch?v=oKM2nQdQkIU) to which I added the feature of a multiplayer game 
Wordlist taken from charlesreid1.

## ⚙️ Tech Stack

### **Backend**
- **Node.js** – JavaScript runtime environment  
- **Express.js** – Web application framework for Node.js  
- **Socket.IO** – Real-time bidirectional event-based communication library  
- **HTTP** – Built-in Node.js module for creating the server  
- **Port:** `3000`

### **Frontend**
- **HTML / CSS / JavaScript** – Static client-side files  
- **Socket.IO Client** – Enables real-time communication with the backend

---

## 🏗️ Architecture Overview

- **Real-time Multiplayer:** Powered by WebSocket connections through Socket.IO  
- **Room-Based System:** Players can join unique game rooms    
- **In-Memory Storage:** Game state stored in a `rooms` object (no external database)

---

## 🎮 Key Features

✅ **Real-Time Multiplayer Wordle Gameplay**  
✅ **Room Creation & Joining** — Each game has a unique room ID  
✅ **Live Game State Synchronization** — Updates instantly across all players  
✅ **Chat Functionality** — With typing indicators for live interaction  
✅ **Game Pause & Resume** — Temporarily halt and continue sessions  
✅ **Player Disconnect Handling** — Keeps the game stable when users leave  
✅ **Countdown Timer** — For game start and turn management

---


## How to Play Multiplayer

### Creating a Game:
1. Click "2 Players" on the main menu
2. Click "Create a Game"
3. You'll get a 6-character game code
4. Click "Copy Game Code" and share it with your friend

### Joining a Game:
1. Click "2 Players" on the main menu
2. Enter the game code your friend shared
3. Click "Join Game"
4. Wait for the countdown to start!

## File Structure

```
WordleGameMultiplayerAdded/
├── server/
│   ├── package.json
│   └── server.js
├── src/
│   ├── index.js (updated with multiplayer)
│   ├── style.css
│   └── dictionary.js
├── index.html (updated with multiplayer UI)
└── setup.sh
```
