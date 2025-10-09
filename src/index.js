import { testDictionary, realDictionary } from './dictionary.js';

// for testing purposes, make sure to use the test dictionary
// console.log('test dictionary:', testDictionary);

const dictionary = realDictionary;

// Socket.io connection
const socket = io();

// Game state
const state = {
  secret: dictionary[Math.floor(Math.random() * dictionary.length)],
  grid: Array(6)
    .fill()
    .map(() => Array(5).fill('')),
  currentRow: 0,
  currentCol: 0,
  gameMode: 'solo', // 'solo' or 'multiplayer'
  roomId: null,
  isGameActive: false,
  gameStartTime: null,
  timerInterval: null
};

function updateGrid() {
  for (let i = 0; i < state.grid.length; i++) {
    for (let j = 0; j < state.grid[i].length; j++) {
      const box = document.getElementById(`box${i}${j}`);
      box.textContent = state.grid[i][j];
    }
  }
}

function drawBox(container, row, col, letter = '') {
  const box = document.createElement('div');
  box.className = 'box';
  box.textContent = letter;
  box.id = `box${row}${col}`;

  container.appendChild(box);
  return box;
}

function drawGrid(container) {
  const grid = document.createElement('div');
  grid.className = 'grid';

  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 5; j++) {
      drawBox(grid, i, j);
    }
  }

  container.appendChild(grid);
}





function registerKeyboardEvents() {
  document.body.onkeydown = (e) => {
    const key = e.key;
    
    // Only allow input if game is active (or if in multiplayer and current player hasn't finished)
    if (state.gameMode === 'multiplayer' && !state.isGameActive) {
      // Check if current player can still play (hasn't finished yet)
      const resultDiv = document.getElementById('game-result');
      const canStillPlay = resultDiv.classList.contains('hidden');
      if (!canStillPlay) {
        return; // Current player has finished
      }
    } else if (state.gameMode === 'solo' && !state.isGameActive) {
      return;
    }
    
    if (key === 'Enter') {
      if (state.currentCol === 5) {
        const word = getCurrentWord();
        if (isWordValid(word)) {
          revealWord(word);
          state.currentRow++;
          state.currentCol = 0;
          
          // Send move to server in multiplayer mode
          if (state.gameMode === 'multiplayer' && state.roomId) {
            socket.emit('playerMove', {
              roomId: state.roomId,
              grid: state.grid,
              currentRow: state.currentRow
            });
          }
        } else {
          alert('Not a valid word.');
        }
      }
    }
    if (key === 'Backspace') {
      removeLetter();
    }
    if (isLetter(key)) {
      addLetter(key);
    }

    updateGrid();
  };
}

function getCurrentWord() {
  return state.grid[state.currentRow].reduce((prev, curr) => prev + curr);
}

function isWordValid(word) {
  return dictionary.includes(word);
}

function getNumOfOccurrencesInWord(word, letter) {
  let result = 0;
  for (let i = 0; i < word.length; i++) {
    if (word[i] === letter) {
      result++;
    }
  }
  return result;
}

function getPositionOfOccurrence(word, letter, position) {
  let result = 0;
  for (let i = 0; i <= position; i++) {
    if (word[i] === letter) {
      result++;
    }
  }
  return result;
}

function revealWord(guess) {
  const row = state.currentRow;
  const animation_duration = 500; // ms

  for (let i = 0; i < 5; i++) {
    const box = document.getElementById(`box${row}${i}`);
    const letter = box.textContent;
    const numOfOccurrencesSecret = getNumOfOccurrencesInWord(
      state.secret,
      letter
    );
    const numOfOccurrencesGuess = getNumOfOccurrencesInWord(guess, letter);
    const letterPosition = getPositionOfOccurrence(guess, letter, i);

    setTimeout(() => {
      if (
        numOfOccurrencesGuess > numOfOccurrencesSecret &&
        letterPosition > numOfOccurrencesSecret
      ) {
        box.classList.add('empty');
      } else {
        if (letter === state.secret[i]) {
          box.classList.add('right');
        } else if (state.secret.includes(letter)) {
          box.classList.add('wrong');
        } else {
          box.classList.add('empty');
        }
      }
    }, ((i + 1) * animation_duration) / 2);

    box.classList.add('animated');
    box.style.animationDelay = `${(i * animation_duration) / 2}ms`;
  }

  const isWinner = state.secret === guess;
  const isGameOver = state.currentRow === 5;

  setTimeout(() => {
    if (state.gameMode === 'multiplayer') {
      // Handle multiplayer game completion
      if (isWinner || isGameOver) {
        const completionTime = stopGameTimer();
        
        if (state.roomId) {
          socket.emit('gameComplete', {
            roomId: state.roomId,
            isWinner: isWinner,
            isGameOver: isGameOver,
            attempts: state.currentRow + (isWinner ? 1 : 0),
            time: completionTime
          });
        }
        
        // Don't set isGameActive to false here - let the server response handle it
      }
    } else {
      // Handle solo game completion
      if (isWinner) {
        alert('Congratulations!');
      } else if (isGameOver) {
        alert(`Better luck next time! The word was ${state.secret}.`);
      }
    }
  }, 3 * animation_duration);
}

function isLetter(key) {
  return key.length === 1 && key.match(/[a-z]/i);
}

function addLetter(letter) {
  if (state.currentCol === 5) return;
  state.grid[state.currentRow][state.currentCol] = letter;
  state.currentCol++;
}

function removeLetter() {
  if (state.currentCol === 0) return;
  state.grid[state.currentRow][state.currentCol - 1] = '';
  state.currentCol--;
}

function startup() {
  // Show the landing page first
  showLandingPage();
  setupNavigation();
}

function showLandingPage() {
  hideAllPages();
  document.getElementById('landing-page').classList.remove('hidden');
  state.gameMode = 'solo';
  state.roomId = null;
}

function showSoloGamePage() {
  hideAllPages();
  document.getElementById('solo-game-page').classList.remove('hidden');
  state.gameMode = 'solo';
  startSoloGame();
}

function showMultiplayerPage() {
  hideAllPages();
  document.getElementById('multiplayer-page').classList.remove('hidden');
}

function showMultiplayerGamePage() {
  hideAllPages();
  document.getElementById('multiplayer-game-page').classList.remove('hidden');
  state.gameMode = 'multiplayer';
}

function hideAllPages() {
  document.getElementById('landing-page').classList.add('hidden');
  document.getElementById('solo-game-page').classList.add('hidden');
  document.getElementById('multiplayer-page').classList.add('hidden');
  document.getElementById('multiplayer-game-page').classList.add('hidden');
}

function startSoloGame() {
  // Reset the game state
  resetGameState();
  
  const game = document.getElementById('game');
  // Clear any existing grid
  game.innerHTML = '';
  drawGrid(game);
  
  registerKeyboardEvents();
  console.log('Secret word:', state.secret); // for testing purposes
}

function resetGameState() {
  state.secret = dictionary[Math.floor(Math.random() * dictionary.length)];
  state.grid = Array(6).fill().map(() => Array(5).fill(''));
  state.currentRow = 0;
  state.currentCol = 0;
}

function setupNavigation() {
  // Landing page buttons
  document.getElementById('solo-btn').addEventListener('click', showSoloGamePage);
  document.getElementById('multiplayer-btn').addEventListener('click', showMultiplayerPage);
  
  // Back buttons
  document.getElementById('back-to-landing').addEventListener('click', showLandingPage);
  document.getElementById('back-from-multiplayer').addEventListener('click', showLandingPage);
  document.getElementById('back-from-multiplayer-game').addEventListener('click', () => {
    stopGameTimer();
    if (state.roomId) {
      socket.disconnect();
      socket.connect();
    }
    showLandingPage();
  });
  
  // Multiplayer buttons
  document.getElementById('create-game-btn').addEventListener('click', createMultiplayerGame);
  document.getElementById('join-game-btn').addEventListener('click', joinMultiplayerGame);
  
  // Copy code button
  document.getElementById('copy-code-btn').addEventListener('click', copyGameCode);
}

// Multiplayer functions
function createMultiplayerGame() {
  socket.emit('createGame');
  showMultiplayerGamePage();
  showWaitingArea();
}

function joinMultiplayerGame() {
  const gameCode = document.getElementById('game-code-input').value.trim();
  if (!gameCode) {
    alert('Please enter a game code');
    return;
  }
  
  socket.emit('joinGame', { roomUniqueId: gameCode });
  showMultiplayerGamePage();
  showWaitingArea();
}

function showWaitingArea() {
  document.getElementById('waiting-area').classList.remove('hidden');
  document.getElementById('countdown-area').classList.add('hidden');
  document.getElementById('multiplayer-game-area').classList.add('hidden');
}

function showCountdownArea() {
  document.getElementById('waiting-area').classList.add('hidden');
  document.getElementById('countdown-area').classList.remove('hidden');
  document.getElementById('multiplayer-game-area').classList.add('hidden');
}

function showGameArea() {
  document.getElementById('waiting-area').classList.add('hidden');
  document.getElementById('countdown-area').classList.add('hidden');
  document.getElementById('multiplayer-game-area').classList.remove('hidden');
}

function copyGameCode() {
  if (state.roomId) {
    navigator.clipboard.writeText(state.roomId).then(() => {
      alert('Game code copied to clipboard!');
    }).catch(err => {
      console.error('Could not copy text: ', err);
      // Fallback: show the code in an alert
      alert(`Game code: ${state.roomId}`);
    });
  }
}

function startMultiplayerGame() {
  resetGameState();
  
  const game = document.getElementById('multiplayer-game');
  game.innerHTML = '';
  drawGrid(game);
  
  registerKeyboardEvents();
  state.isGameActive = true;
  showGameArea();
  
  // Start the timer
  startGameTimer();
  
  console.log('Multiplayer game started. Secret word:', state.secret);
}

function startGameTimer() {
  state.gameStartTime = Date.now();
  state.timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
  if (!state.gameStartTime) return;
  
  const elapsed = Math.floor((Date.now() - state.gameStartTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  
  const timerDisplay = document.getElementById('timer-display');
  if (timerDisplay) {
    timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

function stopGameTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
  return getElapsedTime();
}

function getElapsedTime() {
  if (!state.gameStartTime) return '0:00';
  
  const elapsed = Math.floor((Date.now() - state.gameStartTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatGameResult(data) {
  const isCurrentPlayer = data.winner === socket.id;
  const isWinner = !!data.winner;
  
  if (isWinner) {
    if (isCurrentPlayer) {
      return `🎉 You won! Completed in ${data.attempts || state.currentRow} attempts in ${data.time || getElapsedTime()}`;
    } else {
      return `Your opponent won! They completed it in ${data.attempts || 'unknown'} attempts in ${data.time || 'unknown time'}`;
    }
  } else {
    return `Game completed! The word was: ${data.secretWord}`;
  }
}

// Socket.io event handlers
socket.on('newGame', (data) => {
  state.roomId = data.roomUniqueId;
  state.secret = data.secretWord;
  
  document.getElementById('waiting-text').textContent = 'Waiting for opponent to join...';
  document.getElementById('game-code-display').textContent = `Game Code: ${state.roomId}`;
  document.getElementById('copy-code-btn').style.display = 'block';
});

socket.on('playersConnected', (data) => {
  state.secret = data.secretWord;
  document.getElementById('waiting-text').textContent = 'Opponent joined! Game starting soon...';
  document.getElementById('copy-code-btn').style.display = 'none';
});

socket.on('countdown', (data) => {
  showCountdownArea();
  document.getElementById('countdown-number').textContent = data.count;
});

socket.on('gameStart', (data) => {
  state.secret = data.secretWord;
  startMultiplayerGame();
});

socket.on('opponentMove', (data) => {
  // Update opponent status
  const opponentGrid = data.grid;
  let opponentRow = 0;
  
  for (let i = 0; i < opponentGrid.length; i++) {
    if (opponentGrid[i].some(cell => cell !== '')) {
      opponentRow = i + 1;
    }
  }
  
  document.getElementById('opponent-row').textContent = opponentRow;
});

socket.on('playerFinished', (data) => {
  // Show notification that opponent finished
  const notification = document.getElementById('opponent-notification');
  const status = data.won ? 'won' : 'finished';
  notification.innerHTML = `
    <div>🎯 ${data.playerName} ${status}!</div>
    <div>Attempts: ${data.attempts}</div>
    <div>Time: ${data.time}</div>
    ${data.won ? '<div>🎉 They found the word!</div>' : ''}
  `;
  notification.classList.remove('hidden');
  
  // Continue letting current player play
  // Timer keeps running, game stays active
});

socket.on('gameFinished', (data) => {
  // Handle when current player finishes
  state.isGameActive = false;
  
  const resultDiv = document.getElementById('game-result');
  resultDiv.classList.remove('hidden');
  
  let message = '';
  if (data.won) {
    message = `🎉 You won! Completed in ${data.attempts} attempts in ${data.time}`;
  } else {
    message = `You finished! Used ${data.attempts} attempts in ${data.time}`;
  }
  
  if (data.waitingForOpponent) {
    message += '\n⏳ Waiting for your opponent to finish...';
  }
  
  resultDiv.innerHTML = `
    <p>${message}</p>
    <p>The word was: <strong>${data.secretWord}</strong></p>
  `;
});

socket.on('gameComplete', (data) => {
  // Final game results when both players finished
  state.isGameActive = false;
  stopGameTimer();
  
  const resultDiv = document.getElementById('game-result');
  resultDiv.classList.remove('hidden');
  
  let message = '';
  if (data.winner === socket.id) {
    message = '🏆 You are the overall winner!';
  } else if (data.winner) {
    message = '🥈 Your opponent won overall!';
  } else {
    message = '🤝 It\'s a tie!';
  }
  
  const player1Data = data.player1;
  const player2Data = data.player2;
  
  resultDiv.innerHTML = `
    <p>${message}</p>
    <div style="margin-top: 15px;">
      <div><strong>Final Results:</strong></div>
      <div>Player 1: ${player1Data.won ? '✅' : '❌'} ${player1Data.attempts} attempts in ${player1Data.time}</div>
      <div>Player 2: ${player2Data.won ? '✅' : '❌'} ${player2Data.attempts} attempts in ${player2Data.time}</div>
    </div>
    <p style="margin-top: 15px;">The word was: <strong>${data.secretWord}</strong></p>
  `;
  
  // Hide the notification
  document.getElementById('opponent-notification').classList.add('hidden');
});

socket.on('playerDisconnected', () => {
  alert('Your opponent disconnected. Returning to main menu.');
  showLandingPage();
});

socket.on('gameError', (data) => {
  alert(data.message);
  showMultiplayerPage();
});

startup();
// /cs/home/sam50/wordlegame/wordle-speedrun/src/index.js
// wordle-speedrun/src/index.js