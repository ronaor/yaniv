import Sound from 'react-native-sound';
import {create} from 'zustand';
import {useSoundStore} from '../hooks/useSound';

interface SongPlayerState {
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
}

interface SongPlayerActions {
  startNewSong: (
    songs: string[],
    options?: {withFade?: boolean; loop?: boolean},
  ) => Promise<void>;
  duckVolume: () => void;
  restoreVolume: () => void;
  stopCurrentSong: () => void;
}

type SongPlayerStore = SongPlayerState & SongPlayerActions;

const DUCK_VOLUME = 0.1;
const DUCK_CLEANUP_DELAY = 5000; // 5 seconds
const FADE_DURATION = 2500; // 2.5 seconds
const FADE_STEPS = 25;
const FADE_INTERVAL = FADE_DURATION / FADE_STEPS;

const useSongPlayerStore = create<SongPlayerStore>((set, get) => ({
  // State
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

  // Actions
  startNewSong: async (songs, options = {}) => {
    const {withFade = false, loop = false} = options;
    const state = get();

    // Check if sound is globally enabled
    const isSoundEnabled = useSoundStore.getState().isSoundEnabled;
    if (!isSoundEnabled) {
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
      get().stopCurrentSong();
    }

    // Set new playlist
    set({
      playlist: songs,
      currentSongIndex: 0,
      isLooping: loop,
    });

    // Start first song
    await loadAndPlaySong(0, withFade);
  },

  duckVolume: () => {
    const state = get();

    if (!state.currentSong || state.isDucked || state.isFading) {
      return;
    }

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

  stopCurrentSong: () => {
    const state = get();

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

    // Reset state
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
  },
}));

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

      resolve();
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
