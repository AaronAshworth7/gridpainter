const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const db = new sqlite3.Database('pixelGrid.db'); // SQLite database file

// Create a table to store grid data
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS grids (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT
    )
  `);
});

// Function to get the initial grid from the database
const getInitialGrid = (socket) => {
  db.get('SELECT * FROM grids ORDER BY id DESC LIMIT 1', (err, row) => {
    if (err) {
      console.error(err.message);
    } else {
      const initialGrid = row ? JSON.parse(row.data) : null;
      socket.emit('receiveGrid', initialGrid || createEmptyGrid()); // Use createEmptyGrid if no data is found
    }
  });
};

// Function to update the grid in the database
const updateGrid = (data) => {
  db.run('INSERT INTO grids (data) VALUES (?)', [JSON.stringify(data)], (err) => {
    if (err) {
      console.error(err.message);
    }
  });
};

// Function to create an empty grid
const createEmptyGrid = () => {
  return Array(TOTAL_GRIDS).fill().map(() => Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill('#ffffff')));
};

io.on('connection', (socket) => {
  console.log('A user connected');

  // Get the initial grid when a user connects
  getInitialGrid(socket);

  socket.on('updateGrid', (data) => {
    // Update the grid in the database
    updateGrid(data);

    // Broadcast the updated grid to all connected clients
    io.emit('receiveGrid', data);
  });

  socket.on('getInitialGrid', () => {
    // Get the initial grid when requested by a client
    getInitialGrid(socket);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
