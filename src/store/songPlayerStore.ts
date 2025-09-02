import Sound from 'react-native-sound';
import {create} from 'zustand';
import {useSoundStore} from '../hooks/useSound';

interface SongPlayerState {
  currentSong: Sound | null;
  nextSong: Sound | null; // For smooth transitions during fade
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

const useSongPlayerStore = create<SongPlayerStore>((set, get) => ({
  // State
  currentSong: null,
  nextSong: null,
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

    // Check if same playlist is already playing
    const isSamePlaylist =
      state.playlist.length === songs.length &&
      state.playlist.every((song, index) => song === songs[index]) &&
      state.isLooping === loop &&
      state.isPlaying;

    // Check if trying to start same single song that's already playing
    const isSameSingleSong =
      songs.length === 1 &&
      state.playlist.length > 0 &&
      state.playlist[state.currentSongIndex] === songs[0] &&
      state.isPlaying;

    if (isSamePlaylist || isSameSingleSong) {
      console.log('Same song/playlist already playing, skipping restart');
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

      // Individual songs don't loop - playlist handles looping
      sound.setNumberOfLoops(0);

      // Set initial volume
      const initialVolume = withFade ? 0.0 : 1.0;
      sound.setVolume(initialVolume);

      // Clean up any existing nextSong to ensure max 2 sounds
      const currentState = useSongPlayerStore.getState();
      if (currentState.nextSong) {
        currentState.nextSong.release();
      }

      // Update state - move current to next if fading, otherwise replace current
      if (withFade && currentState.currentSong) {
        useSongPlayerStore.setState({
          nextSong: sound,
          currentSongIndex: songIndex,
        });
      } else {
        useSongPlayerStore.setState({
          currentSong: sound,
          nextSong: null,
          currentSongIndex: songIndex,
          isPlaying: true,
        });
      }

      // Start playing
      sound.play(success => {
        if (!success) {
          console.error('Song playback failed');
          reject(new Error('Playback failed'));
          return;
        }

        // Handle song end for playlist progression
        if (songIndex < state.playlist.length - 1) {
          // Move to next song in playlist
          const nextIndex = songIndex + 1;
          loadAndPlaySong(nextIndex, withFade);
        } else if (state.isLooping) {
          // Loop back to first song in playlist
          loadAndPlaySong(0, withFade);
        } else {
          // Playlist ended (no loop)
          useSongPlayerStore.setState({
            isPlaying: false,
            currentSong: null,
            nextSong: null,
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

      // Promote nextSong to currentSong and clean up old current
      const currentState = useSongPlayerStore.getState();
      if (currentState.nextSong === sound && currentState.currentSong) {
        currentState.currentSong.release();
        useSongPlayerStore.setState({
          currentSong: sound,
          nextSong: null,
          isPlaying: true,
          isFading: false,
          fadeInterval: null,
        });
      } else {
        useSongPlayerStore.setState({
          isFading: false,
          fadeInterval: null,
        });
      }
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
          nextSong: null,
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
  const {currentSong, nextSong, fadeInterval} = state;

  // Clear any ongoing fade
  if (fadeInterval) {
    clearInterval(fadeInterval);
  }

  // Stop and clean up all sounds
  if (currentSong) {
    currentSong.stop();
    currentSong.release();
  }
  if (nextSong) {
    nextSong.stop();
    nextSong.release();
  }

  // Reset state
  useSongPlayerStore.setState({
    currentSong: null,
    nextSong: null,
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

// Custom hooks for cleaner usage
export const useSongPlayer = () => {
  const {startNewSong, stopCurrentSong, isPlaying, isFading} =
    useSongPlayerStore();
  return {startNewSong, stopCurrentSong, isPlaying, isFading};
};

export {useSongPlayerStore};
