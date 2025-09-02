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

const THROW_CARD_SOUND = createSound('thrown.wav');
const CLICK_SOUND = createSound('click.wav');
const SHUFFLE_CARDS_SOUND = createSound('shuffle.wav');
const SPREAD_CARDS_SOUND = createSound('spread.wav');
const ERROR_SOUND = createSound('error.wav');
const WRONG_SOUND = createSound('wrong.m4a');

export {
  HIT_BALL_SOUND_POOL,
  THROW_CARD_SOUND,
  SHUFFLE_CARDS_SOUND,
  SPREAD_CARDS_SOUND,
  CLICK_SOUND,
  ERROR_SOUND,
  WRONG_SOUND,
};
