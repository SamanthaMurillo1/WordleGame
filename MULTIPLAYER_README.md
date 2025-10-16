# Wordle Multiplayer Setup

## Quick Start

1. **Install dependencies and setup:**
   ```bash
   ./setup.sh
   ```

2. **Start the server:**
   ```bash
   cd server
   npm run dev
   ```

3. **Open your browser to:**
   ```
   http://localhost:3000
   ```

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

## Features

- **Real-time multiplayer**: Both players see each other's progress
- **Game codes**: Easy 6-character codes for joining games
- **Countdown timer**: 3-second countdown before games start
- **Live opponent tracking**: See which row your opponent is on
- **Automatic game completion**: Server handles win/loss detection

## Technical Details

- **Server**: Node.js + Express + Socket.io
- **Client**: Your existing Wordle game with Socket.io integration
- **Port**: 3000 (configurable via PORT environment variable)
- **Real-time communication**: WebSocket connections via Socket.io

## File Structure

```
SoloAndMultiplayer/
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
