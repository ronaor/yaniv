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
      //TODO
      roomStore.setRoomCreated({
        roomId,
        players,
        config,
      });
    });

    socket.on(
      'player_joined',
      ({roomId, players, config, canStartTheGameIn10Sec}) => {
        roomStore.setPlayersJoined({
          roomId,
          players,
          config,
          canStartTheGameIn10Sec,
        });
      },
    );

    socket.on('votes_config', ({roomId, votes}) => {
      roomStore.setRoomConfigVotes({roomId, votes});
    });

    socket.on('player_left', ({players, votes}) => {
      roomStore.setPlayerLeft({players, votes});
    });

    socket.on('start_game', ({roomId, config, players, votes}) => {
      roomStore.setGameStarted({roomId, config, players, votes});
    });

    socket.on('room_error', ({message}) => {
      roomStore.setRoomError({message});
    });

    // Game events
    socket.on('game_initialized', data => {
      gameStore.setGameInitialized(data);
    });

    socket.on('new_round', data => {
      gameStore.setNewRound(data);
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
