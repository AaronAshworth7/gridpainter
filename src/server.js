// server.js
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3001;

io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle grid updates
  socket.on('updateGrid', (updatedGrids) => {
    io.emit('receiveGrid', updatedGrids);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
