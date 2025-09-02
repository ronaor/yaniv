import Sound from 'react-native-sound';
import {create} from 'zustand';
import {useSoundStore} from '../hooks/useSound';

interface SongPlayerState {
  currentSong: Sound | null;
  playlist: string[];
  currentSongIndex: number;
  isPlaying: boolean;
  isLooping: boolean;
  isFading: boolean;
  fadeInterval: NodeJS.Timeout | null;
}

interface SongPlayerActions {
  startNewSong: (
    songs: string[],
    options?: {withFade?: boolean; loop?: boolean},
  ) => Promise<void>;
  stopCurrentSong: (options?: {withFade?: boolean}) => Promise<void>;
}

type SongPlayerStore = SongPlayerState & SongPlayerActions;

const FADE_DURATION = 5000; // 5 seconds
const FADE_STEPS = 50; // Number of volume steps
const FADE_INTERVAL = FADE_DURATION / FADE_STEPS;

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

      // Set loop if needed
      sound.setNumberOfLoops(state.isLooping ? -1 : 0);

      // Set initial volume
      const initialVolume = withFade ? 0.0 : 1.0;
      sound.setVolume(initialVolume);

      // Update state
      useSongPlayerStore.setState({
        currentSong: sound,
        currentSongIndex: songIndex,
        isPlaying: true,
      });

      // Start playing
      sound.play(success => {
        if (!success) {
          console.error('Song playback failed');
          reject(new Error('Playback failed'));
          return;
        }

        // Handle song end for playlist progression
        if (!state.isLooping && songIndex < state.playlist.length - 1) {
          // Move to next song
          const nextIndex = songIndex + 1;
          loadAndPlaySong(nextIndex, withFade);
        } else if (
          !state.isLooping &&
          songIndex === state.playlist.length - 1
        ) {
          // Playlist ended
          useSongPlayerStore.setState({
            isPlaying: false,
            currentSong: null,
          });
        }
      });

      // Fade in if requested
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
        fadeInterval: null,
      });
    } else {
      sound.setVolume(currentVolume);
    }
  }, FADE_INTERVAL);

  useSongPlayerStore.setState({fadeInterval: interval});
};

const fadeOutCurrentSong = async (): Promise<void> => {
  const state = useSongPlayerStore.getState();
  const {currentSong} = state;

  if (!currentSong) {
    return;
  }

  return new Promise(resolve => {
    let currentVolume = 1.0;
    const volumeStep = 1.0 / FADE_STEPS;

    useSongPlayerStore.setState({isFading: true});

    const interval = setInterval(() => {
      currentVolume -= volumeStep;

      if (currentVolume <= 0.0) {
        currentVolume = 0.0;
        currentSong.setVolume(currentVolume);
        clearInterval(interval);

        // Stop and clean up
        currentSong.stop();
        currentSong.release();

        useSongPlayerStore.setState({
          currentSong: null,
          isPlaying: false,
          isFading: false,
          fadeInterval: null,
          playlist: [],
          currentSongIndex: 0,
        });

        resolve();
      } else {
        currentSong.setVolume(currentVolume);
      }
    }, FADE_INTERVAL);

    useSongPlayerStore.setState({fadeInterval: interval});
  });
};

const stopImmediately = () => {
  const state = useSongPlayerStore.getState();
  const {currentSong, fadeInterval} = state;

  // Clear any ongoing fade
  if (fadeInterval) {
    clearInterval(fadeInterval);
  }

  // Stop and clean up current song
  if (currentSong) {
    currentSong.stop();
    currentSong.release();
  }

  // Reset state
  useSongPlayerStore.setState({
    currentSong: null,
    isPlaying: false,
    isFading: false,
    fadeInterval: null,
    playlist: [],
    currentSongIndex: 0,
  });
};

// Cleanup function to be called when app closes or component unmounts
export const cleanupSongPlayer = () => {
  stopImmediately();
};

// Export the store
export const useSongPlayerStore = create<SongPlayerStore>((set, get) => ({
  // State
  currentSong: null,
  playlist: [],
  currentSongIndex: 0,
  isPlaying: false,
  isLooping: false,
  isFading: false,
  fadeInterval: null,

  // Actions
  startNewSong: async (songs, options = {}) => {
    const {withFade = false, loop = false} = options;
    const state = get();

    // Check if sound is globally enabled
    const isSoundEnabled = useSoundStore.getState().isSoundEnabled;
    if (!isSoundEnabled) {
      return;
    }

    // Stop current song if playing
    if (state.currentSong) {
      await get().stopCurrentSong({withFade});
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

  stopCurrentSong: async (options = {}) => {
    const {withFade = false} = options;
    const state = get();

    if (!state.currentSong) {
      return;
    }

    if (withFade) {
      await fadeOutCurrentSong();
    } else {
      stopImmediately();
    }
  },
}));

// Custom hooks for cleaner usage
export const useSongPlayer = () => {
  const {startNewSong, stopCurrentSong, isPlaying, isFading} =
    useSongPlayerStore();
  return {startNewSong, stopCurrentSong, isPlaying, isFading};
};
