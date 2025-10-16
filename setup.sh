#!/bin/bash

echo "Setting up Wordle Multiplayer Server..."

# Navigate to server directory
cd WordleGame/server

# Install dependencies
echo "Installing dependencies..."
npm install

echo "Setup complete!"
echo ""
echo "To start the server, run:"
echo "cd server && npm run dev"
echo "only run npm run dev once after that you can just type npm start"
echo ""
echo "Then open your browser to: http://localhost:3000"
