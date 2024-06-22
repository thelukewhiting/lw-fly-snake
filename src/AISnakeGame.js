import React, { useState, useEffect, useCallback, useRef } from 'react';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }, { x: 9, y: 10 }];
const INITIAL_DIRECTION = { x: 1, y: 0 };
const INITIAL_FOOD = { x: 15, y: 15 };
const SPEED = 100;

const UltimateAISnakeGame = () => {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState(INITIAL_FOOD);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [error, setError] = useState(null);
  const [cellSize, setCellSize] = useState(30);
  const [gameSize, setGameSize] = useState(GRID_SIZE * cellSize);
  const svgRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      const minDimension = Math.min(window.innerWidth, window.innerHeight);
      const newCellSize = Math.floor((minDimension * 0.9) / GRID_SIZE);
      setCellSize(newCellSize);
      setGameSize(GRID_SIZE * newCellSize);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getNeighbors = useCallback((node, currentSnake) => {
    try {
      const neighbors = [
        { x: node.x - 1, y: node.y },
        { x: node.x + 1, y: node.y },
        { x: node.x, y: node.y - 1 },
        { x: node.x, y: node.y + 1 },
      ];
      return neighbors.filter(
        (n) =>
          n.x >= 0 &&
          n.x < GRID_SIZE &&
          n.y >= 0 &&
          n.y < GRID_SIZE &&
          !currentSnake.some((s) => s.x === n.x && s.y === n.y)
      );
    } catch (err) {
      console.error('Error in getNeighbors:', err);
      setError(err.message);
      return [];
    }
  }, []);

  const findPath = useCallback((start, goal, currentSnake) => {
    try {
      const queue = [[start]];
      const visited = new Set();

      while (queue.length > 0) {
        const path = queue.shift();
        const pos = path[path.length - 1];
        const key = `${pos.x},${pos.y}`;

        if (pos.x === goal.x && pos.y === goal.y) {
          return path;
        }

        if (!visited.has(key)) {
          visited.add(key);
          const neighbors = getNeighbors(pos, currentSnake);
          for (const neighbor of neighbors) {
            queue.push([...path, neighbor]);
          }
        }
      }

      return null;
    } catch (err) {
      console.error('Error in findPath:', err);
      setError(err.message);
      return null;
    }
  }, [getNeighbors]);

  const moveSnake = useCallback(() => {
    if (gameOver) return;

    try {
      setSnake((prevSnake) => {
        const head = prevSnake[0];
        let nextMove;

        const pathToFood = findPath(head, food, prevSnake);

        if (pathToFood && pathToFood.length > 1) {
          nextMove = pathToFood[1];
        } else {
          nextMove = { x: head.x + direction.x, y: head.y + direction.y };
          
          if (!getNeighbors(head, prevSnake).some(n => n.x === nextMove.x && n.y === nextMove.y)) {
            const safeNeighbors = getNeighbors(head, prevSnake);
            if (safeNeighbors.length > 0) {
              nextMove = safeNeighbors[0];
            } else {
              setGameOver(true);
              return prevSnake;
            }
          }
        }

        const newSnake = [nextMove, ...prevSnake];

        if (nextMove.x === food.x && nextMove.y === food.y) {
          setScore((prevScore) => prevScore + 1);
          setFood(getRandomFood(newSnake));
        } else {
          newSnake.pop();
        }

        if (
          nextMove.x < 0 || nextMove.x >= GRID_SIZE || nextMove.y < 0 || nextMove.y >= GRID_SIZE ||
          prevSnake.some((segment) => segment.x === nextMove.x && segment.y === nextMove.y)
        ) {
          setGameOver(true);
          return prevSnake;
        }

        setDirection({ x: nextMove.x - head.x, y: nextMove.y - head.y });
        return newSnake;
      });
    } catch (err) {
      console.error('Error in moveSnake:', err);
      setError(err.message);
    }
  }, [direction, food, gameOver, getNeighbors, findPath]);

  useEffect(() => {
    const gameLoop = setInterval(moveSnake, SPEED);
    return () => clearInterval(gameLoop);
  }, [moveSnake]);

  const getRandomFood = useCallback((currentSnake) => {
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (currentSnake.some((segment) => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood(INITIAL_FOOD);
    setGameOver(false);
    setScore(0);
    setError(null);
  };

  const renderGrid = () => {
    return (
      <g>
        {Array.from({ length: GRID_SIZE }).map((_, i) => (
          <line
            key={`v${i}`}
            x1={i * cellSize}
            y1={0}
            x2={i * cellSize}
            y2={gameSize}
            stroke="#34495E"
            strokeWidth="1"
          />
        ))}
        {Array.from({ length: GRID_SIZE }).map((_, i) => (
          <line
            key={`h${i}`}
            x1={0}
            y1={i * cellSize}
            x2={gameSize}
            y2={i * cellSize}
            stroke="#34495E"
            strokeWidth="1"
          />
        ))}
      </g>
    );
  };

  const renderSnake = () => {
    return (
      <g>
        {snake.map((segment, index) => (
          <rect
            key={index}
            x={segment.x * cellSize}
            y={segment.y * cellSize}
            width={cellSize}
            height={cellSize}
            rx={5}
            ry={5}
            fill={index === 0 ? '#2ECC71' : '#27AE60'}
          >
            <animate
              attributeName="fill"
              values={index === 0 ? '#2ECC71;#27AE60;#2ECC71' : '#27AE60;#2ECC71;#27AE60'}
              dur="1s"
              repeatCount="indefinite"
            />
          </rect>
        ))}
      </g>
    );
  };

  const renderFood = () => {
    return (
      <circle
        cx={(food.x * cellSize) + (cellSize / 2)}
        cy={(food.y * cellSize) + (cellSize / 2)}
        r={cellSize / 3}
        fill="#E74C3C"
      >
        <animate
          attributeName="r"
          values={`${cellSize / 3};${cellSize / 2.5};${cellSize / 3}`}
          dur="1s"
          repeatCount="indefinite"
        />
      </circle>
    );
  };

  if (error) {
    return <div>An error occurred: {error}</div>;
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#2C3E50',
      color: '#ECF0F1',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
      <h1 style={{ 
        fontSize: 'clamp(24px, 5vw, 36px)', 
        fontWeight: 'bold', 
        marginBottom: '20px',
        color: '#E74C3C',
        textAlign: 'center'
      }}>Ultimate AI Snake Game</h1>
      <svg
        ref={svgRef}
        width={gameSize}
        height={gameSize}
        style={{
          border: '3px solid #34495E',
          borderRadius: '10px',
          boxShadow: '0 0 20px rgba(0, 0, 0, 0.3)',
          maxWidth: '90vw',
          maxHeight: '90vh'
        }}
      >
        <rect width={gameSize} height={gameSize} fill="#2C3E50" />
        {renderGrid()}
        {renderSnake()}
        {renderFood()}
      </svg>
      <div style={{ 
        marginTop: '20px', 
        fontSize: 'clamp(18px, 4vw, 24px)',
        fontWeight: 'bold'
      }}>Score: {score}</div>
      <div style={{ 
        marginTop: '20px', 
        fontSize: 'clamp(14px, 3vw, 16px)', 
        color: '#BDC3C7',
        textAlign: 'center'
      }}>
        AI is controlling the snake
        {gameOver && (
          <div style={{ marginTop: '10px' }}>
            <p style={{ fontSize: 'clamp(24px, 5vw, 28px)', fontWeight: 'bold', color: '#E74C3C' }}>Game Over!</p>
            <button
              style={{
                marginTop: '10px',
                padding: '12px 24px',
                backgroundColor: '#3498DB',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: 'clamp(16px, 3vw, 18px)',
                transition: 'background-color 0.3s'
              }}
              onClick={resetGame}
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UltimateAISnakeGame;