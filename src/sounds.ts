import Sound from 'react-native-sound';

const createSound = (soundFile: string): Sound => {
  return new Sound(soundFile, Sound.MAIN_BUNDLE, error => {
    if (error) {
      console.error('Failed to load sound', error, soundFile);
      return;
    }
  });
};

const createSoundPool = (soundFile: string, poolSize: number = 4): Sound[] => {
  return Array.from(
    {length: poolSize},
    () =>
      new Sound(soundFile, Sound.MAIN_BUNDLE, error => {
        if (error) {
          console.error('Failed to load sound', error, soundFile);
        }
      }),
  );
};

const HIT_BALL_SOUND_POOL = createSoundPool('ball_hit.wav');

export {HIT_BALL_SOUND_POOL};
