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

const MOVE_CARD_SOUND = createSound('move.wav');
const SHUFFLE_CARDS_SOUND = createSound('shuffle.wav');
const SPREAD_CARDS_SOUND = createSound('spread.wav');

export {
  HIT_BALL_SOUND_POOL,
  MOVE_CARD_SOUND,
  SHUFFLE_CARDS_SOUND,
  SPREAD_CARDS_SOUND,
};
