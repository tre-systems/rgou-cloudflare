'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState } from '@/lib/types';

interface GameDiceProps {
  gameState: GameState;
}

export default function GameDice({ gameState }: GameDiceProps) {
  const [rolling, setRolling] = useState(false);
  const [displayPattern, setDisplayPattern] = useState<boolean[]>([false, false, false, false]);
  const [lastRoll, setLastRoll] = useState<{ pattern: boolean[]; value: number } | null>(null);
  const [burst, setBurst] = useState(false);
  const [numberPulse, setNumberPulse] = useState(false);

  // Helper to generate a random pattern of 4 dice for a given total
  function getDicePattern(total: number): boolean[] {
    const arr = [false, false, false, false];
    let count = 0;
    while (count < total) {
      const idx = Math.floor(Math.random() * 4);
      if (!arr[idx]) {
        arr[idx] = true;
        count++;
      }
    }
    return arr;
  }

  useEffect(() => {
    if (gameState.diceRoll === null) {
      setRolling(false);
      setBurst(false);
      setNumberPulse(false);
      return;
    }
    setRolling(true);
    setBurst(false);
    setNumberPulse(false);
    let ticks = 0;
    const maxTicks = 8;
    const interval = setInterval(() => {
      setDisplayPattern(getDicePattern(Math.floor(Math.random() * 5)));
      ticks++;
      if (ticks >= maxTicks) {
        clearInterval(interval);
        const pattern = getDicePattern(gameState.diceRoll!);
        setDisplayPattern(pattern);
        setLastRoll({ pattern, value: gameState.diceRoll! });
        setRolling(false);
        setBurst(true);
        setNumberPulse(true);
        setTimeout(() => setBurst(false), 350);
        setTimeout(() => setNumberPulse(false), 500);
      }
    }, 80);
    return () => clearInterval(interval);
  }, [gameState.diceRoll]);

  const pipColor = '#FFD600';
  const pipGlow = '#FFF200';
  const pipSize = 7;
  const pipFinalSize = 14;
  const borderColor = 'rgba(253, 230, 138, 0.3)';
  const borderWidth = 1.5;

  if (gameState.diceRoll === null) {
    if (lastRoll) {
      return (
        <motion.div
          className="flex items-center min-w-[96px] min-h-[40px] h-10 w-24 bg-black/30 rounded-xl px-0 border-box"
          style={{ border: `${borderWidth}px solid ${borderColor}`, boxSizing: 'border-box' }}
          initial={{ scale: 0 }}
          animate={{
            scale: 1,
            x: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 25,
            x: { duration: 0.5, repeat: Infinity, ease: 'easeInOut' },
            backgroundColor: { duration: 1, repeat: Infinity, ease: 'easeInOut' },
          }}
          data-testid="roll-dice"
        >
          <div className="flex flex-1 items-center justify-between h-full px-3">
            {lastRoll.pattern.map((isDot, i) => (
              <svg
                key={i}
                width={pipFinalSize}
                height={pipFinalSize}
                viewBox={`0 0 ${pipFinalSize} ${pipFinalSize}`}
                style={{ display: 'block', overflow: 'visible' }}
              >
                {isDot && (
                  <circle
                    cx={pipFinalSize / 2}
                    cy={pipFinalSize / 2}
                    r={pipSize / 2}
                    fill={pipColor}
                    style={{ filter: `drop-shadow(0 0 2px ${pipGlow})` }}
                  />
                )}
              </svg>
            ))}
            <span
              className="text-yellow-400 font-bold tracking-wider text-base w-4 text-center select-none"
              style={{
                textShadow: '0 0 6px #FFD600, 0 0 2px #fff',
                lineHeight: '1',
                alignSelf: 'center',
              }}
            >
              {lastRoll.value}
            </span>
          </div>
        </motion.div>
      );
    } else {
      return (
        <motion.div
          className="flex items-center min-w-[96px] min-h-[40px] h-10 w-24 bg-black/30 rounded-xl px-0 border-box"
          style={{ border: `${borderWidth}px solid ${borderColor}`, boxSizing: 'border-box' }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          data-testid="roll-dice"
        >
          <div className="flex flex-1 items-center justify-between h-full px-3">
            {[0, 1, 2, 3].map(i => (
              <svg
                key={i}
                width={pipFinalSize}
                height={pipFinalSize}
                viewBox={`0 0 ${pipFinalSize} ${pipFinalSize}`}
                style={{ display: 'block' }}
              />
            ))}
            <span
              className="text-yellow-400 font-bold tracking-wider text-base w-4 text-center select-none"
              style={{
                textShadow: '0 0 6px #FFD600, 0 0 2px #fff',
                lineHeight: '1',
                alignSelf: 'center',
              }}
            />
          </div>
        </motion.div>
      );
    }
  }

  return (
    <motion.div
      className="flex items-center min-w-[96px] min-h-[40px] h-10 w-24 bg-black/30 rounded-xl px-0 border-box relative overflow-visible"
      style={{ border: `${borderWidth}px solid ${borderColor}`, boxSizing: 'border-box' }}
      initial={{ scale: 0 }}
      animate={{
        scale: 1,
        x: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25,
        x: { duration: 0.5, repeat: Infinity, ease: 'easeInOut' },
        backgroundColor: { duration: 1, repeat: Infinity, ease: 'easeInOut' },
      }}
      data-testid="roll-dice"
    >
      <div className="flex flex-1 items-center justify-between h-full px-3">
        {displayPattern.map((isDot, i) => (
          <motion.svg
            key={i}
            width={pipFinalSize}
            height={pipFinalSize}
            viewBox={`0 0 ${pipFinalSize} ${pipFinalSize}`}
            style={{ display: 'block', overflow: 'visible' }}
            animate={
              rolling
                ? { scale: [1, 1.25, 1], filter: 'drop-shadow(0 0 3px #FFF200)' }
                : isDot
                  ? {
                      scale: [1, burst ? 1.5 : 1, 1],
                      filter: burst
                        ? 'drop-shadow(0 0 6px #FFF200)'
                        : 'drop-shadow(0 0 3px #FFD600)',
                    }
                  : { scale: 1, filter: 'none' }
            }
            transition={{
              duration: rolling ? 0.4 : burst ? 0.35 : 0.2,
              repeat: rolling ? Infinity : 0,
            }}
          >
            {isDot && (
              <circle
                cx={pipFinalSize / 2}
                cy={pipFinalSize / 2}
                r={pipSize / 2}
                fill={pipColor}
                style={{ filter: `drop-shadow(0 0 2px ${pipGlow})` }}
              />
            )}
          </motion.svg>
        ))}
        <motion.span
          className="font-bold tracking-wider text-center select-none"
          style={{
            textShadow: '0 0 10px #FFD600, 0 0 2px #fff',
            lineHeight: '1',
            alignSelf: 'center',
            marginLeft: '4px',
          }}
          animate={
            numberPulse
              ? {
                  scale: [1, 1.3, 1],
                  textShadow: '0 0 24px #FFD600, 0 0 2px #fff',
                }
              : { scale: 1 }
          }
          transition={{ duration: 0.5 }}
        >
          {rolling ? '' : gameState.diceRoll}
        </motion.span>
      </div>
      <AnimatePresence>
        {burst && (
          <motion.div
            className="absolute left-1/2 top-1/2 pointer-events-none"
            style={{ transform: 'translate(-50%, -50%)' }}
            initial={{ opacity: 0.7, scale: 0.7 }}
            animate={{ opacity: 0, scale: 2.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            {[...Array(8)].map((_, j) => (
              <div
                key={j}
                style={{
                  position: 'absolute',
                  left: pipFinalSize / 2,
                  top: pipFinalSize / 2,
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: pipColor,
                  boxShadow: `0 0 12px 4px ${pipGlow}`,
                  transform: `rotate(${j * 45}deg) translateY(-18px)`,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
