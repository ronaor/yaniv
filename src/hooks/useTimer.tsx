import {useEffect, useState} from 'react';

export const useTimer = (
  active: boolean,
  startTime: Date | undefined,
  timePerPlayer: number,
  gamePhase: string,
) => {
  const [timeRemaining, setTimeRemaining] = useState(timePerPlayer);

  useEffect(() => {
    if (!active || !startTime || gamePhase !== 'active') {
      setTimeRemaining(timePerPlayer); // Set default time when not active
      return;
    }

    // Calculate initial time immediately
    const calculateTime = () => {
      const elapsed = (Date.now() - new Date(startTime).getTime()) / 1000;
      const remaining = timePerPlayer - Math.floor(elapsed);
      return Math.max(0, remaining);
    };

    // Set initial time
    setTimeRemaining(calculateTime());

    const interval = setInterval(() => {
      const remaining = calculateTime();
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [active, startTime, timePerPlayer, gamePhase]);

  return timeRemaining;
};
