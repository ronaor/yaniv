import {useCallback, useRef} from 'react';
import Sound from 'react-native-sound';

const useSoundPool = (soundPool: Sound[]) => {
  const playIndex = useRef(0);

  const playSound = useCallback(() => {
    const sound = soundPool[playIndex.current];

    // Cycle to next sound in pool
    playIndex.current = (playIndex.current + 1) % soundPool.length;

    sound.play(success => {
      if (!success) {
        console.error('Sound playback failed');
      }
    });
  }, [soundPool]);

  return {playSound};
};

export default useSoundPool;
