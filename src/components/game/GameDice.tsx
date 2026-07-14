import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { GameState } from '@/lib/types';

interface GameDiceProps {
  gameState: GameState;
}

const EMPTY_PATTERN = [false, false, false, false];
const PIP_COLOR = '#eee7d8';
const PIP_SIZE = 7;
const FACE_SIZE = 14;

function getDicePattern(total: number): boolean[] {
  const pattern = [...EMPTY_PATTERN];

  for (let marked = 0; marked < total;) {
    const index = Math.floor(Math.random() * pattern.length);
    if (!pattern[index]) {
      pattern[index] = true;
      marked += 1;
    }
  }

  return pattern;
}

export default function GameDice({ gameState }: GameDiceProps) {
  const [rolling, setRolling] = useState(false);
  const [displayPattern, setDisplayPattern] = useState<boolean[]>(EMPTY_PATTERN);
  const [lastRoll, setLastRoll] = useState<{ pattern: boolean[]; value: number } | null>(null);
  const [burst, setBurst] = useState(false);
  const [numberPulse, setNumberPulse] = useState(false);

  useEffect(() => {
    const roll = gameState.diceRoll;
    if (roll === null) {
      setRolling(false);
      setBurst(false);
      setNumberPulse(false);
      return;
    }

    setRolling(true);
    setBurst(false);
    setNumberPulse(false);

    let ticks = 0;
    let burstTimer: number | undefined;
    let pulseTimer: number | undefined;
    const interval = window.setInterval(() => {
      setDisplayPattern(getDicePattern(Math.floor(Math.random() * 5)));
      ticks += 1;

      if (ticks < 8) return;

      window.clearInterval(interval);
      const pattern = getDicePattern(roll);
      setDisplayPattern(pattern);
      setLastRoll({ pattern, value: roll });
      setRolling(false);
      setBurst(true);
      setNumberPulse(true);
      burstTimer = window.setTimeout(() => setBurst(false), 350);
      pulseTimer = window.setTimeout(() => setNumberPulse(false), 500);
    }, 80);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(burstTimer);
      window.clearTimeout(pulseTimer);
    };
  }, [gameState.diceRoll]);

  const hasActiveRoll = gameState.diceRoll !== null;
  const pattern = hasActiveRoll ? displayPattern : (lastRoll?.pattern ?? EMPTY_PATTERN);
  const value = hasActiveRoll ? (rolling ? null : gameState.diceRoll) : lastRoll?.value;
  const ariaLabel = rolling
    ? 'Dice rolling'
    : value === undefined
      ? 'Dice not rolled'
      : `Dice roll: ${value}`;

  return (
    <motion.div
      className="surface-inset relative flex h-10 min-h-[40px] w-24 min-w-[96px] items-center overflow-visible rounded-lg"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 34 }}
      data-testid="dice-display"
      role="img"
      aria-label={ariaLabel}
    >
      <div className="flex h-full flex-1 items-center justify-between px-3">
        {pattern.map((isMarked, index) => (
          <motion.svg
            key={index}
            width={FACE_SIZE}
            height={FACE_SIZE}
            viewBox={`0 0 ${FACE_SIZE} ${FACE_SIZE}`}
            className="overflow-visible"
            animate={
              rolling
                ? { scale: [1, 1.18, 1], opacity: [0.5, 1, 0.5] }
                : isMarked
                  ? {
                      scale: [1, burst ? 1.3 : 1, 1],
                      opacity: 1,
                    }
                  : { scale: 1, opacity: 0.16 }
            }
            transition={{
              duration: rolling ? 0.4 : burst ? 0.35 : 0.2,
              repeat: rolling ? Infinity : 0,
            }}
            aria-hidden="true"
          >
            {isMarked && (
              <circle cx={FACE_SIZE / 2} cy={FACE_SIZE / 2} r={PIP_SIZE / 2} fill={PIP_COLOR} />
            )}
          </motion.svg>
        ))}

        <motion.span
          className="w-4 select-none text-center font-mono text-sm font-semibold leading-none text-brass-light"
          animate={
            numberPulse
              ? {
                  scale: [1, 1.3, 1],
                }
              : { scale: 1 }
          }
          transition={{ duration: 0.5 }}
          aria-hidden="true"
        >
          {value}
        </motion.span>
      </div>

      <AnimatePresence>
        {burst && (
          <motion.div
            className="pointer-events-none absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-brass"
            initial={{ opacity: 0.7, scale: 0.7 }}
            animate={{ opacity: 0, scale: 1.8 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          ></motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
