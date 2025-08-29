import {useCallback, useRef} from 'react';
import Sound from 'react-native-sound';
import {useSoundStore} from './useSound';

const useSoundPool = (soundPool: Sound[]) => {
  const playIndex = useRef(0);
  const isSoundEnabled = useSoundStore(state => state.isSoundEnabled);

  const playSound = useCallback(() => {
    if (!isSoundEnabled) {
      return;
    }
    const sound = soundPool[playIndex.current];

    // Cycle to next sound in pool
    playIndex.current = (playIndex.current + 1) % soundPool.length;

    sound.play(success => {
      if (!success) {
        console.error('Sound playback failed');
      }
    });
  }, [isSoundEnabled, soundPool]);

  return {playSound};
};

export default useSoundPool;
