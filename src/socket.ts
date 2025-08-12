import {io, Socket} from 'socket.io-client';
import {SERVER_URL} from '@env';

const serverUrl = SERVER_URL ?? 'https://yaniv-backend.onrender.com';

const socket: Socket = io(serverUrl, {
  transports: ['polling', 'websocket'],
  autoConnect: false,
});

export default socket;
