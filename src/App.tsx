import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- Types ---
type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

// --- Constants ---
const GRID_SIZE = 20;
const INITIAL_SNAKE: Point[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION: Direction = 'UP';
const GAME_SPEED = 100;

const TRACKS = [
  {
    id: 1,
    title: 'STIMULUS_01.WAV',
    artist: 'SYS.OP.1',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    id: 2,
    title: 'STIMULUS_02.WAV',
    artist: 'SYS.OP.2',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  },
  {
    id: 3,
    title: 'STIMULUS_03.WAV',
    artist: 'SYS.OP.3',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  },
];

// --- Helper Functions ---
const generateFood = (snake: Point[]): Point => {
  let newFood: Point;
  while (true) {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    // eslint-disable-next-line no-loop-func
    if (!snake.some((segment) => segment.x === newFood.x && segment.y === newFood.y)) {
      break;
    }
  }
  return newFood;
};

export default function App() {
  // --- Game State ---
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isGamePaused, setIsGamePaused] = useState(false);

  // --- Music State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentTrack = TRACKS[currentTrackIndex];

  // --- Game Logic ---
  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood(generateFood(INITIAL_SNAKE));
    setScore(0);
    setGameOver(false);
    setIsGamePaused(false);
  };

  const moveSnake = useCallback(() => {
    if (gameOver || isGamePaused) return;

    setSnake((prevSnake) => {
      const head = prevSnake[0];
      const newHead = { ...head };

      switch (direction) {
        case 'UP':
          newHead.y -= 1;
          break;
        case 'DOWN':
          newHead.y += 1;
          break;
        case 'LEFT':
          newHead.x -= 1;
          break;
        case 'RIGHT':
          newHead.x += 1;
          break;
      }

      // Check collision with walls
      if (
        newHead.x < 0 ||
        newHead.x >= GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= GRID_SIZE
      ) {
        setGameOver(true);
        return prevSnake;
      }

      // Check collision with self
      if (prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
        setGameOver(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check food collision
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore((s) => {
          const newScore = s + 10;
          if (newScore > highScore) setHighScore(newScore);
          return newScore;
        });
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, gameOver, isGamePaused, highScore]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ') {
        if (gameOver) {
          resetGame();
        } else {
          setIsGamePaused((p) => !p);
        }
        return;
      }

      setDirection((prev) => {
        switch (e.key) {
          case 'ArrowUp':
          case 'w':
          case 'W':
            return prev !== 'DOWN' ? 'UP' : prev;
          case 'ArrowDown':
          case 's':
          case 'S':
            return prev !== 'UP' ? 'DOWN' : prev;
          case 'ArrowLeft':
          case 'a':
          case 'A':
            return prev !== 'RIGHT' ? 'LEFT' : prev;
          case 'ArrowRight':
          case 'd':
          case 'D':
            return prev !== 'LEFT' ? 'RIGHT' : prev;
          default:
            return prev;
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver]);

  useEffect(() => {
    const gameInterval = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(gameInterval);
  }, [moveSnake]);

  // --- Music Logic ---
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch((e) => console.error("Audio play failed:", e));
    } else if (!isPlaying && audioRef.current) {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTrackIndex]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const handleTrackEnd = () => {
    nextTrack();
  };

  return (
    <div className="min-h-screen bg-black text-[#0ff] flex flex-col items-center justify-center p-4 font-mono overflow-hidden relative selection:bg-[#f0f] selection:text-white">
      <div className="scanlines" />
      <div className="crt-overlay" />
      
      <div className="z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start screen-tear">
        
        {/* Left Column: Diagnostics */}
        <div className="lg:col-span-3 flex flex-col gap-8 order-2 lg:order-1">
          <div>
            <h1 className="text-3xl md:text-4xl font-pixel glitch-text mb-4" data-text="PROTOCOL: OROBOROS">
              PROTOCOL:<br/>OROBOROS
            </h1>
            <p className="text-[#f0f] text-xl bg-[#0ff] text-black inline-block px-2 font-bold">STATUS: ACTIVE</p>
          </div>

          <div className="p-4 border-glitch bg-black">
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-lg text-[#f0f] mb-1">&gt; DATA_YIELD</p>
                <p className="text-4xl font-pixel text-white">{score.toString().padStart(4, '0')}</p>
              </div>
              <div className="h-0.5 w-full bg-[#0ff]" />
              <div>
                <p className="text-lg text-[#f0f] mb-1">&gt; MAX_CAPACITY</p>
                <p className="text-2xl font-pixel text-[#0ff]">{highScore.toString().padStart(4, '0')}</p>
              </div>
            </div>
          </div>
          
          <div className="hidden lg:block text-xl space-y-2">
            <p className="text-[#f0f]">&gt; INPUT_VECTORS:</p>
            <p>[W][A][S][D] : NAVIGATE</p>
            <p>[SPACE]      : HALT/RESUME</p>
          </div>
        </div>

        {/* Center Column: Game Board */}
        <div className="lg:col-span-6 flex flex-col items-center order-1 lg:order-2">
          <div className="relative p-1 border-glitch-alt bg-black">
            <div 
              className="grid bg-[#001111]"
              style={{ 
                gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                width: 'min(90vw, 450px)',
                height: 'min(90vw, 450px)'
              }}
            >
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                const x = i % GRID_SIZE;
                const y = Math.floor(i / GRID_SIZE);
                const isSnake = snake.some((segment) => segment.x === x && segment.y === y);
                const isHead = snake[0].x === x && snake[0].y === y;
                const isFood = food.x === x && food.y === y;

                return (
                  <div
                    key={i}
                    className={`
                      w-full h-full border-[1px] border-[#0ff]/10
                      ${isHead ? 'bg-[#fff]' : ''}
                      ${isSnake && !isHead ? 'bg-[#0ff]' : ''}
                      ${isFood ? 'bg-[#f0f] animate-pulse' : ''}
                    `}
                  />
                );
              })}
            </div>

            {/* Overlays */}
            {gameOver && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-20 border-4 border-[#f0f]">
                <h2 className="text-3xl font-pixel text-[#f0f] mb-4 glitch-text text-center" data-text="FATAL_EXCEPTION">FATAL<br/>EXCEPTION</h2>
                <p className="text-2xl mb-8">&gt; YIELD: {score}</p>
                <button 
                  onClick={resetGame}
                  className="px-6 py-3 bg-[#0ff] text-black font-pixel text-sm hover:bg-[#f0f] hover:text-white transition-none"
                >
                  [ REBOOT_SEQUENCE ]
                </button>
              </div>
            )}

            {isGamePaused && !gameOver && (
              <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-20">
                <h2 className="text-2xl font-pixel text-[#0ff] animate-pulse">SYSTEM_HALTED</h2>
              </div>
            )}
          </div>

          {/* Mobile Controls */}
          <div className="grid grid-cols-3 gap-2 mt-8 lg:hidden w-full max-w-[200px]">
            <div />
            <button 
              onClick={() => setDirection(prev => prev !== 'DOWN' ? 'UP' : prev)} 
              className="bg-black border-2 border-[#0ff] p-4 flex justify-center active:bg-[#f0f] active:border-[#f0f] text-[#0ff] active:text-white font-pixel"
            >
              ^
            </button>
            <div />
            <button 
              onClick={() => setDirection(prev => prev !== 'RIGHT' ? 'LEFT' : prev)} 
              className="bg-black border-2 border-[#0ff] p-4 flex justify-center active:bg-[#f0f] active:border-[#f0f] text-[#0ff] active:text-white font-pixel"
            >
              &lt;
            </button>
            <button 
              onClick={() => setDirection(prev => prev !== 'UP' ? 'DOWN' : prev)} 
              className="bg-black border-2 border-[#0ff] p-4 flex justify-center active:bg-[#f0f] active:border-[#f0f] text-[#0ff] active:text-white font-pixel"
            >
              v
            </button>
            <button 
              onClick={() => setDirection(prev => prev !== 'LEFT' ? 'RIGHT' : prev)} 
              className="bg-black border-2 border-[#0ff] p-4 flex justify-center active:bg-[#f0f] active:border-[#f0f] text-[#0ff] active:text-white font-pixel"
            >
              &gt;
            </button>
          </div>
        </div>

        {/* Right Column: Audio Stimulus */}
        <div className="lg:col-span-3 flex flex-col gap-6 order-3">
          <div className="p-4 border-glitch bg-black">
            <div className="mb-6">
              <p className="text-xl text-[#f0f] mb-2">&gt; AUDIO_STIMULUS</p>
              <div className="h-20 border-2 border-[#0ff] flex items-end gap-1 p-1 overflow-hidden bg-[#001111]">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`flex-1 bg-[#f0f] ${isPlaying ? 'eq-bar' : ''}`}
                    style={{ 
                      height: isPlaying ? '10%' : '10%',
                      animationDelay: `${Math.random() * 0.5}s`
                    }}
                  />
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="font-pixel text-xs truncate w-full mb-2 text-white">{currentTrack.title}</h3>
              <p className="text-xl text-[#0ff]">BY: {currentTrack.artist}</p>
            </div>

            <div className="flex items-center justify-between mb-6 border-y-2 border-[#f0f] py-4">
              <button onClick={prevTrack} className="text-[#0ff] hover:text-[#f0f] font-pixel text-xs">
                [PREV]
              </button>
              <button 
                onClick={togglePlay} 
                className="text-black bg-[#0ff] px-4 py-2 font-pixel text-xs hover:bg-[#f0f] hover:text-white"
              >
                {isPlaying ? 'HALT' : 'EXEC'}
              </button>
              <button onClick={nextTrack} className="text-[#0ff] hover:text-[#f0f] font-pixel text-xs">
                [NEXT]
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-lg">
                <span className="text-[#f0f]">&gt; VOL</span>
                <span>{(volume * 100).toFixed(0)}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-2 bg-black border border-[#0ff] appearance-none cursor-pointer rounded-none"
                style={{ accentColor: '#f0f' }}
              />
            </div>
          </div>
        </div>
      </div>

      <audio 
        ref={audioRef}
        src={currentTrack.url}
        onEnded={handleTrackEnd}
        preload="auto"
      />
    </div>
  );
}
