declare module 'react-native-sound' {
  interface SoundOptions {
    volume?: number;
    numberOfLoops?: number;
    // Add other options as needed
  }

  export default class Sound {
    static MAIN_BUNDLE: string | undefined;
    static setCategory(category: string): void;

    constructor(
      file: string,
      basePath?: string,
      onError?: (error: Error) => void,
    );

    play(onSuccess?: (success: boolean) => void): void;
    pause(): void;
    stop(): void;
    release(): void;
    setVolume(volume: number): void;
    // Add other methods as needed
  }
}
