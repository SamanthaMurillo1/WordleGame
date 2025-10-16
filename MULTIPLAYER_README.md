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
this is a wordle clone from a youtube video to which i added the feature of a multiplayer game 
Wordlist taken from charlesreid1.

### Backend :
Node.js - JavaScript runtime environment
Express.js - Web application framework for Node.js
Socket.IO - Real-time bidirectional event-based communication library
HTTP - Built-in Node.js HTTP module for creating the server
Port - 3000

### Frontend :
HTML/CSS/JavaScript - Static files being served from the client directory
Socket.IO Client - For real-time communication with the server
Architecture
Real-time multiplayer - Using WebSocket connections via Socket.IO
Room-based system - Players join game rooms with unique IDs
Static file serving - Express serves the frontend files
In-memory storage - Game state stored in a rooms object (no database)

### Key Features Implemented
Real-time multiplayer Wordle game
Room creation and joining
Live game state synchronization
Chat functionality with typing indicators
Game pause/resume functionality
Player disconnect handling
Countdown timer for game start

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
