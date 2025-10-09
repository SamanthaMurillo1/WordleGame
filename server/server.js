const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const rooms = {};

// Serve static files from the client directory (your wordle game)
app.use(express.static(path.join(__dirname, '../')));

app.get('/healthcheck', (req, res) => {
    res.send('<h1>Wordle Multiplayer Server running...</h1>');
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Generate random game code
function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

// Dictionary for multiplayer games (using a smaller set for testing)
const multiplayerDictionary = ["apple", "grape", "berry", "mango", "peach", "lemon", "melon", "cherry", "plum", "guava"];

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        // Clean up rooms when player disconnects
        for (const roomId in rooms) {
            const room = rooms[roomId];
            if (room.player1 === socket.id || room.player2 === socket.id) {
                // Notify other player
                socket.to(roomId).emit('playerDisconnected');
                delete rooms[roomId];
                break;
            }
        }
    });

    socket.on('createGame', () => {
        const roomUniqueId = makeid(6);
        const secretWord = multiplayerDictionary[Math.floor(Math.random() * multiplayerDictionary.length)];
        
        rooms[roomUniqueId] = {
            player1: socket.id,
            player2: null,
            secretWord: secretWord,
            gameStarted: false,
            gameStartTime: null,
            player1Grid: Array(6).fill().map(() => Array(5).fill('')),
            player2Grid: Array(6).fill().map(() => Array(5).fill('')),
            player1Finished: false,
            player2Finished: false,
            winner: null,
            player1Name: 'Player 1',
            player2Name: 'Player 2',
            isPaused: false,
            player1Typing: false,
            player2Typing: false
        };
        
        socket.join(roomUniqueId);
        socket.emit("newGame", { 
            roomUniqueId: roomUniqueId,
            secretWord: secretWord 
        });
        
        console.log(`Game created: ${roomUniqueId} by ${socket.id}`);
    });

    socket.on('joinGame', (data) => {
        const roomId = data.roomUniqueId;
        
        if (rooms[roomId] && !rooms[roomId].player2) {
            rooms[roomId].player2 = socket.id;
            socket.join(roomId);
            
            // Notify both players that the game can start
            io.to(roomId).emit("playersConnected", {
                secretWord: rooms[roomId].secretWord
            });
            
            // Start countdown timer
            startGameCountdown(roomId);
            
            console.log(`Player joined game: ${roomId}`);
        } else if (rooms[roomId] && rooms[roomId].player2) {
            socket.emit('gameError', { message: 'Game is full' });
        } else {
            socket.emit('gameError', { message: 'Game not found' });
        }
    });

    // Handle player moves
    socket.on('playerMove', (data) => {
        const roomId = data.roomId;
        const room = rooms[roomId];
        
        if (room) {
            // Update the appropriate player's grid
            if (room.player1 === socket.id) {
                room.player1Grid = data.grid;
            } else if (room.player2 === socket.id) {
                room.player2Grid = data.grid;
            }
            
            // Broadcast move to other player
            socket.to(roomId).emit('opponentMove', {
                grid: data.grid,
                playerId: socket.id
            });
        }
    });

    // Handle game completion
    socket.on('gameComplete', (data) => {
        const roomId = data.roomId;
        const room = rooms[roomId];
        
        if (room) {
            const isWinner = data.isWinner;
            const isPlayer1 = room.player1 === socket.id;
            
            if (isPlayer1) {
                room.player1Finished = true;
                room.player1Attempts = data.attempts;
                room.player1Time = data.time;
                room.player1Won = isWinner;
            } else {
                room.player2Finished = true;
                room.player2Attempts = data.attempts;
                room.player2Time = data.time;
                room.player2Won = isWinner;
            }
            
            // Notify the other player that someone finished
            socket.to(roomId).emit('playerFinished', {
                playerName: isPlayer1 ? 'Player 1' : 'Player 2',
                attempts: data.attempts,
                time: data.time,
                won: isWinner,
                secretWord: isWinner ? room.secretWord : null
            });
            
            // Send confirmation to the player who finished
            socket.emit('gameFinished', {
                won: isWinner,
                attempts: data.attempts,
                time: data.time,
                secretWord: room.secretWord,
                waitingForOpponent: !room.player1Finished || !room.player2Finished
            });
            
            // Check if both players have finished
            if (room.player1Finished && room.player2Finished) {
                // Determine overall winner
                let overallWinner = null;
                if (room.player1Won && !room.player2Won) {
                    overallWinner = room.player1;
                } else if (room.player2Won && !room.player1Won) {
                    overallWinner = room.player2;
                } else if (room.player1Won && room.player2Won) {
                    // Both won, fastest wins
                    const player1Time = parseTimeToSeconds(room.player1Time);
                    const player2Time = parseTimeToSeconds(room.player2Time);
                    overallWinner = player1Time <= player2Time ? room.player1 : room.player2;
                }
                
                io.to(roomId).emit('gameComplete', {
                    winner: overallWinner,
                    player1: {
                        finished: room.player1Finished,
                        won: room.player1Won,
                        attempts: room.player1Attempts,
                        time: room.player1Time
                    },
                    player2: {
                        finished: room.player2Finished,
                        won: room.player2Won,
                        attempts: room.player2Attempts,
                        time: room.player2Time
                    },
                    secretWord: room.secretWord
                });
            }
        }
    });

    // Handle player requesting to continue after finishing
    socket.on('continueGame', (data) => {
        const roomId = data.roomId;
        socket.to(roomId).emit('opponentContinuing');
    });

    // Handle chat messages
    socket.on('chatMessage', (data) => {
        const roomId = data.roomId;
        const room = rooms[roomId];
        
        if (room) {
            const isPlayer1 = room.player1 === socket.id;
            const playerName = isPlayer1 ? room.player1Name : room.player2Name;
            
            // Broadcast message to both players
            io.to(roomId).emit('chatMessage', {
                message: data.message,
                username: playerName
            });
        }
    });

    // Handle typing indicators
    socket.on('startTyping', (data) => {
        const roomId = data.roomId;
        const room = rooms[roomId];
        
        if (room) {
            const isPlayer1 = room.player1 === socket.id;
            
            if (isPlayer1) {
                room.player1Typing = true;
            } else {
                room.player2Typing = true;
            }
            
            // Notify the other player
            socket.to(roomId).emit('playerStartedTyping');
        }
    });

    socket.on('stopTyping', (data) => {
        const roomId = data.roomId;
        const room = rooms[roomId];
        
        if (room) {
            const isPlayer1 = room.player1 === socket.id;
            
            if (isPlayer1) {
                room.player1Typing = false;
            } else {
                room.player2Typing = false;
            }
            
            // Notify the other player
            socket.to(roomId).emit('playerStoppedTyping');
        }
    });

    // Handle game pause/resume
    socket.on('gamePaused', (data) => {
        const roomId = data.roomId;
        const room = rooms[roomId];
        
        if (room) {
            room.isPaused = true;
            socket.to(roomId).emit('gameWasPaused');
        }
    });

    socket.on('gameResumed', (data) => {
        const roomId = data.roomId;
        const room = rooms[roomId];
        
        if (room && !room.player1Typing && !room.player2Typing) {
            room.isPaused = false;
            socket.to(roomId).emit('gameWasResumed');
        }
    });
});

function startGameCountdown(roomId) {
    let countdown = 3;
    const room = rooms[roomId];
    
    const timer = setInterval(() => {
        io.to(roomId).emit('countdown', { count: countdown });
        countdown--;
        
        if (countdown < 0) {
            clearInterval(timer);
            room.gameStarted = true;
            room.gameStartTime = Date.now();
            io.to(roomId).emit('gameStart', {
                secretWord: room.secretWord
            });
        }
    }, 1000);
}

function parseTimeToSeconds(timeString) {
    const parts = timeString.split(':');
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
