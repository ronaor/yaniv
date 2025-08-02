import {useEffect} from 'react';
import {useRoomStore} from './store/roomStore';
import {useSocket} from './store/socketStore';
import {useUser} from './store/userStore';
import {useYanivGameStore} from './store/yanivGameStore';

const useSocketIO = () => {
  useEffect(() => {
    // Initialize user store
    useUser.getState().init();

    // Initialize socket connection
    const socket = useSocket.getState();
    socket.connect();

    // Register all socket event listeners
    const roomStore = useRoomStore.getState();
    const gameStore = useYanivGameStore.getState();

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

    socket.on('player_left', ({roomId, playerId, players, votes}) => {
      roomStore.setPlayerLeft({roomId, playerId, players, votes});
    });

    socket.on('kick_out_from_room', ({roomId}) =>
      roomStore.triggerCallback('kickout', roomId),
    );

    socket.on('start_game', ({roomId, config, players, votes}) => {
      roomStore.setGameStarted({roomId, config, players, votes});
    });

    socket.on('room_error', ({message}) => {
      roomStore.setRoomError({message});
    });

    // Game events
    socket.on('game_initialized', data => {
      gameStore.subscribed.gameInitialized(data);
    });

    socket.on('new_round', data => {
      gameStore.subscribed.newRound(data);
    });

    socket.on('player_drew', data => {
      gameStore.subscribed.playerDrew(data);
    });

    socket.on('game_ended', data => {
      gameStore.subscribed.gameEnded(data);
    });

    socket.on('game_error', data => {
      gameStore.subscribed.setGameError(data);
    });

    socket.on('round_ended', data => {
      gameStore.subscribed.roundEnded(data);
    });

    socket.on('set_playersStats_data', ({roomId, playerId, playersStats}) => {
      gameStore.subscribed.setPlayAgain({roomId, playerId, playersStats});
    });

    // Cleanup on app unmount
    return () => {
      socket.disconnect();
    };
  }, []);
};

export default useSocketIO;
