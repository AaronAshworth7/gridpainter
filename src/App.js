import React, { useState, useEffect } from 'react';
import './App.css';
import { io } from 'socket.io-client';

const PIXEL_SIZE = 10;
const GRID_SIZE = 1080 / PIXEL_SIZE;
const TOTAL_GRIDS = 3;
const COOLDOWN_TIME = 500;

const socket = io('http://localhost:3001'); // Adjust the server URL

const App = () => {
  const [grids, setGrids] = useState(() => {
    const savedGrids = JSON.parse(localStorage.getItem('pixelGrids'));
    return savedGrids || Array(TOTAL_GRIDS).fill().map(() => Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill('#ffffff')));
  });
  const [currentColor, setCurrentColor] = useState('#000000');
  const [isPainting, setIsPainting] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);

  useEffect(() => {
    localStorage.setItem('pixelGrids', JSON.stringify(grids));
    socket.emit('updateGrid', grids);
  }, [grids]);

  useEffect(() => {
    socket.on('receiveGrid', (updatedGrids) => {
      setGrids(updatedGrids);
    });
  }, []);

  const handleColorChange = (event) => {
    setCurrentColor(event.target.value);
  };

  const handlePixelClick = (gridIndex, row, col) => {
    const userInfoOutput = document.getElementById('userInfoOutput');
    if (!isCooldown) {
      const newGrids = grids.map((grid, i) => {
        if (i === gridIndex) {
          return grid.map((rowArray, rowIndex) => {
            if (rowIndex === row) {
              return rowArray.map((color, colIndex) => (colIndex === col ? currentColor : color));
            }
            return rowArray;
          });
        }
        return grid;
      });
      setGrids(newGrids);
      setIsCooldown(true);
      setTimeout(() => {
        setIsCooldown(false);
      }, COOLDOWN_TIME);
      userInfoOutput.innerHTML = `Pixel painted!`;
      userInfoOutput.style.color = 'green';
    } else {
      const remainingTime = (COOLDOWN_TIME - (Date.now() % COOLDOWN_TIME)) / 1000;
      userInfoOutput.innerHTML = `Sorry! Please wait ${remainingTime.toFixed(1)} seconds.`;
      userInfoOutput.style.color = 'red';
    }
  };

  const handlePainting = () => {
    setIsPainting(true);
  };

  const handleNotPainting = () => {
    setIsPainting(false);
  };

  const handleClearCanvas = () => {
    setGrids(Array(TOTAL_GRIDS).fill().map(() => Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill('#ffffff'))));
  };

  const countHexCodes = () => {
    const counts = {};
    grids.forEach((grid) => {
      grid.forEach((rowArray) => {
        rowArray.forEach((color) => {
          if (color !== '#ffffff') {
            if (counts[color]) {
              counts[color]++;
            } else {
              counts[color] = 1;
            }
          }
        });
      });
    });
    return counts;
  };

  const hexCodeCounts = countHexCodes();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2>Hex Code Leaderboard</h2>
      <ul>
        {Object.entries(hexCodeCounts)
          .sort(([, a], [, b]) => b - a)
          .map(([hexCode, count]) => (
            <li key={hexCode} style={{ color: hexCode }}>
              {hexCode}: {count}
            </li>
          ))}
      </ul>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <p id="userInfoOutput">Welcome to Hex Wars!</p>
        <button onClick={handleClearCanvas}>Clear Canvas</button>
        <input type="color" value={currentColor} onChange={handleColorChange} />
        <div style={{ display: 'flex' }}>
          {grids.map((grid, gridIndex) => (
            <div
              key={gridIndex}
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${GRID_SIZE}, ${PIXEL_SIZE}px)`,
                gridTemplateRows: `repeat(${GRID_SIZE}, ${PIXEL_SIZE}px)`,
                marginBottom: '20px', // Adjust as needed
              }}
            >
              {grid.map((rowArray, rowIndex) =>
                rowArray.map((color, colIndex) => (
                  <div
                    key={`${gridIndex}-${rowIndex}-${colIndex}`}
                    style={{
                      width: PIXEL_SIZE,
                      height: PIXEL_SIZE,
                      backgroundColor: color,
                      border: '1px solid #ccc',
                    }}
                    onMouseDown={() => handlePixelClick(gridIndex, rowIndex, colIndex)}
                    onMouseUp={() => handleNotPainting()}
                  />
                ))
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
