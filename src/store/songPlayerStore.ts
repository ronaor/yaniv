import AsyncStorage from '@react-native-async-storage/async-storage';
import Sound from 'react-native-sound';
import {create} from 'zustand';
import {subscribeWithSelector} from 'zustand/middleware';

interface MusicContext {
  playlist: string[];
  currentIndex: number;
  isLooping: boolean;
  wasPlaying: boolean;
  wasDucked: boolean;
}

interface SongPlayerState {
  isMusicEnabled: boolean;
  currentSong: Sound | null;
  playlist: string[];
  currentSongIndex: number;
  isPlaying: boolean;
  isLooping: boolean;
  isDucked: boolean;
  isFading: boolean;
  duckingTimeout: NodeJS.Timeout | null;
  fadeInterval: NodeJS.Timeout | null;
  currentVolume: number;
  musicContext: MusicContext | null;
}

interface SongPlayerActions {
  startNewSong: (
    songs: string[],
    options?: {withFade?: boolean; loop?: boolean},
  ) => Promise<void>;
  duckVolume: () => void;
  restoreVolume: () => void;
  stopCurrentSong: (clearContext?: boolean) => void;
  setIsMusicEnabled: (value: boolean) => void;
  _handleMusicEnabledChange: (enabled: boolean) => Promise<void>;
}

type SongPlayerStore = SongPlayerState & SongPlayerActions;

const DUCK_VOLUME = 0.0;
const DUCK_CLEANUP_DELAY = 13000;
const FADE_DURATION = 5000;
const FADE_STEPS = 20;
const FADE_INTERVAL = FADE_DURATION / FADE_STEPS;
const STORAGE_KEY = '@music';

const useSongPlayerStore = create<SongPlayerStore>()(
  subscribeWithSelector((set, get) => ({
    // State
    isMusicEnabled: true,
    currentSong: null,
    playlist: [],
    currentSongIndex: 0,
    isPlaying: false,
    isLooping: false,
    isDucked: false,
    isFading: false,
    duckingTimeout: null,
    fadeInterval: null,
    currentVolume: 1.0,
    musicContext: null,

    // Actions
    startNewSong: async (songs, options = {}) => {
      const {withFade = false, loop = false} = options;
      const state = get();

      // Check if sound is globally enabled
      if (!state.isMusicEnabled) {
        // Store context for when music gets re-enabled
        set({
          musicContext: {
            playlist: songs,
            currentIndex: 0,
            isLooping: loop,
            wasPlaying: true,
            wasDucked: false,
          },
        });
        return;
      }

      // Check if same playlist is already playing (including ducked state)
      const isSamePlaylist =
        state.playlist.length === songs.length &&
        state.playlist.every((song, index) => song === songs[index]) &&
        state.isLooping === loop &&
        (state.isPlaying || state.isDucked);

      // Check if trying to start same single song that's already playing/ducked
      const isSameSingleSong =
        songs.length === 1 &&
        state.playlist.length > 0 &&
        state.playlist[state.currentSongIndex] === songs[0] &&
        (state.isPlaying || state.isDucked);

      if (isSamePlaylist || isSameSingleSong) {
        console.log('Same song/playlist already playing, skipping restart');
        // If it's ducked, restore volume instead of restarting
        if (state.isDucked) {
          get().restoreVolume();
        }
        return;
      }

      // Stop current song if playing
      if (state.currentSong) {
        get().stopCurrentSong(false); // Don't clear context when starting new song
      }

      // Set new playlist
      set({
        playlist: songs,
        currentSongIndex: 0,
        isLooping: loop,
        musicContext: null, // Clear context since we're actively playing
      });

      // Start first song
      await loadAndPlaySong(0, withFade);
    },

    duckVolume: () => {
      const state = get();

      if (!state.currentSong || state.isDucked || state.isFading) {
        return;
      }

      // Save context before ducking
      set({
        musicContext: {
          playlist: state.playlist,
          currentIndex: state.currentSongIndex,
          isLooping: state.isLooping,
          wasPlaying: state.isPlaying,
          wasDucked: true,
        },
      });

      // Clear any existing timeouts
      if (state.duckingTimeout) {
        clearTimeout(state.duckingTimeout);
      }
      if (state.fadeInterval) {
        clearInterval(state.fadeInterval);
      }

      // Start fade out
      let currentVolume = state.currentVolume;
      const volumeStep = (state.currentVolume - DUCK_VOLUME) / FADE_STEPS;

      set({isFading: true});

      const interval = setInterval(() => {
        currentVolume -= volumeStep;

        if (currentVolume <= DUCK_VOLUME) {
          currentVolume = DUCK_VOLUME;
          state.currentSong?.setVolume(currentVolume);
          clearInterval(interval);

          // Set cleanup timeout after fade completes
          const timeout = setTimeout(() => {
            const currentState = get();
            if (currentState.isDucked && currentState.currentSong) {
              currentState.currentSong.stop();
              currentState.currentSong.release();
              set({
                currentSong: null,
                isPlaying: false,
                isDucked: false,
                isFading: false,
                duckingTimeout: null,
                fadeInterval: null,
                playlist: [],
                currentSongIndex: 0,
                currentVolume: 1.0,
              });
            }
          }, DUCK_CLEANUP_DELAY);

          set({
            isDucked: true,
            isPlaying: false,
            isFading: false,
            currentVolume: DUCK_VOLUME,
            duckingTimeout: timeout,
            fadeInterval: null,
          });
        } else {
          state.currentSong?.setVolume(currentVolume);
          set({currentVolume});
        }
      }, FADE_INTERVAL);

      set({fadeInterval: interval});
    },

    restoreVolume: () => {
      const state = get();

      if (!state.currentSong || !state.isDucked || state.isFading) {
        return;
      }

      // Clear timeouts
      if (state.duckingTimeout) {
        clearTimeout(state.duckingTimeout);
      }
      if (state.fadeInterval) {
        clearInterval(state.fadeInterval);
      }

      // Start fade in
      let currentVolume = state.currentVolume;
      const targetVolume = 1.0;
      const volumeStep = (targetVolume - currentVolume) / FADE_STEPS;

      set({isFading: true});

      const interval = setInterval(() => {
        currentVolume += volumeStep;

        if (currentVolume >= targetVolume) {
          currentVolume = targetVolume;
          state.currentSong?.setVolume(currentVolume);
          clearInterval(interval);

          set({
            isDucked: false,
            isPlaying: true,
            isFading: false,
            currentVolume: targetVolume,
            duckingTimeout: null,
            fadeInterval: null,
          });
        } else {
          state.currentSong?.setVolume(currentVolume);
          set({currentVolume});
        }
      }, FADE_INTERVAL);

      set({fadeInterval: interval});
    },

    stopCurrentSong: (clearContext = true) => {
      const state = get();

      // Save context before stopping (unless explicitly told not to)
      if (clearContext && (state.isPlaying || state.isDucked)) {
        set({
          musicContext: {
            playlist: state.playlist,
            currentIndex: state.currentSongIndex,
            isLooping: state.isLooping,
            wasPlaying: state.isPlaying,
            wasDucked: state.isDucked,
          },
        });
      }

      // Clear all timeouts/intervals
      if (state.duckingTimeout) {
        clearTimeout(state.duckingTimeout);
      }
      if (state.fadeInterval) {
        clearInterval(state.fadeInterval);
      }

      // Stop and clean up sound
      if (state.currentSong) {
        state.currentSong.stop();
        state.currentSong.release();
      }

      // Reset playback state
      set({
        currentSong: null,
        isPlaying: false,
        isDucked: false,
        isFading: false,
        duckingTimeout: null,
        fadeInterval: null,
        playlist: [],
        currentSongIndex: 0,
        currentVolume: 1.0,
        ...(clearContext && {musicContext: null}), // Only clear context if requested
      });
    },

    setIsMusicEnabled: async (enabled: boolean) => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(enabled));
      set({isMusicEnabled: enabled});
      // The subscription will handle the music state changes
    },

    _handleMusicEnabledChange: async (enabled: boolean) => {
      const state = get();

      if (!enabled) {
        // Music disabled - save current state and stop
        if (state.isPlaying || state.isDucked) {
          set({
            musicContext: {
              playlist: state.playlist,
              currentIndex: state.currentSongIndex,
              isLooping: state.isLooping,
              wasPlaying: state.isPlaying,
              wasDucked: state.isDucked,
            },
          });
          get().stopCurrentSong(false); // Don't clear context
        }
      } else {
        // Music enabled - restore previous state if available
        if (state.musicContext?.wasPlaying) {
          const context = state.musicContext;

          if (context.wasDucked) {
            // Start the song but immediately duck it
            await get().startNewSong(context.playlist, {
              loop: context.isLooping,
              withFade: false,
            });
            get().duckVolume();
          } else {
            // Resume normal playback
            await get().startNewSong(context.playlist, {
              loop: context.isLooping,
              withFade: false,
            });
          }
        }
      }
    },
  })),
);

// Set up subscription to isMusicEnabled changes
useSongPlayerStore.subscribe(
  state => state.isMusicEnabled,
  enabled => {
    useSongPlayerStore.getState()._handleMusicEnabledChange(enabled);
  },
);

const checkSongEnabled = async () => {
  const value = await AsyncStorage.getItem(STORAGE_KEY);
  return JSON.parse(value ?? 'false');
};

// Initialize from storage
checkSongEnabled().then(value =>
  useSongPlayerStore.getState().setIsMusicEnabled(value),
);

// Helper functions
const loadAndPlaySong = async (songIndex: number, withFade: boolean) => {
  const state = useSongPlayerStore.getState();
  const songFile = state.playlist[songIndex];

  if (!songFile) {
    return;
  }

  return new Promise<void>((resolve, reject) => {
    const sound = new Sound(songFile, Sound.MAIN_BUNDLE, error => {
      if (error) {
        console.error('Failed to load song:', error, songFile);
        reject(error);
        return;
      }

      sound.setNumberOfLoops(0);
      const initialVolume = withFade ? 0.0 : 1.0;
      sound.setVolume(initialVolume);

      useSongPlayerStore.setState({
        currentSong: sound,
        currentSongIndex: songIndex,
        isPlaying: true,
        currentVolume: initialVolume,
      });

      checkSongEnabled().then(enabled => {
        if (enabled) {
          sound.play(success => {
            if (!success) {
              console.error('Song playback failed');
              reject(new Error('Playback failed'));
              return;
            }

            // Handle song end for playlist progression
            const currentState = useSongPlayerStore.getState();
            if (!currentState.isDucked && !currentState.isFading) {
              if (songIndex < currentState.playlist.length - 1) {
                const nextIndex = songIndex + 1;
                loadAndPlaySong(nextIndex, false);
              } else if (currentState.isLooping) {
                loadAndPlaySong(0, false);
              } else {
                useSongPlayerStore.setState({
                  isPlaying: false,
                  currentSong: null,
                });
              }
            }
          });

          if (withFade) {
            fadeInSong(sound);
          }
        }
        resolve();
      });
    });
  });
};

const fadeInSong = (sound: Sound) => {
  let currentVolume = 0.0;
  const volumeStep = 1.0 / FADE_STEPS;

  useSongPlayerStore.setState({isFading: true});

  const interval = setInterval(() => {
    currentVolume += volumeStep;

    if (currentVolume >= 1.0) {
      currentVolume = 1.0;
      sound.setVolume(currentVolume);
      clearInterval(interval);

      useSongPlayerStore.setState({
        isFading: false,
        currentVolume: currentVolume,
        fadeInterval: null,
      });
    } else {
      sound.setVolume(currentVolume);
      useSongPlayerStore.setState({currentVolume});
    }
  }, FADE_INTERVAL);

  useSongPlayerStore.setState({fadeInterval: interval});
};

// Cleanup function
export const cleanupSongPlayer = () => {
  const state = useSongPlayerStore.getState();

  if (state.duckingTimeout) {
    clearTimeout(state.duckingTimeout);
  }
  if (state.fadeInterval) {
    clearInterval(state.fadeInterval);
  }

  if (state.currentSong) {
    state.currentSong.stop();
    state.currentSong.release();
  }

  useSongPlayerStore.setState({
    currentSong: null,
    isPlaying: false,
    isDucked: false,
    isFading: false,
    duckingTimeout: null,
    fadeInterval: null,
    playlist: [],
    currentSongIndex: 0,
    currentVolume: 1.0,
    musicContext: null,
  });
};

// Custom hooks
export const useSongPlayer = () => {
  const {
    startNewSong,
    duckVolume,
    restoreVolume,
    stopCurrentSong,
    isPlaying,
    isDucked,
    isFading,
  } = useSongPlayerStore();
  return {
    startNewSong,
    duckVolume,
    restoreVolume,
    stopCurrentSong,
    isPlaying,
    isDucked,
    isFading,
  };
};

export {useSongPlayerStore};
