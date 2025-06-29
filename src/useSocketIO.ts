import {useEffect} from 'react';
import {useGameStore} from './store/gameStore';
import {useRoomStore} from './store/roomStore';
import {useSocket} from './store/socketStore';
import {useUser} from './store/userStore';

const useSocketIO = () => {
  useEffect(() => {
    // Initialize user store
    useUser.getState().init();

    // Initialize socket connection
    const socket = useSocket.getState();
    socket.connect();

    // Register all socket event listeners
    const roomStore = useRoomStore.getState();
    const gameStore = useGameStore.getState();

    // Room events
    socket.on('room_created', ({roomId, players, config}) => {
      roomStore.setRoomCreated({roomId, players, config});
    });

    socket.on('player_joined', ({players, config}) => {
      roomStore.setPlayersJoined({players, config});
    });

    socket.on('player_left', ({players}) => {
      roomStore.setPlayerLeft({players});
    });

    socket.on('start_game', ({roomId, config, players}) => {
      roomStore.setGameStarted({roomId, config, players});
    });

    socket.on('room_error', ({message}) => {
      roomStore.setRoomError({message});
    });

    // Game events
    socket.on('game_initialized', data => {
      gameStore.setGameInitialized(data);
    });

    socket.on('turn_started', data => {
      gameStore.setTurnStarted(data);
    });

    socket.on('player_drew', data => {
      gameStore.playerDrew(data);
    });

    socket.on('game_ended', data => {
      gameStore.setGameEnded(data);
    });

    socket.on('game_error', data => {
      gameStore.setGameError(data);
    });

    socket.on('yaniv', data => {
      gameStore.onYaniv(data);
    });

    socket.on('assaf', data => {
      gameStore.onAssaf(data);
    });

    socket.on('round_ended', data => {
      gameStore.setRoundEnded(data);
    });

    // Cleanup on app unmount
    return () => {
      socket.disconnect();
    };
  }, []);
};

export default useSocketIO;
